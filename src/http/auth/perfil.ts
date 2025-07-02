import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function perfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.user.id;

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }
    return reply.status(200).send({ usuario });
  } catch (error) {
    return reply.status(401).send({ error: "Token inválido ou não fornecido" });
  }
}
