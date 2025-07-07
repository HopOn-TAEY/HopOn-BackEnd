import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function atualizarVagasCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId }
  });

  if (!usuario || usuario.tipo !== "PASSAGEIRO") {
    return reply.status(403).send({ error: "Apenas passageiros podem atualizar vagas de corridas privadas" });
  }

  const atualizarVagasSchema = z.object({
    corridaPrivadaId: z.string().cuid("ID da corrida privada inválido"),
    numeroVagas: z.number().int().positive("Número de vagas deve ser positivo")
  });

  try {
    const dados = atualizarVagasSchema.parse(request.body);

    // Buscar a corrida privada e verificar se pertence ao passageiro
    const corridaPrivada = await prisma.corridaPrivada.findUnique({
      where: { id: dados.corridaPrivadaId },
      include: {
        veiculo: true,
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
    });

    if (!corridaPrivada) {
      return reply.status(404).send({ error: "Corrida privada não encontrada" });
    }

    if (corridaPrivada.passageiroId !== userId) {
      return reply.status(403).send({ error: "Você não tem permissão para atualizar esta corrida privada" });
    }

    // Verificar se a corrida ainda está agendada
    if (corridaPrivada.status !== "AGENDADA") {
      return reply.status(400).send({ error: "Não é possível atualizar vagas de uma corrida que não está agendada" });
    }

    // Verificar se o número de vagas não excede a capacidade do veículo
    if (dados.numeroVagas > corridaPrivada.veiculo.capacidade) {
      return reply.status(400).send({ 
        error: `Número de vagas (${dados.numeroVagas}) excede a capacidade do veículo (${corridaPrivada.veiculo.capacidade})` 
      });
    }

    // Verificar se o número de vagas não é menor que as vagas já ocupadas
    if (dados.numeroVagas < corridaPrivada.vagasOcupadas) {
      return reply.status(400).send({ 
        error: `Número de vagas (${dados.numeroVagas}) não pode ser menor que as vagas já ocupadas (${corridaPrivada.vagasOcupadas})` 
      });
    }

    // Atualizar a corrida privada
    const corridaAtualizada = await prisma.corridaPrivada.update({
      where: { id: dados.corridaPrivadaId },
      data: {
        numeroVagas: dados.numeroVagas,
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

    return reply.status(200).send({
      message: "Número de vagas atualizado com sucesso",
      corridaPrivada: {
        id: corridaAtualizada.id,
        origem: corridaAtualizada.origem,
        destino: corridaAtualizada.destino,
        dataHoraSaida: corridaAtualizada.dataHoraSaida,
        numeroVagas: corridaAtualizada.numeroVagas,
        vagasOcupadas: corridaAtualizada.vagasOcupadas,
        preco: corridaAtualizada.preco,
        status: corridaAtualizada.status,
        observacoes: corridaAtualizada.observacoes,
        motorista: {
          id: corridaAtualizada.motorista.usuario.id,
          nome: corridaAtualizada.motorista.usuario.nome,
          email: corridaAtualizada.motorista.usuario.email
        },
        veiculo: {
          id: corridaAtualizada.veiculo.id,
          placa: corridaAtualizada.veiculo.placa,
          marca: corridaAtualizada.veiculo.marca,
          modelo: corridaAtualizada.veiculo.modelo,
          capacidade: corridaAtualizada.veiculo.capacidade
        },
        passageiro: {
          id: corridaAtualizada.passageiro.id,
          nome: corridaAtualizada.passageiro.nome,
          email: corridaAtualizada.passageiro.email
        }
      }
    });

  } catch (error) {
    console.error("Erro ao atualizar vagas da corrida privada:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 