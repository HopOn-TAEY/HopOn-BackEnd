import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function detalharCorrida(request: FastifyRequest, reply: FastifyReply) {
  try {
    const paramsSchema = z.object({
      id: z.string().cuid("ID da corrida deve ser válido")
    });
    const { id: corridaId } = paramsSchema.parse(request.params);

    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        motorista: { include: { usuario: true } },
        veiculo: { include: { imagens: true } },
        corridaRecorrente: true,
        reservas: { include: { passageiro: true } },
        avaliacoes: { include: { avaliador: true, avaliado: true } }
      }
    });

    if (!corrida) {
      return reply.status(404).send({ error: "Corrida não encontrada" });
    }

    return reply.status(200).send({
      message: "Detalhes da corrida",
      corrida
    });
  } catch (error) {
    console.error("Erro ao detalhar corrida:", error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "ID da corrida inválido", details: error.errors });
    }
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 