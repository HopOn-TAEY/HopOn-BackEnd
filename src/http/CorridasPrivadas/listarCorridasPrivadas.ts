import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarCorridasPrivadas(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario) {
    return reply.status(404).send({ error: "Usuário não encontrado" });
  }

  try {
    let corridasPrivadas: any[] = [];

    if (usuario.tipo === "PASSAGEIRO") {
      // Para passageiros, buscar corridas privadas onde eles são o passageiro
      corridasPrivadas = await prisma.corridaPrivada.findMany({
        where: {
          passageiroId: userId
        },
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
              cor: true,
              ano: true,
              capacidade: true
            }
          }
        },
        orderBy: {
          dataHoraSaida: 'desc'
        }
      });
    } else if (usuario.tipo === "MOTORISTA" && usuario.perfilMotorista) {
      // Para motoristas, buscar corridas privadas onde eles são o motorista
      corridasPrivadas = await prisma.corridaPrivada.findMany({
        where: {
          motoristaId: usuario.perfilMotorista.id
        },
        include: {
          passageiro: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          },
          veiculo: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              cor: true,
              ano: true,
              capacidade: true
            }
          }
        },
        orderBy: {
          dataHoraSaida: 'desc'
        }
      });
    }

    return reply.status(200).send({
      corridasPrivadas: corridasPrivadas.map(corrida => ({
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
        preco: corrida.preco,
        observacoes: corrida.observacoes,
        status: corrida.status,
        criadoEm: corrida.criadoEm,
        atualizadoEm: corrida.atualizadoEm,
        motorista: usuario.tipo === "PASSAGEIRO" ? {
          id: corrida.motorista.usuario.id,
          nome: corrida.motorista.usuario.nome,
          email: corrida.motorista.usuario.email,
          telefone: corrida.motorista.usuario.telefone
        } : undefined,
        passageiro: usuario.tipo === "MOTORISTA" ? {
          id: corrida.passageiro.id,
          nome: corrida.passageiro.nome,
          email: corrida.passageiro.email,
          telefone: corrida.passageiro.telefone
        } : undefined,
        veiculo: {
          id: corrida.veiculo.id,
          placa: corrida.veiculo.placa,
          marca: corrida.veiculo.marca,
          modelo: corrida.veiculo.modelo,
          cor: corrida.veiculo.cor,
          ano: corrida.veiculo.ano,
          capacidade: corrida.veiculo.capacidade
        }
      }))
    });

  } catch (error) {
    console.error("Erro ao listar corridas privadas:", error);
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 