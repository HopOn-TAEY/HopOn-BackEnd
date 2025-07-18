import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function listarReservasCorrida(request: FastifyRequest, reply: FastifyReply) {
  // Usuário autenticado
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

  // Buscar corrida e validar motorista
  const corrida = await prisma.corrida.findUnique({
    where: { id: corridaId },
    include: {
      motorista: { select: { usuarioId: true } },
      reservas: {
        include: {
          passageiro: { select: { id: true, nome: true, email: true, telefone: true } }
        },
        orderBy: { criadoEm: 'asc' }
      }
    }
  });

  if (!corrida) {
    return reply.status(404).send({ error: "Corrida não encontrada" });
  }

  if (corrida.motorista.usuarioId !== userId) {
    return reply.status(403).send({ error: "Apenas o motorista da corrida pode ver as reservas" });
  }

  // Montar resposta
  const reservas = corrida.reservas.map(r => ({
    id: r.id,
    status: r.status,
    numeroAssentos: r.numeroAssentos,
    observacoes: r.observacoes,
    criadoEm: r.criadoEm,
    passageiro: r.passageiro
  }));

  return reply.send({ reservas });
} 