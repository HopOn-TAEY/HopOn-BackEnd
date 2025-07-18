import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function me(request: FastifyRequest, reply: FastifyReply) {
  // O usuário já está autenticado pelo middleware onRequest
  const userId = request.user.id_usuario;

  // Buscar o usuário com informações relacionadas (igual ao /perfil/:id)
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: userId,
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
    return reply.status(404).send({ error: "Usuário não encontrado" });
  }

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

  if (usuario.tipo === "MOTORISTA" && usuario.perfilMotorista) {
    const motorista = usuario.perfilMotorista;
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
}