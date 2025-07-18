import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function deletarVeiculo(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Validação do parâmetro
  const paramsSchema = z.object({
    id: z.string().cuid("ID do veículo inválido")
  });

  let veiculoId: string;
  try {
    ({ id: veiculoId } = paramsSchema.parse(request.params));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Buscar motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem deletar veículos" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Buscar veículo e garantir que pertence ao motorista
  const veiculo = await prisma.veiculo.findUnique({
    where: { id: veiculoId }
  });

  if (!veiculo) {
    return reply.status(404).send({ error: "Veículo não encontrado" });
  }

  if (veiculo.motoristaId !== motoristaId) {
    return reply.status(403).send({ error: "Você não tem permissão para deletar este veículo" });
  }

  // Deletar veículo
  await prisma.veiculo.delete({
    where: { id: veiculoId }
  });

  return reply.send({ message: "Veículo deletado com sucesso" });
} 