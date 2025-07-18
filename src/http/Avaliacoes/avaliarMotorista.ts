import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function avaliarMotorista(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  const bodySchema = z.object({
    corridaId: z.string().cuid("ID da corrida inválido"),
    nota: z.number().int().min(1).max(5),
    comentario: z.string().max(500).optional()
  });

  let dados;
  try {
    dados = bodySchema.parse(request.body);
  } catch (error) {
    return reply.status(400).send({ error: "Dados inválidos" });
  }

  // Buscar corrida e garantir que o usuário foi passageiro e a corrida está finalizada
  const corrida = await prisma.corrida.findUnique({
    where: { id: dados.corridaId },
    include: {
      reservas: {
        where: { passageiroId: userId, status: "CONFIRMADA" }
      },
      motorista: true
    }
  });

  if (!corrida || corrida.status !== "FINALIZADA" || corrida.reservas.length === 0) {
    return reply.status(403).send({ error: "Você não pode avaliar esta corrida" });
  }

  // Verificar se já existe avaliação deste passageiro para este motorista nesta corrida
  const avaliacaoExistente = await prisma.avaliacao.findUnique({
    where: {
      corridaId_avaliadorId_avaliadoId: {
        corridaId: dados.corridaId,
        avaliadorId: userId,
        avaliadoId: corrida.motorista.usuarioId
      }
    }
  });

  if (avaliacaoExistente) {
    return reply.status(400).send({ error: "Você já avaliou este motorista nesta corrida" });
  }

  // Criar avaliação
  const avaliacao = await prisma.avaliacao.create({
    data: {
      corridaId: dados.corridaId,
      avaliadorId: userId,
      avaliadoId: corrida.motorista.usuarioId,
      nota: dados.nota,
      comentario: dados.comentario
    }
  });

  // Recalcular média e total de avaliações do perfilMotorista
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { avaliadoId: corrida.motorista.usuarioId }
  });
  const totalAvaliacoes = avaliacoes.length;
  const somaNotas = avaliacoes.reduce((sum, a) => sum + a.nota, 0);
  const mediaAvaliacoes = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;

  await prisma.perfilMotorista.update({
    where: { usuarioId: corrida.motorista.usuarioId },
    data: {
      avaliacaoMedia: mediaAvaliacoes,
      totalAvaliacoes: totalAvaliacoes
    }
  });

  return reply.send({ message: "Avaliação registrada com sucesso", avaliacao });
} 