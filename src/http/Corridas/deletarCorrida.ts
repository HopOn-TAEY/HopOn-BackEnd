import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function deletarCorrida(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  // Verificar se o usuário é um motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem deletar corridas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Schema de validação para o parâmetro da corrida
  const paramsSchema = z.object({
    id: z.string().cuid("ID da corrida deve ser válido")
  });

  try {
    const { id: corridaId } = paramsSchema.parse(request.params);

    // Verificar se a corrida existe e pertence ao motorista
    const corrida = await prisma.corrida.findFirst({
      where: {
        id: corridaId,
        motoristaId: motoristaId
      },
      include: {
        reservas: {
          where: {
            status: {
              in: ["PENDENTE", "CONFIRMADA"]
            }
          }
        },
        corridaRecorrente: true
      }
    });

    if (!corrida) {
      return reply.status(404).send({ error: "Corrida não encontrada ou não pertence ao motorista" });
    }

    // Verificar se a corrida pode ser deletada
    if (corrida.status === "EM_ANDAMENTO" || corrida.status === "FINALIZADA") {
      return reply.status(400).send({ 
        error: `Não é possível deletar uma corrida com status "${corrida.status}"` 
      });
    }

    // Verificar se há reservas confirmadas
    const reservasConfirmadas = corrida.reservas.filter(reserva => 
      reserva.status === "CONFIRMADA"
    );

    if (reservasConfirmadas.length > 0) {
      return reply.status(400).send({ 
        error: `Não é possível deletar uma corrida com ${reservasConfirmadas.length} reserva(s) confirmada(s). Cancele as reservas primeiro.` 
      });
    }

    // Deletar a corrida (as reservas pendentes serão deletadas automaticamente por CASCADE)
    await prisma.corrida.delete({
      where: {
        id: corridaId
      }
    });

    return reply.status(200).send({
      message: "Corrida deletada com sucesso",
      corrida: {
        id: corrida.id,
        origem: corrida.origem,
        destino: corrida.destino,
        dataHoraSaida: corrida.dataHoraSaida,
        status: corrida.status,
        tipo: corrida.tipo,
        reservasDeletadas: corrida.reservas.length
      }
    });

  } catch (error) {
    console.error("Erro ao deletar corrida:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "ID da corrida inválido", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 