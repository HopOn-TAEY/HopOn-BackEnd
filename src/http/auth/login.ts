import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { compare } from "bcryptjs";

export async function login(request: FastifyRequest, reply: FastifyReply) {
    const bodySchema = z.object({
      email: z.string().email(),
      senha: z.string()
    })

    const { email, senha } = bodySchema.parse(request.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { perfilMotorista: true }
    });
    console.log('Usuário retornado do Prisma:', usuario);

      if (!usuario) {
          return reply.status(400).send({ message: "não existe usuário com o mesmo email" });
      }

      const isPasswordValid = await compare(senha, usuario.senha)
      
      if(!isPasswordValid) {
            return reply.status(400).send({ message: "Invalid password." });
      }

      const token = await reply.jwtSign(
      {
        id_usuario: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo
      },
      {
        sign: {
          expiresIn: "7d"
        },
      }
    );

    return reply.status(200).send({
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo.toLowerCase(),
        telefone: usuario.telefone,
        cnh: usuario.perfilMotorista?.cnh,
        dataNascimento: usuario.dataNasc,
      }
    })
}
