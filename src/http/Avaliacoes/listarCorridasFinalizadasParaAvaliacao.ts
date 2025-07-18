import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarCorridasFinalizadasParaAvaliacao(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Buscar corridas finalizadas em que o usuário foi passageiro e ainda não avaliou o motorista
  const corridas = await prisma.corrida.findMany({
    where: {
      status: "FINALIZADA",
      reservas: {
        some: {
          passageiroId: userId,
          status: "CONFIRMADA"
        }
      },
      avaliacoes: {
        none: {
          avaliadorId: userId,
          avaliadoId: { not: userId }
        }
      }
    },
    include: {
      motorista: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      },
      reservas: {
        where: { passageiroId: userId },
        select: { id: true }
      }
    },
    orderBy: { dataHoraSaida: 'desc' }
  });

  return reply.send({ corridas });
} 