import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export async function updateMotorista(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({
    id: z.string().cuid()
  });

  const bodySchema = z.object({
    nome: z.string().optional(),
    senha: z.string().optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    dataNasc: z.string().transform((val) => new Date(val)).optional(),
    cnh: z.string().optional()
  });

  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);

  try {
    // Verifica se o motorista existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { perfilMotorista: true }
    });

    if (!usuario) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    if (usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
      return reply.status(400).send({ error: "Usuário não é um motorista válido" });
    }

    // Atualiza os dados do usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: {
        nome: body.nome,
        senha: body.senha,
        email: body.email,
        telefone: body.telefone,
        dataNasc: body.dataNasc
      }
    });

    // Atualiza a CNH se enviada
    if (body.cnh) {
      await prisma.perfilMotorista.update({
        where: { usuarioId: id },
        data: { cnh: body.cnh }
      });
    }

    return reply.status(200).send({
      message: "Motorista atualizado com sucesso",
      usuario: usuarioAtualizado
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao atualizar motorista" });
  }
}