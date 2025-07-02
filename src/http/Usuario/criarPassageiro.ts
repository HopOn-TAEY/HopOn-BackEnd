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

  try {
    const passageiroCriado = await prisma.usuario.create({
      data: {
        nome,
        senha,
        email,
        telefone,
        dataNasc,
        tipo: "PASSAGEIRO",
        avaliacaoMedia: 0,
        totalAvaliacoes: 0,
      },
    });

    return reply.status(201).send({
      message: 'Passageiro criado com sucesso',
      passageiro: {
        id: passageiroCriado.id,
        nome: passageiroCriado.nome,
        email: passageiroCriado.email,
        telefone: passageiroCriado.telefone,
        dataNasc: passageiroCriado.dataNasc,
        tipo: passageiroCriado.tipo,
        criadoEm: passageiroCriado.criadoEm,
      },
    });
  } catch (error: any) {
    console.error(error);
    
    // Verificar se é erro de duplicação de email ou telefone
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