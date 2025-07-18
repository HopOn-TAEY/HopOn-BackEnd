import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarPropostaRecusada } from "../../lib/notificacoes";

export async function recusarSolicitacaoPrivada(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  const schema = z.object({
    propostaId: z.string().cuid("ID da proposta inválido")
  });

  let propostaId: string;
  try {
    ({ propostaId } = schema.parse(request.body));
  } catch (error) {
    return reply.status(400).send({ error: "Parâmetro inválido" });
  }

  // Busca o perfil do motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem recusar solicitações privadas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Busca a proposta e verifica se pertence ao motorista
  const proposta = await prisma.propostaSolicitacao.findUnique({
    where: { id: propostaId },
    include: {
      solicitacao: {
        include: {
          passageiro: true
        }
      },
      motorista: {
        include: {
          usuario: true
        }
      }
    }
  });

  if (!proposta) {
    return reply.status(404).send({ error: "Proposta não encontrada" });
  }

  if (proposta.motoristaId !== motoristaId) {
    return reply.status(403).send({ error: "Você não tem permissão para recusar esta solicitação" });
  }

  if (proposta.aceita !== null) {
    return reply.status(400).send({ error: "Esta solicitação já foi respondida" });
  }

  // Atualiza a proposta como recusada
  await prisma.propostaSolicitacao.update({
    where: { id: propostaId },
    data: {
      aceita: false,
      atualizadoEm: new Date()
    }
  });

  // Notifica o passageiro sobre a recusa
  await notificarPropostaRecusada(
    proposta.solicitacao.passageiro.id,
    proposta.motorista.usuario.nome
  );

  return reply.status(200).send({ message: "Solicitação de corrida privada recusada com sucesso" });
} 