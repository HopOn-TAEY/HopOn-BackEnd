import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function detalharCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
  try {
    const paramsSchema = z.object({
      id: z.string().cuid("ID da corrida privada deve ser válido")
    });
    const { id: corridaId } = paramsSchema.parse(request.params);

    const corrida = await prisma.corridaPrivada.findUnique({
      where: { id: corridaId },
      include: {
        motorista: { include: { usuario: true } },
        passageiro: true,
        veiculo: { include: { imagens: true } },
      }
    });

    if (!corrida) {
      return reply.status(404).send({ error: "Corrida privada não encontrada" });
    }

    return reply.status(200).send({
      message: "Detalhes da corrida privada",
      corrida
    });
  } catch (error) {
    console.error("Erro ao detalhar corrida privada:", error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "ID da corrida privada inválido", details: error.errors });
    }
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 