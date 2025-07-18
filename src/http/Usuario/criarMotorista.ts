import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
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

   const password_hash = await hash(senha, 6)

  try {
    const motoristaCriado = await prisma.usuario.create({
      data: {
        nome,
        senha: password_hash,
        email,
        telefone,
        dataNasc,
        tipo: "MOTORISTA",
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

    const token = await reply.jwtSign(
      {
        id_usuario: motoristaCriado.id,
        email: motoristaCriado.email,
        tipo: motoristaCriado.tipo
      },
      {
        sign: {
          expiresIn: "7d"
        },
      }
    );

    return reply.status(201).send({
      token,
      user: {
        id: motoristaCriado.id,
        nome: motoristaCriado.nome,
        email: motoristaCriado.email,
        tipoUsuario: motoristaCriado.tipo.toLowerCase()
      }
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao criar motorista" });
  }
}