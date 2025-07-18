import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function criarCorrida(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem criar corridas" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  const criarCorridaSchema = z.object({
    veiculoId: z.string().cuid(),
    origem: z.string().min(1, "Origem é obrigatória"),
    destino: z.string().min(1, "Destino é obrigatório"),
    latitudeOrigem: z.number().optional(),
    longitudeOrigem: z.number().optional(),
    latitudeDestino: z.number().optional(),
    longitudeDestino: z.number().optional(),
    dataHoraSaida: z.string().transform((val) => new Date(val)),
    numeroVagas: z.number().int().positive("Número de vagas deve ser positivo"),
    preco: z.number().positive("Preço deve ser positivo").optional(),
    observacoes: z.string().optional(),
    tipo: z.enum(["RECORRENTE", "PRIVADA"]),

    diasSemana: z.array(z.enum(["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"])).optional(),
    dataInicio: z.string().transform((val) => new Date(val)).optional(),
    dataFim: z.string().transform((val) => new Date(val)).optional()
  });

  try {
    const body = request.body as any;
    console.log('Dados recebidos no backend:', body);
    console.log('Tipo do veiculoId recebido:', typeof body.veiculoId);
    console.log('VeiculoId recebido:', body.veiculoId);
    
    const dados = criarCorridaSchema.parse(body);
    console.log('Dados validados:', dados);
    console.log('VeiculoId após validação:', dados.veiculoId);

    // Verificar se o veiculoId é um CUUID válido
    if (!dados.veiculoId || typeof dados.veiculoId !== 'string' || dados.veiculoId.trim() === '') {
      return reply.status(400).send({ error: "ID do veículo inválido" });
    }

    const veiculo = await prisma.veiculo.findFirst({
      where: {
        id: dados.veiculoId.trim(),
        motoristaId: motoristaId
      }
    });

    console.log('Veículo encontrado:', veiculo);
    
    if (!veiculo) {
      console.log('Veículo não encontrado para ID:', dados.veiculoId);
      console.log('Motorista ID:', motoristaId);
      return reply.status(404).send({ error: "Veículo não encontrado ou não pertence ao motorista" });
    }

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

    console.log('Criando corrida com veiculoId:', dados.veiculoId);
    
    const corrida = await prisma.corrida.create({
      data: {
        motoristaId: motoristaId,
        veiculoId: dados.veiculoId.trim(),
        origem: dados.origem,
        destino: dados.destino,
        latitudeOrigem: dados.latitudeOrigem,
        longitudeOrigem: dados.longitudeOrigem,
        latitudeDestino: dados.latitudeDestino,
        longitudeDestino: dados.longitudeDestino,
        dataHoraSaida: dados.dataHoraSaida,
        numeroVagas: dados.numeroVagas,
        preco: dados.preco,
        observacoes: dados.observacoes,
        tipo: dados.tipo,
        corridaRecorrente: dados.tipo === "RECORRENTE" ? {
          create: {
            diasSemana: dados.diasSemana || [],
            dataInicio: dados.dataInicio || dados.dataHoraSaida,
            dataFim: dados.dataFim
          }
        } : undefined
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
        corridaRecorrente: true
      }
    });

    console.log('Corrida criada com sucesso:', corrida.id);
    
    return reply.status(201).send({
      message: "Corrida criada com sucesso",
      corrida: {
        id: corrida.id,
        origem: corrida.origem,
        destino: corrida.destino,
        dataHoraSaida: corrida.dataHoraSaida,
        numeroVagas: corrida.numeroVagas,
        vagasOcupadas: corrida.vagasOcupadas,
        preco: corrida.preco,
        status: corrida.status,
        tipo: corrida.tipo,
        motorista: {
          id: corrida.motorista.usuario.id,
          nome: corrida.motorista.usuario.nome,
          email: corrida.motorista.usuario.email
        },
        veiculo: {
          id: corrida.veiculo.id,
          placa: corrida.veiculo.placa,
          marca: corrida.veiculo.marca,
          modelo: corrida.veiculo.modelo
        },
        corridaRecorrente: corrida.corridaRecorrente
      }
    });

  } catch (error) {
    console.error("Erro ao criar corrida:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
}