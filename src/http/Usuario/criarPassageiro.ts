import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export async function createPassageiro(request: FastifyRequest, reply: FastifyReply) {
  const createPassageiroSchema = z.object({
    nome: z.string(),
    senha: z.string(),
    email: z.string().email(),
    dataNasc: z.string().transform((val) => new Date(val)),
    telefone: z.string(),
  });

  const { nome, senha, email, dataNasc, telefone } = createPassageiroSchema.parse(request.body);

  const password_hash = await hash(senha, 6);

  try {
    const passageiroCriado = await prisma.usuario.create({
      data: {
        nome,
        senha: password_hash,
        email,
        telefone,
        dataNasc,
        tipo: "PASSAGEIRO",
      },
    });

    const token = await reply.jwtSign(
      {
        id_usuario: passageiroCriado.id,
        email: passageiroCriado.email,
        tipo: passageiroCriado.tipo
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
        id: passageiroCriado.id,
        nome: passageiroCriado.nome,
        email: passageiroCriado.email,
        tipoUsuario: passageiroCriado.tipo.toLowerCase()
      }
    });
  } catch (error: any) {
    console.error(error);
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return reply.status(400).send({ error: "Email já está em uso" });
      }
      if (field === 'telefone') {
        return reply.status(400).send({ error: "Telefone já está em uso" });
      }
    }
    
    return reply.status(500).send({ error: "Erro ao criar passageiro" });
  }
}