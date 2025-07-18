import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function marcarTodasComoLidas(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Marcar todas as notificações não lidas do usuário como lidas
  const resultado = await prisma.notificacao.updateMany({
    where: {
      usuarioId: userId,
      lida: false
    },
    data: {
      lida: true
    }
  });

  return reply.send({
    message: `${resultado.count} notificações marcadas como lidas`,
    notificacoesAtualizadas: resultado.count
  });
} 