import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarSolicitacoesPrivadasMotorista(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id_usuario;

    // Busca o perfil do motorista
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { perfilMotorista: true }
    });

    if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
      return reply.status(403).send({ error: "Apenas motoristas podem listar solicitações privadas recebidas" });
    }

    const motoristaId = usuario.perfilMotorista.id;

    // Busca propostas de solicitações de viagem onde o motorista é o destinatário e ainda não respondeu
    const propostas = await prisma.propostaSolicitacao.findMany({
      where: {
        motoristaId: motoristaId,
        aceita: null // ou status: "PENDENTE" se usar string
      },
      include: {
        solicitacao: {
          include: {
            passageiro: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        veiculo: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Formata a resposta
    const solicitacoes = propostas.map(proposta => ({
      id: proposta.id,
      origem: proposta.solicitacao.origem,
      destino: proposta.solicitacao.destino,
      dataHoraSaida: proposta.solicitacao.dataHoraSaida,
      numeroPassageiros: proposta.solicitacao.numeroPassageiros,
      precoMaximo: proposta.solicitacao.precoMaximo,
      observacoes: proposta.observacoes,
      passageiro: proposta.solicitacao.passageiro,
      veiculo: proposta.veiculo,
      status: proposta.aceita === null ? "PENDENTE" : (proposta.aceita ? "ACEITA" : "RECUSADA"),
      criadoEm: proposta.criadoEm
    }));

    return reply.status(200).send({ solicitacoesPrivadas: solicitacoes });

  } catch (error) {
    console.error("Erro ao listar solicitações privadas para motorista:", error);
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 