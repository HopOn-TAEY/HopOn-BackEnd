import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function cancelarCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  const paramsSchema = z.object({
    id: z.string().cuid("ID da corrida privada inválido")
  });

  let corridaId: string;
  try {
    ({ id: corridaId } = paramsSchema.parse(request.params));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Buscar corrida privada e garantir que pertence ao motorista
  const corrida = await prisma.corridaPrivada.findUnique({
    where: { id: corridaId },
    include: {
      motorista: { include: { usuario: true } },
      passageiro: true
    }
  });

  if (!corrida) {
    return reply.status(404).send({ error: "Corrida privada não encontrada" });
  }

  if (corrida.motorista.usuarioId !== userId) {
    return reply.status(403).send({ error: "Você não tem permissão para cancelar esta corrida privada" });
  }

  if (corrida.status === "FINALIZADA" || corrida.status === "CANCELADA") {
    return reply.status(400).send({ error: "A corrida já está finalizada ou cancelada" });
  }

  // Atualizar status para CANCELADA
  const corridaAtualizada = await prisma.corridaPrivada.update({
    where: { id: corridaId },
    data: { status: "CANCELADA" }
  });

  // Aqui você pode notificar o passageiro se quiser

  return reply.send({ message: "Corrida privada cancelada com sucesso", corrida: corridaAtualizada });
} 