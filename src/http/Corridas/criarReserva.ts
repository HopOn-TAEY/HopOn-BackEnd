import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarReservaSolicitada } from "../../lib/notificacoes";

export async function criarReserva(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Buscar usuário
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId }
  });

  if (!usuario) {
    return reply.status(403).send({ error: "Usuário não encontrado" });
  }

  // Schema de validação
  const criarReservaSchema = z.object({
    corridaId: z.string().cuid("ID da corrida inválido"),
    numeroAssentos: z.number().int().positive().max(10).default(1),
    observacoes: z.string().optional()
  });

  try {
    const dados = criarReservaSchema.parse(request.body);

    // Buscar corrida
    const corrida = await prisma.corrida.findUnique({
      where: { id: dados.corridaId },
      include: { reservas: true }
    });

    if (!corrida) {
      return reply.status(404).send({ error: "Corrida não encontrada" });
    }

    // Impedir que o motorista da corrida faça reserva na própria corrida
    if (corrida.motoristaId === userId) {
      return reply.status(403).send({ error: "O motorista não pode reservar sua própria corrida" });
    }

    // Verificar se já existe reserva para esse usuário nessa corrida
    const reservaExistente = await prisma.reserva.findUnique({
      where: {
        corridaId_passageiroId: {
          corridaId: dados.corridaId,
          passageiroId: userId
        }
      }
    });

    if (reservaExistente) {
      return reply.status(400).send({ error: "Você já possui uma reserva nesta corrida" });
    }

    // Verificar vagas disponíveis
    const vagasDisponiveis = corrida.numeroVagas - corrida.vagasOcupadas;
    if (dados.numeroAssentos > vagasDisponiveis) {
      return reply.status(400).send({ error: `Não há vagas suficientes. Vagas disponíveis: ${vagasDisponiveis}` });
    }

    // Criar reserva
    const reserva = await prisma.reserva.create({
      data: {
        corridaId: dados.corridaId,
        passageiroId: userId,
        numeroAssentos: dados.numeroAssentos,
        observacoes: dados.observacoes
      },
      include: {
        passageiro: {
          select: { id: true, nome: true, email: true }
        },
        corrida: true
      }
    });

    // Atualizar vagas ocupadas na corrida
    await prisma.corrida.update({
      where: { id: dados.corridaId },
      data: {
        vagasOcupadas: { increment: dados.numeroAssentos }
      }
    });

    // Notificar o motorista sobre a nova reserva
    await notificarReservaSolicitada(
      corrida.motoristaId,
      reserva.passageiro.nome,
      corrida.origem,
      corrida.destino
    );

    return reply.status(201).send({
      message: "Reserva criada com sucesso",
      reserva
    });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Dados inválidos", details: error.errors });
    }
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 