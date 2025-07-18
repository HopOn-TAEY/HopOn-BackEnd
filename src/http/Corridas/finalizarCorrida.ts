import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarCorridaFinalizada } from "../../lib/notificacoes";

export async function finalizarCorrida(request: FastifyRequest, reply: FastifyReply) {
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
    return reply.status(403).send({ error: "Apenas motoristas podem finalizar corridas" });
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
    return reply.status(403).send({ error: "Você não tem permissão para finalizar esta corrida" });
  }

  if (corrida.status === "FINALIZADA" || corrida.status === "CANCELADA") {
    return reply.status(400).send({ error: "A corrida já está finalizada ou cancelada" });
  }

  // Atualizar status para FINALIZADA
  const corridaAtualizada = await prisma.corrida.update({
    where: { id: corridaId },
    data: { status: "FINALIZADA" }
  });

  // Notificar todos os passageiros sobre a corrida finalizada
  const passageiroIds = corrida.reservas.map(r => r.passageiro.id);
  if (passageiroIds.length > 0) {
    await notificarCorridaFinalizada(
      passageiroIds,
      corrida.motorista.usuario.nome,
      corrida.origem,
      corrida.destino,
      corrida.id // Passa o id da corrida
    );
  }

  return reply.send({ message: "Corrida finalizada com sucesso", corrida: corridaAtualizada });
} 