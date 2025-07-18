import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function perfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Schema de validação para o parâmetro do usuário
    const paramsSchema = z.object({
      id: z.string().cuid("ID do usuário deve ser válido")
    });

    const { id: usuarioId } = paramsSchema.parse(request.params);
    
    console.log('Buscando perfil para usuário ID:', usuarioId);

    // Buscar o usuário com informações relacionadas
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
      include: {
        perfilMotorista: {
          include: {
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
                suporteDeficientes: true,
                criadoEm: true
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
                origem: true,
                destino: true,
                status: true,
                tipo: true,
                dataHoraSaida: true,
                criadoEm: true
              },
              orderBy: {
                criadoEm: 'desc'
              },
              take: 5
            },
                         _count: {
               select: {
                 veiculos: true,
                 corridas: true
               }
             }
          }
        },
        reservasFeitas: {
          include: {
            corrida: {
              select: {
                id: true,
                origem: true,
                destino: true,
                status: true,
                dataHoraSaida: true,
                motorista: {
                  include: {
                    usuario: {
                      select: {
                        id: true,
                        nome: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            criadoEm: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            reservasFeitas: true,
            avaliacoesFeitas: true,
            avaliacoesRecebidas: true
          }
        }
      }
    });

    if (!usuario) {
      console.log('Usuário não encontrado para ID:', usuarioId);
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }
    
    console.log('Usuário encontrado:', usuario.nome, 'Tipo:', usuario.tipo);

    // Calcular idade
    const hoje = new Date();
    const dataNasc = new Date(usuario.dataNasc);
    const idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNasc = dataNasc.getMonth();
    const idadeAjustada = (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) 
      ? idade - 1 
      : idade;

    // Calcular tempo como membro
    const tempoMembro = Math.floor((hoje.getTime() - usuario.criadoEm.getTime()) / (1000 * 60 * 60 * 24));

    // Formatar resposta baseada no tipo de usuário
    let perfilFormatado: any = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      dataNasc: usuario.dataNasc,
      idade: idadeAjustada,
      tipo: usuario.tipo,
      criadoEm: usuario.criadoEm,
      tempoMembro: tempoMembro,
      atualizadoEm: usuario.atualizadoEm,
      
      estatisticas: {
        totalReservas: usuario._count.reservasFeitas,
        totalAvaliacoesFeitas: usuario._count.avaliacoesFeitas,
        totalAvaliacoesRecebidas: usuario._count.avaliacoesRecebidas
      }
    };

    // Se for motorista, adicionar informações específicas
    if (usuario.tipo === "MOTORISTA" && usuario.perfilMotorista) {
      const motorista = usuario.perfilMotorista;
      
             // Calcular estatísticas de corridas por status
       const corridasPorStatus = {
         agendadas: motorista.corridas.filter((c: any) => c.status === "AGENDADA").length,
         emAndamento: motorista.corridas.filter((c: any) => c.status === "EM_ANDAMENTO").length,
         finalizadas: motorista.corridas.filter((c: any) => c.status === "FINALIZADA").length
       };

      perfilFormatado.perfilMotorista = {
        id: motorista.id,
        cnh: motorista.cnh,
        avaliacaoMedia: motorista.avaliacaoMedia,
        totalAvaliacoes: motorista.totalAvaliacoes,
        criadoEm: motorista.criadoEm,
        atualizadoEm: motorista.atualizadoEm,
        
                 estatisticas: {
           totalVeiculos: motorista._count.veiculos,
           totalCorridas: motorista._count.corridas,
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
          suporteDeficientes: veiculo.suporteDeficientes,
          registradoEm: veiculo.criadoEm
        })),
        
        ultimasCorridas: motorista.corridas.map(corrida => ({
          id: corrida.id,
          origem: corrida.origem,
          destino: corrida.destino,
          status: corrida.status,
          tipo: corrida.tipo,
          dataHoraSaida: corrida.dataHoraSaida,
          criadoEm: corrida.criadoEm
        }))
      };
    }

    // Se for passageiro, adicionar informações específicas
    if (usuario.tipo === "PASSAGEIRO") {
      perfilFormatado.perfilPassageiro = {
        ultimasReservas: usuario.reservasFeitas.map(reserva => ({
          id: reserva.id,
          status: reserva.status,
          numeroAssentos: reserva.numeroAssentos,
          observacoes: reserva.observacoes,
          criadoEm: reserva.criadoEm,
          corrida: {
            id: reserva.corrida.id,
            origem: reserva.corrida.origem,
            destino: reserva.corrida.destino,
            status: reserva.corrida.status,
            dataHoraSaida: reserva.corrida.dataHoraSaida,
            motorista: {
              id: reserva.corrida.motorista.usuario.id,
              nome: reserva.corrida.motorista.usuario.nome,
              email: reserva.corrida.motorista.usuario.email
            }
          }
        }))
      };
    }

    return reply.status(200).send({
      message: "Perfil encontrado com sucesso",
      perfil: perfilFormatado
    });

  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "ID do usuário inválido", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
}

// Handler para corridas finalizadas do usuário
import { onRequest } from "../auth/onRequest";

export async function corridasFinalizadas(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Buscar reservas do usuário onde a corrida está finalizada
  const reservas = await prisma.reserva.findMany({
    where: {
      passageiroId: userId,
      corrida: {
        status: "FINALIZADA"
      }
    },
    include: {
      corrida: {
        include: {
          motorista: {
            include: {
              usuario: true
            }
          },
          veiculo: true
        }
      }
    },
    orderBy: {
      criadoEm: 'desc'
    }
  });

  // Mapear resposta
  const corridas = reservas.map(reserva => ({
    id: reserva.corrida.id,
    origem: reserva.corrida.origem,
    destino: reserva.corrida.destino,
    dataHoraSaida: reserva.corrida.dataHoraSaida,
    dataHoraChegada: reserva.corrida.dataHoraChegada,
    status: reserva.corrida.status,
    motorista: {
      id: reserva.corrida.motorista.usuario.id,
      nome: reserva.corrida.motorista.usuario.nome,
      email: reserva.corrida.motorista.usuario.email
    },
    veiculo: reserva.corrida.veiculo ? {
      id: reserva.corrida.veiculo.id,
      placa: reserva.corrida.veiculo.placa,
      marca: reserva.corrida.veiculo.marca,
      modelo: reserva.corrida.veiculo.modelo
    } : null,
    numeroAssentos: reserva.numeroAssentos,
    observacoes: reserva.observacoes,
    criadoEm: reserva.criadoEm
  }));

  return reply.status(200).send({ corridasFinalizadas: corridas });
}