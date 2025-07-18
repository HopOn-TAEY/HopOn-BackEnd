import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarCorridasPrivadasMotorista(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Buscar motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem listar suas corridas privadas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Buscar corridas privadas do motorista
  const corridas = await prisma.corridaPrivada.findMany({
    where: { motoristaId },
    include: {
      veiculo: true,
      passageiro: { select: { id: true, nome: true, email: true, telefone: true } }
    },
    orderBy: { dataHoraSaida: 'desc' }
  });

  return reply.send({ corridas });
} 