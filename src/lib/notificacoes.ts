import { prisma } from "./prisma";

export enum TipoNotificacao {
  SOLICITACAO_CORRIDA_PRIVADA = "SOLICITACAO_CORRIDA_PRIVADA",
  PROPOSTA_ACEITA = "PROPOSTA_ACEITA",
  PROPOSTA_RECUSADA = "PROPOSTA_RECUSADA",
  RESERVA_SOLICITADA = "RESERVA_SOLICITADA",
  RESERVA_AUTORIZADA = "RESERVA_AUTORIZADA",
  RESERVA_CANCELADA = "RESERVA_CANCELADA",
  CORRIDA_CANCELADA = "CORRIDA_CANCELADA",
  CORRIDA_FINALIZADA = "CORRIDA_FINALIZADA"
}

export interface CriarNotificacaoData {
  usuarioId: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  corridaId?: string;
}

export async function criarNotificacao(data: CriarNotificacaoData) {
  try {
    const notificacao = await prisma.notificacao.create({
      data: {
        usuarioId: data.usuarioId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        tipo: data.tipo,
        corridaId: data.corridaId
      }
    });
    
    console.log(`Notificação criada: ${data.tipo} para usuário ${data.usuarioId}`);
    return notificacao;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

// Funções específicas para cada tipo de notificação
export async function notificarSolicitacaoCorridaPrivada(motoristaId: string, passageiroNome: string, origem: string, destino: string) {
  const motorista = await prisma.perfilMotorista.findUnique({
    where: { id: motoristaId },
    include: { usuario: true }
  });

  if (motorista) {
    await criarNotificacao({
      usuarioId: motorista.usuarioId,
      titulo: "Nova solicitação de corrida privada",
      mensagem: `${passageiroNome} solicitou uma corrida privada de ${origem} para ${destino}`,
      tipo: TipoNotificacao.SOLICITACAO_CORRIDA_PRIVADA
    });
  }
}

export async function notificarPropostaAceita(passageiroId: string, motoristaNome: string) {
  await criarNotificacao({
    usuarioId: passageiroId,
    titulo: "Proposta aceita!",
    mensagem: `${motoristaNome} aceitou sua proposta de corrida privada`,
    tipo: TipoNotificacao.PROPOSTA_ACEITA
  });
}

export async function notificarPropostaRecusada(passageiroId: string, motoristaNome: string) {
  await criarNotificacao({
    usuarioId: passageiroId,
    titulo: "Proposta recusada",
    mensagem: `${motoristaNome} recusou sua proposta de corrida privada`,
    tipo: TipoNotificacao.PROPOSTA_RECUSADA
  });
}

export async function notificarReservaSolicitada(motoristaId: string, passageiroNome: string, origem: string, destino: string) {
  const motorista = await prisma.perfilMotorista.findUnique({
    where: { id: motoristaId },
    include: { usuario: true }
  });

  if (motorista) {
    await criarNotificacao({
      usuarioId: motorista.usuarioId,
      titulo: "Nova reserva solicitada",
      mensagem: `${passageiroNome} solicitou uma reserva na sua corrida de ${origem} para ${destino}`,
      tipo: TipoNotificacao.RESERVA_SOLICITADA
    });
  }
}

export async function notificarReservaAutorizada(passageiroId: string, motoristaNome: string, origem: string, destino: string) {
  await criarNotificacao({
    usuarioId: passageiroId,
    titulo: "Reserva autorizada!",
    mensagem: `${motoristaNome} autorizou sua reserva na corrida de ${origem} para ${destino}`,
    tipo: TipoNotificacao.RESERVA_AUTORIZADA
  });
}

export async function notificarReservaCancelada(passageiroId: string, motoristaNome: string, origem: string, destino: string) {
  await criarNotificacao({
    usuarioId: passageiroId,
    titulo: "Reserva cancelada",
    mensagem: `${motoristaNome} cancelou sua reserva na corrida de ${origem} para ${destino}`,
    tipo: TipoNotificacao.RESERVA_CANCELADA
  });
}

export async function notificarCorridaCancelada(passageiroIds: string[], motoristaNome: string, origem: string, destino: string) {
  for (const passageiroId of passageiroIds) {
    await criarNotificacao({
      usuarioId: passageiroId,
      titulo: "Corrida cancelada",
      mensagem: `${motoristaNome} cancelou a corrida de ${origem} para ${destino}`,
      tipo: TipoNotificacao.CORRIDA_CANCELADA
    });
  }
}

export async function notificarCorridaFinalizada(passageiroIds: string[], motoristaNome: string, origem: string, destino: string, corridaId?: string) {
  for (const passageiroId of passageiroIds) {
    await criarNotificacao({
      usuarioId: passageiroId,
      titulo: "Corrida finalizada",
      mensagem: `${motoristaNome} finalizou a corrida de ${origem} para ${destino}`,
      tipo: TipoNotificacao.CORRIDA_FINALIZADA,
      corridaId
    });
  }
}