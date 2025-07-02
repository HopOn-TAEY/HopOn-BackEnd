import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
<<<<<<< HEAD
import { z } from "zod";

export async function createMotorista(request: FastifyRequest, reply: FastifyReply) {
  const createMotoristaSchema = z.object({
    nome: z.string(),
    senha: z.string(),
    email: z.string().email(),
    dataNasc: z.string().transform((val) => new Date(val)),
    telefone: z.string(),
    cnh: z.string(),
  });

  const { nome, senha, email, dataNasc, telefone, cnh } = createMotoristaSchema.parse(request.body);

  try {
    const motoristaCriado = await prisma.usuario.create({
      data: {
        nome,
        senha,
        email,
        telefone,
        dataNasc,
        tipo: "MOTORISTA",
        avaliacaoMedia: 0,
        totalAvaliacoes: 0,
        perfilMotorista: {
          create: {
            cnh,
          },
        },
      },
      include: {
        perfilMotorista: true,
      },
    });

    return reply.status(201).send({
      message: 'Motorista criado com sucesso',
      motorista: motoristaCriado,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao criar motorista" });
  }
=======
import {z} from "zod";

export async function createMotorista(request: FastifyRequest, reply: FastifyReply) {
    const createTaskBodySchema = z.object({
        name: z.string(),
        senha: z.string(),
        email: z.string(),
        data_nasc: z.string().transform((val) => new Date(val)),
        tipo: z.string(),
        telefone: z.string(),
        avaliacao_media: z.number(),

        cnh: z.string(),
    });

    const {name, senha, email, data_nasc, tipo, telefone, avaliacao_media, cnh} = createTaskBodySchema.parse(request.body)


    const task = await prisma.usuario.create({
        data: {
            name,
            senha,
            email,
            data_nasc,
            tipo,
            telefone,
            avaliacao_media,
            motorista: {
                create: {
                    cnh
                }
            }
        },
        include: {
            motorista: true
        }
    });

    return reply.status(201).send({
        message: 'Criado com sucesso',
        task
    })
>>>>>>> fix
}