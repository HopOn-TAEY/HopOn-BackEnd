import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export async function deleteMotorista(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({
    id: z.string().cuid(),
  });

  const { id } = paramsSchema.parse(request.params);

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { perfilMotorista: true },
    });

    if (!usuario) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    if (usuario.tipo !== "MOTORISTA") {
      return reply.status(400).send({ error: "Usuário não é um motorista" });
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return reply.status(200).send({ message: "Motorista deletado com sucesso" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao deletar motorista" });
  }
}