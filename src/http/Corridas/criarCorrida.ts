// import { prisma } from "../../lib/prisma";
// import { FastifyRequest, FastifyReply } from "fastify";
// import {z} from "zod";

// export async function createMotorista(request: FastifyRequest, reply: FastifyReply) {
//     const createTaskBodySchema = z.object({
//         id_motorista: z.number(),
//         origem: z.string(),
//         destino: z.string(),
//         preco: z.number(),
//         hora_saida: z.string().transform((val) => new Date(val)),
//         n_vagas: z.number(),
//         passageiros: z.array(z.string()).length(0)


//     });

//     const {} = createTaskBodySchema.parse(request.body)


//     const task = await prisma.usuario.create({
        
//     });

//     return reply.status(201).send({
//         message: 'Criado com sucesso',
//         task
//     })
// }