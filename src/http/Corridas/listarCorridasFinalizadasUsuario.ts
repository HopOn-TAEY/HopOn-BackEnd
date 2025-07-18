import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarCorridasFinalizadasUsuario(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  try {
    // Corridas em que o usuário foi motorista
    const corridasMotorista = await prisma.corrida.findMany({
      where: {
        status: "FINALIZADA",
        motorista: {
          usuarioId: userId
        }
      },
      include: {
        veiculo: true,
        motorista: { include: { usuario: true } },
        reservas: { include: { passageiro: true } }
      }
    });

    // Corridas em que o usuário foi passageiro
    const reservasPassageiro = await prisma.reserva.findMany({
      where: {
        passageiroId: userId,
        status: "FINALIZADA"
      },
      include: {
        corrida: {
          include: {
            veiculo: true,
            motorista: { include: { usuario: true } },
            reservas: { include: { passageiro: true } }
          }
        }
      }
    });
    const corridasPassageiro = reservasPassageiro.map(r => r.corrida);

    // Unir e remover duplicatas (caso o usuário seja motorista e passageiro na mesma corrida)
    const todasCorridas = [...corridasMotorista, ...corridasPassageiro];
    const corridasUnicas = Object.values(
      todasCorridas.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {} as Record<string, any>)
    );

    return reply.status(200).send({ corridas: corridasUnicas });
  } catch (error) {
    console.error("Erro ao listar corridas finalizadas do usuário:", error);
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 