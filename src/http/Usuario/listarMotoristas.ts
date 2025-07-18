import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function listarMotoristas(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Schema de validação para query parameters
    const querySchema = z.object({
      page: z.string().optional().transform(val => parseInt(val || "1")),
      limit: z.string().optional().transform(val => parseInt(val || "10")),
      search: z.string().optional(),
      avaliacaoMin: z.string().optional().transform(val => parseFloat(val || "0")),
      avaliacaoMax: z.string().optional().transform(val => parseFloat(val || "5")),
      ordenarPor: z.enum(["nome", "avaliacao", "totalAvaliacoes", "membroDesde", "totalCorridas"]).optional().default("nome"),
      ordem: z.enum(["asc", "desc"]).optional().default("asc"),
      apenasAtivos: z.string().optional().transform(val => val === "true"),
      apenasVerificados: z.string().optional().transform(val => val === "true")
    });

    const {
      page = 1,
      limit = 10,
      search,
      avaliacaoMin = 0,
      avaliacaoMax = 5,
      ordenarPor = "nome",
      ordem = "asc",
      apenasAtivos = false,
      apenasVerificados = false
    } = querySchema.parse(request.query);

    // Validar limites de paginação
    if (page < 1) {
      return reply.status(400).send({ error: "Página deve ser maior que 0" });
    }

    if (limit < 1 || limit > 50) {
      return reply.status(400).send({ error: "Limite deve estar entre 1 e 50" });
    }

    // Construir filtros
    const where: any = {
      usuario: {
        tipo: "MOTORISTA"
      }
    };

    // Filtro de busca por nome ou email
    if (search) {
      where.usuario.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    // Filtro por avaliação
    if (avaliacaoMin > 0 || avaliacaoMax < 5) {
      where.avaliacaoMedia = {
        gte: avaliacaoMin,
        lte: avaliacaoMax
      };
    }

    // Filtro por status ativo (removido pois não existe no schema)
    // if (apenasAtivos) {
    //   where.usuario.ativo = true;
    // }

    // Filtro por verificação
    if (apenasVerificados) {
      where.verificado = true;
    }

    // Construir ordenação
    const orderBy: any = {};
    
    switch (ordenarPor) {
      case "nome":
        orderBy.usuario = { nome: ordem };
        break;
      case "avaliacao":
        orderBy.avaliacaoMedia = ordem;
        break;
      case "totalAvaliacoes":
        orderBy.totalAvaliacoes = ordem;
        break;
      case "membroDesde":
        orderBy.usuario = { criadoEm: ordem };
        break;
      case "totalCorridas":
        orderBy._count = { corridas: ordem };
        break;
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar motoristas com informações relacionadas
    const [motoristas, total] = await Promise.all([
      prisma.perfilMotorista.findMany({
        where,
        include: {
                     usuario: {
             select: {
               id: true,
               nome: true,
               email: true,
               telefone: true,
               dataNasc: true,
               criadoEm: true,
               atualizadoEm: true
             }
           },
          veiculos: {
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
          corridas: {
            where: {
              status: {
                in: ["AGENDADA", "EM_ANDAMENTO", "FINALIZADA"]
              }
            },
            select: {
              id: true,
              status: true,
              tipo: true,
              criadoEm: true
            }
          },
                     _count: {
             select: {
               veiculos: true,
               corridas: true
             }
           }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.perfilMotorista.count({ where })
    ]);

    // Calcular estatísticas dos motoristas encontrados
    const estatisticas = {
      totalMotoristas: total,
      mediaAvaliacao: 0,
      totalCorridas: 0,
      totalVeiculos: 0,
      motoristasAtivos: 0,
      motoristasVerificados: 0
    };

    if (motoristas.length > 0) {
      const avaliacoes = motoristas.map((m: any) => m.avaliacaoMedia).filter((a: any) => a > 0);
      estatisticas.mediaAvaliacao = avaliacoes.length > 0 
        ? avaliacoes.reduce((sum: any, a: any) => sum + a, 0) / avaliacoes.length 
        : 0;

      estatisticas.totalCorridas = motoristas.reduce((sum: any, m: any) => sum + m._count.corridas, 0);
      estatisticas.totalVeiculos = motoristas.reduce((sum: any, m: any) => sum + m._count.veiculos, 0);
      estatisticas.motoristasAtivos = motoristas.length; // Todos os motoristas listados são considerados ativos
      estatisticas.motoristasVerificados = motoristas.filter((m: any) => m.verificado).length;
    }

    // Formatar resposta dos motoristas
    const motoristasFormatados = motoristas.map((motorista: any) => {
      // Calcular idade
      const hoje = new Date();
      const dataNasc = new Date(motorista.usuario.dataNasc);
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      const mesAtual = hoje.getMonth();
      const mesNasc = dataNasc.getMonth();
      const idadeAjustada = (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) 
        ? idade - 1 
        : idade;

      // Calcular tempo como membro
      const tempoMembro = Math.floor((hoje.getTime() - motorista.usuario.criadoEm.getTime()) / (1000 * 60 * 60 * 24));

      // Estatísticas de corridas por status
      const corridasPorStatus = {
        agendadas: motorista.corridas.filter((c: any) => c.status === "AGENDADA").length,
        emAndamento: motorista.corridas.filter((c: any) => c.status === "EM_ANDAMENTO").length,
        finalizadas: motorista.corridas.filter((c: any) => c.status === "FINALIZADA").length
      };

      return {
        id: motorista.usuario.id,
        perfilMotoristaId: motorista.id, // <-- Adiciona o id do perfil do motorista
        nome: motorista.usuario.nome,
        email: motorista.usuario.email,
        telefone: motorista.usuario.telefone,
        dataNasc: motorista.usuario.dataNasc,
        idade: idadeAjustada,
        cnh: motorista.cnh,
        verificado: motorista.verificado,
        ativo: motorista.usuario.ativo,
        avaliacaoMedia: motorista.avaliacaoMedia,
        totalAvaliacoes: motorista.totalAvaliacoes,
        membroDesde: motorista.usuario.criadoEm,
        tempoMembro: tempoMembro,
        atualizadoEm: motorista.usuario.atualizadoEm,
        
        estatisticas: {
          totalVeiculos: motorista._count.veiculos,
          totalCorridas: motorista._count.corridas,
          totalAvaliacoesRecebidas: motorista._count.avaliacoesRecebidas,
          totalAvaliacoesFeitas: motorista._count.avaliacoesFeitas,
          corridasPorStatus
        },
        
        veiculos: motorista.veiculos.map((veiculo: any) => ({
          id: veiculo.id,
          placa: veiculo.placa,
          marca: veiculo.marca,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          cor: veiculo.cor,
          capacidade: veiculo.capacidade,
          suporteCriancas: veiculo.suporteCriancas,
          suporteDeficientes: veiculo.suporteDeficientes
        })),
        
        ultimasCorridas: motorista.corridas
          .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
          .slice(0, 5)
          .map((corrida: any) => ({
            id: corrida.id,
            status: corrida.status,
            tipo: corrida.tipo,
            criadoEm: corrida.criadoEm
          }))
      };
    });

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return reply.status(200).send({
      message: "Motoristas listados com sucesso",
      motoristas: motoristasFormatados,
      paginacao: {
        pagina: page,
        limite: limit,
        total: total,
        totalPaginas: totalPages,
        temProximaPagina: hasNextPage,
        temPaginaAnterior: hasPrevPage,
        proximaPagina: hasNextPage ? page + 1 : null,
        paginaAnterior: hasPrevPage ? page - 1 : null
      },
      estatisticas,
      filtros: {
        search,
        avaliacaoMin,
        avaliacaoMax,
        ordenarPor,
        ordem,
        apenasAtivos,
        apenasVerificados
      }
    });

  } catch (error) {
    console.error("Erro ao listar motoristas:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Parâmetros de consulta inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 