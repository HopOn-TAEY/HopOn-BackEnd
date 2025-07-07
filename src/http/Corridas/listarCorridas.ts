import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function listarCorridas(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Schema de validação para query parameters
    const querySchema = z.object({
      status: z.enum(["AGENDADA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"]).optional(),
      tipo: z.enum(["PRIVADA", "RECORRENTE"]).optional(),
      origem: z.string().optional(),
      destino: z.string().optional(),
      dataInicio: z.string().transform((val) => new Date(val)).optional(),
      dataFim: z.string().transform((val) => new Date(val)).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      page: z.coerce.number().int().min(1).default(1)
    });

    const query = querySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    // Construir filtros
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.origem) {
      where.origem = {
        contains: query.origem,
        mode: 'insensitive'
      };
    }

    if (query.destino) {
      where.destino = {
        contains: query.destino,
        mode: 'insensitive'
      };
    }

    if (query.dataInicio || query.dataFim) {
      where.dataHoraSaida = {};
      if (query.dataInicio) {
        where.dataHoraSaida.gte = query.dataInicio;
      }
      if (query.dataFim) {
        where.dataHoraSaida.lte = query.dataFim;
      }
    }

    // Buscar corridas com informações relacionadas
    const [corridas, total] = await Promise.all([
      prisma.corrida.findMany({
        where,
        include: {
          motorista: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  telefone: true
                }
              }
            }
          },
          veiculo: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              ano: true,
              cor: true,
              capacidade: true,
              suporteCriancas: true,
              suporteDeficientes: true
            }
          },
          corridaRecorrente: {
            select: {
              id: true,
              diasSemana: true,
              dataInicio: true,
              dataFim: true,
              ativa: true
            }
          },
          _count: {
            select: {
              reservas: true
            }
          }
        },
        orderBy: {
          dataHoraSaida: 'asc'
        },
        skip,
        take: query.limit
      }),
      prisma.corrida.count({ where })
    ]);

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    // Formatar resposta
    const corridasFormatadas = corridas.map(corrida => ({
      id: corrida.id,
      origem: corrida.origem,
      destino: corrida.destino,
      latitudeOrigem: corrida.latitudeOrigem,
      longitudeOrigem: corrida.longitudeOrigem,
      latitudeDestino: corrida.latitudeDestino,
      longitudeDestino: corrida.longitudeDestino,
      dataHoraSaida: corrida.dataHoraSaida,
      dataHoraChegada: corrida.dataHoraChegada,
      numeroVagas: corrida.numeroVagas,
      vagasOcupadas: corrida.vagasOcupadas,
      vagasDisponiveis: corrida.numeroVagas - corrida.vagasOcupadas,
      preco: corrida.preco,
      observacoes: corrida.observacoes,
      status: corrida.status,
      tipo: corrida.tipo,
      criadoEm: corrida.criadoEm,
      atualizadoEm: corrida.atualizadoEm,
      motorista: {
        id: corrida.motorista.usuario.id,
        nome: corrida.motorista.usuario.nome,
        email: corrida.motorista.usuario.email,
        telefone: corrida.motorista.usuario.telefone,
        cnh: corrida.motorista.cnh,
        avaliacaoMedia: corrida.motorista.avaliacaoMedia,
        totalAvaliacoes: corrida.motorista.totalAvaliacoes
      },
      veiculo: {
        id: corrida.veiculo.id,
        placa: corrida.veiculo.placa,
        marca: corrida.veiculo.marca,
        modelo: corrida.veiculo.modelo,
        ano: corrida.veiculo.ano,
        cor: corrida.veiculo.cor,
        capacidade: corrida.veiculo.capacidade,
        suporteCriancas: corrida.veiculo.suporteCriancas,
        suporteDeficientes: corrida.veiculo.suporteDeficientes
      },
      corridaRecorrente: corrida.corridaRecorrente,
      totalReservas: corrida._count.reservas
    }));

    return reply.status(200).send({
      message: "Corridas listadas com sucesso",
      paginacao: {
        pagina: query.page,
        totalPaginas: totalPages,
        totalItens: total,
        itensPorPagina: query.limit,
        temProximaPagina: hasNextPage,
        temPaginaAnterior: hasPreviousPage
      },
      filtros: {
        status: query.status,
        tipo: query.tipo,
        origem: query.origem,
        destino: query.destino,
        dataInicio: query.dataInicio,
        dataFim: query.dataFim
      },
      corridas: corridasFormatadas
    });

  } catch (error) {
    console.error("Erro ao listar corridas:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Parâmetros de consulta inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 