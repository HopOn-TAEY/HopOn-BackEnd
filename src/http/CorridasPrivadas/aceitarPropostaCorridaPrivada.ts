import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarPropostaAceita } from "../../lib/notificacoes";

export async function aceitarPropostaCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem aceitar propostas de corridas privadas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  const aceitarPropostaSchema = z.object({
    propostaId: z.string().cuid("ID da proposta inválido"),
    precoFinal: z.number().positive("Preço deve ser positivo").optional(),
    observacoes: z.string().optional()
  });

  try {
    const dados = aceitarPropostaSchema.parse(request.body);

    // Buscar a proposta e verificar se pertence ao motorista
    const proposta = await prisma.propostaSolicitacao.findUnique({
      where: { id: dados.propostaId },
      include: {
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
        },
        veiculo: true,
        solicitacao: {
          include: {
            passageiro: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!proposta) {
      return reply.status(404).send({ error: "Proposta não encontrada" });
    }

    if (proposta.motoristaId !== motoristaId) {
      return reply.status(403).send({ error: "Você não tem permissão para aceitar esta proposta" });
    }

    if (proposta.aceita !== null) {
      return reply.status(400).send({ error: "Esta proposta já foi respondida" });
    }

    // Verificar se a solicitação ainda está aberta
    if (proposta.solicitacao.status !== "ABERTA") {
      return reply.status(400).send({ error: "Esta solicitação não está mais disponível" });
    }

    // Verificar se a solicitação não expirou
    if (proposta.solicitacao.dataExpiracao && proposta.solicitacao.dataExpiracao < new Date()) {
      return reply.status(400).send({ error: "Esta solicitação expirou" });
    }

    // Verificar se o número de passageiros não excede a capacidade do veículo
    if (proposta.solicitacao.numeroPassageiros > proposta.veiculo.capacidade) {
      return reply.status(400).send({ 
        error: `Número de passageiros (${proposta.solicitacao.numeroPassageiros}) excede a capacidade do veículo (${proposta.veiculo.capacidade})` 
      });
    }

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar a proposta como aceita
      const propostaAtualizada = await tx.propostaSolicitacao.update({
        where: { id: dados.propostaId },
        data: {
          aceita: true,
          precoOfertado: dados.precoFinal || proposta.precoOfertado,
          observacoes: dados.observacoes || proposta.observacoes,
          atualizadoEm: new Date()
        },
        include: {
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
          },
          solicitacao: {
            include: {
              passageiro: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Notificar o passageiro sobre a proposta aceita
      await notificarPropostaAceita(
        propostaAtualizada.solicitacao.passageiro.id,
        propostaAtualizada.motorista.usuario.nome
      );

      // Atualizar o status da solicitação para ACEITA
      await tx.solicitacaoViagem.update({
        where: { id: proposta.solicitacaoId },
        data: {
          status: "ACEITA",
          atualizadoEm: new Date()
        }
      });

      // Criar a corrida privada
      const corridaPrivada = await tx.corridaPrivada.create({
        data: {
          motoristaId: motoristaId,
          veiculoId: proposta.veiculoId,
          passageiroId: proposta.solicitacao.passageiroId,
          origem: proposta.solicitacao.origem,
          destino: proposta.solicitacao.destino,
          latitudeOrigem: proposta.solicitacao.latitudeOrigem,
          longitudeOrigem: proposta.solicitacao.longitudeOrigem,
          latitudeDestino: proposta.solicitacao.latitudeDestino,
          longitudeDestino: proposta.solicitacao.longitudeDestino,
          dataHoraSaida: proposta.solicitacao.dataHoraSaida,
          numeroVagas: proposta.solicitacao.numeroPassageiros,
          vagasOcupadas: proposta.solicitacao.numeroPassageiros, // Já ocupada pelo passageiro que solicitou
          preco: dados.precoFinal || proposta.precoOfertado,
          observacoes: dados.observacoes || proposta.observacoes,
          status: "AGENDADA"
        },
        include: {
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
          },
          veiculo: true,
          passageiro: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      return { propostaAtualizada, corridaPrivada };
    });

    return reply.status(200).send({
      message: "Proposta aceita e corrida privada criada com sucesso",
      corridaPrivada: {
        id: resultado.corridaPrivada.id,
        origem: resultado.corridaPrivada.origem,
        destino: resultado.corridaPrivada.destino,
        dataHoraSaida: resultado.corridaPrivada.dataHoraSaida,
        numeroVagas: resultado.corridaPrivada.numeroVagas,
        vagasOcupadas: resultado.corridaPrivada.vagasOcupadas,
        preco: resultado.corridaPrivada.preco,
        status: resultado.corridaPrivada.status,
        observacoes: resultado.corridaPrivada.observacoes,
        motorista: resultado.corridaPrivada.motorista.usuario,
        veiculo: {
          id: resultado.corridaPrivada.veiculo.id,
          placa: resultado.corridaPrivada.veiculo.placa,
          marca: resultado.corridaPrivada.veiculo.marca,
          modelo: resultado.corridaPrivada.veiculo.modelo
        },
        passageiro: resultado.corridaPrivada.passageiro
      }
    });

  } catch (error) {
    console.error("Erro ao aceitar proposta de corrida privada:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
}