import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function marcarComoLida(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Validação do parâmetro
  const paramsSchema = z.object({
    id: z.string().cuid("ID da notificação inválido")
  });

  let notificacaoId: string;
  try {
    ({ id: notificacaoId } = paramsSchema.parse(request.params));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Buscar notificação e garantir que pertence ao usuário
  const notificacao = await prisma.notificacao.findUnique({
    where: { id: notificacaoId }
  });

  if (!notificacao) {
    return reply.status(404).send({ error: "Notificação não encontrada" });
  }

  if (notificacao.usuarioId !== userId) {
    return reply.status(403).send({ error: "Você não tem permissão para marcar esta notificação como lida" });
  }

  // Marcar como lida
  const notificacaoAtualizada = await prisma.notificacao.update({
    where: { id: notificacaoId },
    data: { lida: true }
  });

  return reply.send({
    message: "Notificação marcada como lida",
    notificacao: notificacaoAtualizada
  });
} 