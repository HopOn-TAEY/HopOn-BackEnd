import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { notificarSolicitacaoCorridaPrivada } from "../../lib/notificacoes";

export async function solicitarCorridaPrivada(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  console.log('User ID from JWT:', userId);
  console.log('User data from JWT:', request.user);
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  console.log('Usuario encontrado:', usuario);
  console.log('Tipo do usuário:', usuario?.tipo);

  if (!usuario || usuario.tipo !== "PASSAGEIRO") {
    return reply.status(403).send({ error: "Apenas passageiros podem solicitar corridas privadas" });
  }

  const solicitarCorridaPrivadaSchema = z.object({
    motoristaId: z.string().cuid("ID do motorista inválido"),
    veiculoId: z.string().cuid("ID do veículo inválido"),
    origem: z.string().min(1, "Origem é obrigatória"),
    destino: z.string().min(1, "Destino é obrigatório"),
    latitudeOrigem: z.number().optional(),
    longitudeOrigem: z.number().optional(),
    latitudeDestino: z.number().optional(),
    longitudeDestino: z.number().optional(),
    dataHoraSaida: z.string().transform((val) => new Date(val)),
    numeroVagas: z.number().int().positive("Número de vagas deve ser positivo"),
    preco: z.number().positive("Preço deve ser positivo").optional(),
    observacoes: z.string().optional()
  });

  try {
    const dados = solicitarCorridaPrivadaSchema.parse(request.body);

    // Verificar se o motorista existe e é realmente um motorista
    const motorista = await prisma.perfilMotorista.findUnique({
      where: { id: dados.motoristaId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true
          }
        },
        veiculos: {
          where: { id: dados.veiculoId }
        }
      }
    });

    if (!motorista) {
      return reply.status(404).send({ error: "Motorista não encontrado" });
    }

    if (motorista.usuario.tipo !== "MOTORISTA") {
      return reply.status(400).send({ error: "Usuário selecionado não é um motorista" });
    }

    // Verificar se o veículo pertence ao motorista
    if (motorista.veiculos.length === 0) {
      return reply.status(404).send({ error: "Veículo não encontrado ou não pertence ao motorista" });
    }

    const veiculo = motorista.veiculos[0];

    // Verificar se o número de vagas não excede a capacidade do veículo
    if (dados.numeroVagas > veiculo.capacidade) {
      return reply.status(400).send({ 
        error: `Número de vagas (${dados.numeroVagas}) excede a capacidade do veículo (${veiculo.capacidade})` 
      });
    }

    // Verificar se a data de saída é futura
    const agora = new Date();
    if (dados.dataHoraSaida <= agora) {
      return reply.status(400).send({ 
        error: "A data e hora de saída deve ser futura" 
      });
    }

    // Verificar se já existe uma solicitação pendente do mesmo passageiro para o mesmo motorista
    const solicitacaoExistente = await prisma.solicitacaoViagem.findFirst({
      where: {
        passageiroId: userId,
        status: "ABERTA"
      }
    });

    if (solicitacaoExistente) {
      return reply.status(400).send({ 
        error: "Você já possui uma solicitação de viagem aberta. Finalize ou cancele a solicitação atual antes de criar uma nova." 
      });
    }

    // Criar a solicitação de viagem
    const solicitacao = await prisma.solicitacaoViagem.create({
      data: {
        passageiroId: userId,
        origem: dados.origem,
        destino: dados.destino,
        latitudeOrigem: dados.latitudeOrigem,
        longitudeOrigem: dados.longitudeOrigem,
        latitudeDestino: dados.latitudeDestino,
        longitudeDestino: dados.longitudeDestino,
        dataHoraSaida: dados.dataHoraSaida,
        numeroPassageiros: dados.numeroVagas,
        precoMaximo: dados.preco,
        descricao: dados.observacoes,
        dataExpiracao: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira em 24 horas
      },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Criar a proposta automaticamente para o motorista escolhido
    const proposta = await prisma.propostaSolicitacao.create({
      data: {
        solicitacaoId: solicitacao.id,
        motoristaId: dados.motoristaId,
        veiculoId: dados.veiculoId,
        precoOfertado: dados.preco,
        observacoes: dados.observacoes
      },
      include: {
        motorista: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        veiculo: true,
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
        }
      }
    });

    // Notificar o motorista sobre a nova solicitação
    await notificarSolicitacaoCorridaPrivada(
      dados.motoristaId,
      solicitacao.passageiro.nome,
      dados.origem,
      dados.destino
    );

    return reply.status(201).send({
      message: "Solicitação de corrida privada criada com sucesso",
      solicitacao: {
        id: solicitacao.id,
        origem: solicitacao.origem,
        destino: solicitacao.destino,
        dataHoraSaida: solicitacao.dataHoraSaida,
        numeroPassageiros: solicitacao.numeroPassageiros,
        precoMaximo: solicitacao.precoMaximo,
        status: solicitacao.status,
        dataExpiracao: solicitacao.dataExpiracao,
        passageiro: solicitacao.passageiro
      },
      proposta: {
        id: proposta.id,
        precoOfertado: proposta.precoOfertado,
        observacoes: proposta.observacoes,
        aceita: proposta.aceita,
        motorista: proposta.motorista.usuario,
        veiculo: {
          id: proposta.veiculo.id,
          placa: proposta.veiculo.placa,
          marca: proposta.veiculo.marca,
          modelo: proposta.veiculo.modelo
        }
      }
    });

  } catch (error) {
    console.error("Erro ao solicitar corrida privada:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 