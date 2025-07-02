import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import '@fastify/session';
import 'fastify';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    email: z.string().email(),
    senha: z.string()
  })


    const { email, senha } = bodySchema.parse(request.body);
    
    const usuario = await prisma.usuario.findUnique({
        where: { email }
    });

    if (!usuario || usuario.senha !== senha){
        return reply.status(401).send({error: "Credenciais inválidas"});
    }

    (request.session as any) = {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
    };

  return reply.send({ message: "Login realizado com sucesso" });
}