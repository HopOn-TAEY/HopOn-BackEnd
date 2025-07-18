import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function buscarCorrida(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Schema de validação para o parâmetro da corrida
    const paramsSchema = z.object({
      id: z.string().cuid("ID da corrida deve ser válido")
    });

    const { id: corridaId } = paramsSchema.parse(request.params);

    // Buscar a corrida com todas as informações relacionadas
    const corrida = await prisma.corrida.findUnique({
      where: {
        id: corridaId
      },
      include: {
        motorista: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                dataNasc: true,
                criadoEm: true
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
            suporteDeficientes: true,
            criadoEm: true
          }
        },
        corridaRecorrente: {
          select: {
            id: true,
            diasSemana: true,
            dataInicio: true,
            dataFim: true,
            ativa: true,
            criadoEm: true
          }
        },
        reservas: {
          include: {
            passageiro: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true
              }
            }
          },
          orderBy: {
            criadoEm: 'asc'
          }
        },
        avaliacoes: {
          include: {
            avaliador: {
              select: {
                id: true,
                nome: true
              }
            },
            avaliado: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            criadoEm: 'desc'
          }
        },
        _count: {
          select: {
            reservas: true,
            avaliacoes: true
          }
        }
      }
    });

    if (!corrida) {
      return reply.status(404).send({ error: "Corrida não encontrada" });
    }

    // Calcular vagas disponíveis
    const vagasDisponiveis = corrida.numeroVagas - corrida.vagasOcupadas;

    // Formatar reservas por status
    const reservasPorStatus = {
      PENDENTE: corrida.reservas.filter(r => r.status === "PENDENTE"),
      CONFIRMADA: corrida.reservas.filter(r => r.status === "CONFIRMADA"),
      CANCELADA: corrida.reservas.filter(r => r.status === "CANCELADA"),
      FINALIZADA: corrida.reservas.filter(r => r.status === "FINALIZADA")
    };

    // Calcular estatísticas de avaliação
    const avaliacoesMotorista = corrida.avaliacoes.filter(a => a.avaliadoId === corrida.motorista.usuario.id);
    const avaliacoesPassageiros = corrida.avaliacoes.filter(a => a.avaliadorId === corrida.motorista.usuario.id);

    const mediaAvaliacoesMotorista = avaliacoesMotorista.length > 0 
      ? avaliacoesMotorista.reduce((sum, a) => sum + a.nota, 0) / avaliacoesMotorista.length 
      : 0;

    const mediaAvaliacoesPassageiros = avaliacoesPassageiros.length > 0 
      ? avaliacoesPassageiros.reduce((sum, a) => sum + a.nota, 0) / avaliacoesPassageiros.length 
      : 0;

    // Formatar resposta
    const corridaFormatada = {
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
      vagasDisponiveis: vagasDisponiveis,
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
        dataNasc: corrida.motorista.usuario.dataNasc,
        cnh: corrida.motorista.cnh,
        avaliacaoMedia: mediaAvaliacoesMotorista,
        totalAvaliacoes: avaliacoesMotorista.length,
        membroDesde: corrida.motorista.usuario.criadoEm
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
        suporteDeficientes: corrida.veiculo.suporteDeficientes,
        registradoEm: corrida.veiculo.criadoEm
      },
      
      corridaRecorrente: corrida.corridaRecorrente ? {
        id: corrida.corridaRecorrente.id,
        diasSemana: corrida.corridaRecorrente.diasSemana,
        dataInicio: corrida.corridaRecorrente.dataInicio,
        dataFim: corrida.corridaRecorrente.dataFim,
        ativa: corrida.corridaRecorrente.ativa,
        criadoEm: corrida.corridaRecorrente.criadoEm
      } : null,
      
      reservas: {
        total: corrida._count.reservas,
        porStatus: {
          pendentes: reservasPorStatus.PENDENTE.length,
          confirmadas: reservasPorStatus.CONFIRMADA.length,
          canceladas: reservasPorStatus.CANCELADA.length,
          finalizadas: reservasPorStatus.FINALIZADA.length
        },
        detalhes: {
          pendentes: reservasPorStatus.PENDENTE.map(r => ({
            id: r.id,
            passageiro: {
              id: r.passageiro.id,
              nome: r.passageiro.nome,
              email: r.passageiro.email,
              telefone: r.passageiro.telefone
            },
            numeroAssentos: r.numeroAssentos,
            observacoes: r.observacoes,
            criadoEm: r.criadoEm
          })),
          confirmadas: reservasPorStatus.CONFIRMADA.map(r => ({
            id: r.id,
            passageiro: {
              id: r.passageiro.id,
              nome: r.passageiro.nome,
              email: r.passageiro.email,
              telefone: r.passageiro.telefone
            },
            numeroAssentos: r.numeroAssentos,
            observacoes: r.observacoes,
            criadoEm: r.criadoEm
          }))
        }
      },
      
      avaliacoes: {
        total: corrida._count.avaliacoes,
        motorista: {
          total: avaliacoesMotorista.length,
          media: mediaAvaliacoesMotorista,
          detalhes: avaliacoesMotorista.map(a => ({
            id: a.id,
            avaliador: {
              id: a.avaliador.id,
              nome: a.avaliador.nome
            },
            nota: a.nota,
            comentario: a.comentario,
            criadoEm: a.criadoEm
          }))
        },
        passageiros: {
          total: avaliacoesPassageiros.length,
          media: mediaAvaliacoesPassageiros,
          detalhes: avaliacoesPassageiros.map(a => ({
            id: a.id,
            avaliado: {
              id: a.avaliado.id,
              nome: a.avaliado.nome
            },
            nota: a.nota,
            comentario: a.comentario,
            criadoEm: a.criadoEm
          }))
        }
      },
      
      estatisticas: {
        ocupacao: {
          percentual: (corrida.vagasOcupadas / corrida.numeroVagas) * 100,
          vagasOcupadas: corrida.vagasOcupadas,
          vagasDisponiveis: vagasDisponiveis,
          totalVagas: corrida.numeroVagas
        },
        tempoRestante: corrida.dataHoraSaida > new Date() 
          ? Math.floor((corrida.dataHoraSaida.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null // dias restantes ou null se já passou
      }
    };

    return reply.status(200).send({
      message: "Corrida encontrada com sucesso",
      corrida: corridaFormatada
    });

  } catch (error) {
    console.error("Erro ao buscar corrida:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "ID da corrida inválido", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 