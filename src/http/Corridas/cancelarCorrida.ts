import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarCorridaCancelada } from "../../lib/notificacoes";

export async function cancelarCorrida(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Validação do parâmetro
  const paramsSchema = z.object({
    id: z.string().cuid("ID da corrida inválido")
  });

  let corridaId: string;
  try {
    ({ id: corridaId } = paramsSchema.parse(request.params));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Buscar motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem cancelar corridas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Buscar corrida e garantir que pertence ao motorista
  const corrida = await prisma.corrida.findUnique({
    where: { id: corridaId },
    include: {
      motorista: {
        include: {
          usuario: {
            select: {
              nome: true
            }
          }
        }
      },
      reservas: {
        where: {
          status: {
            in: ["PENDENTE", "CONFIRMADA"]
          }
        },
        include: {
          passageiro: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  if (!corrida) {
    return reply.status(404).send({ error: "Corrida não encontrada" });
  }

  if (corrida.motoristaId !== motoristaId) {
    return reply.status(403).send({ error: "Você não tem permissão para cancelar esta corrida" });
  }

  if (corrida.status === "FINALIZADA" || corrida.status === "CANCELADA") {
    return reply.status(400).send({ error: "A corrida já está finalizada ou cancelada" });
  }

  // Atualizar status para CANCELADA
  const corridaAtualizada = await prisma.corrida.update({
    where: { id: corridaId },
    data: { status: "CANCELADA" }
  });

  // Notificar todos os passageiros sobre a corrida cancelada
  const passageiroIds = corrida.reservas.map(r => r.passageiro.id);
  if (passageiroIds.length > 0) {
    await notificarCorridaCancelada(
      passageiroIds,
      corrida.motorista.usuario.nome,
      corrida.origem,
      corrida.destino
    );
  }

  return reply.send({ message: "Corrida cancelada com sucesso", corrida: corridaAtualizada });
} 