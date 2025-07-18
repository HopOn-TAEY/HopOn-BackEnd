import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarReservaCancelada } from "../../lib/notificacoes";

export async function cancelarReserva(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Validação do parâmetro
  const paramsSchema = z.object({
    id: z.string().cuid("ID da reserva inválido")
  });

  let reservaId: string;
  try {
    ({ id: reservaId } = paramsSchema.parse(request.params));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Buscar reserva e corrida relacionada
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      corrida: {
        include: {
          motorista: { 
            select: { 
              usuarioId: true,
              usuario: {
                select: {
                  nome: true
                }
              }
            } 
          }
        }
      }
    }
  });

  if (!reserva) {
    return reply.status(404).send({ error: "Reserva não encontrada" });
  }

  // Verificar se o usuário é o motorista da corrida
  if (reserva.corrida.motorista.usuarioId !== userId) {
    return reply.status(403).send({ error: "Apenas o motorista da corrida pode cancelar a reserva" });
  }

  // Só pode cancelar se estiver pendente
  if (reserva.status !== "PENDENTE") {
    return reply.status(400).send({ error: "Só é possível cancelar reservas pendentes." });
  }

  // Atualizar status para CANCELADA
  const reservaAtualizada = await prisma.reserva.update({
    where: { id: reservaId },
    data: { status: "CANCELADA" }
  });

  // Notificar o passageiro sobre a reserva cancelada
  await notificarReservaCancelada(
    reserva.passageiroId,
    reserva.corrida.motorista.usuario.nome,
    reserva.corrida.origem,
    reserva.corrida.destino
  );

  return reply.send({
    message: "Reserva cancelada com sucesso",
    reserva: reservaAtualizada
  });
} 