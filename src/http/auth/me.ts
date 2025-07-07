import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function me(request: FastifyRequest, reply: FastifyReply) {
  // O usuário já está autenticado pelo middleware onRequest
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      dataNasc: true,
      criadoEm: true
    }
  });

  if (!usuario) {
    return reply.status(404).send({ error: "Usuário não encontrado" });
  }

  return reply.send({ usuario });
} 