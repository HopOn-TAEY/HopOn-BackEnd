import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarCorridaFinalizada } from "../../lib/notificacoes";

export async function finalizarCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
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
    return reply.status(403).send({ error: "Você não tem permissão para finalizar esta corrida privada" });
  }

  if (corrida.status === "FINALIZADA" || corrida.status === "CANCELADA") {
    return reply.status(400).send({ error: "A corrida já está finalizada ou cancelada" });
  }

  // Atualizar status para FINALIZADA
  const corridaAtualizada = await prisma.corridaPrivada.update({
    where: { id: corridaId },
    data: { status: "FINALIZADA" }
  });

  // Notificar o passageiro sobre a corrida finalizada
  await notificarCorridaFinalizada(
    [corrida.passageiro.id],
    corrida.motorista.usuario.nome,
    corrida.origem,
    corrida.destino,
    corrida.id // Passa o id da corrida privada
  );

  return reply.send({ message: "Corrida privada finalizada com sucesso", corrida: corridaAtualizada });
} 