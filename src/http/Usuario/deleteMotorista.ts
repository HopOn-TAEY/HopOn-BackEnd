// import { prisma } from "../../lib/prisma";
// import { FastifyRequest, FastifyReply } from "fastify";
// import {z} from "zod";

// export async function deleteMotorista(request: FastifyRequest, reply: FastifyReply) {
//     const deleteTaskParamsSchema = z.object({
//         id_usuario: z.preprocess((val) => Number(val), z.number())
//     })

//     const {id_usuario} = deleteTaskParamsSchema.parse(request.params)

//     await prisma.usuario.delete({
//         where: {
//             id_usuario,
//         }
//     })

//     return reply.status(204).send({message: "Usuario deletado com sucesso"})
// }