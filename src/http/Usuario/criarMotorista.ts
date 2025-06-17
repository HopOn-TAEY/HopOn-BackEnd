import { prisma } from "../../lib/prisma";
import { FastifyRequest, FastifyReply } from "fastify";
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
        veiculo_placa: z.string(),
        veiculo_modelo: z.string(),
        veiculo_marca: z.string()
    });

    const {name, senha, email, data_nasc, tipo, telefone, avaliacao_media, cnh, veiculo_placa, veiculo_modelo, veiculo_marca} = createTaskBodySchema.parse(request.body)


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
                    cnh,
                    veiculo_placa,
                    veiculo_modelo,
                    veiculo_marca
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
}