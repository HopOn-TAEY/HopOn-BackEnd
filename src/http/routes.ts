import { FastifyInstance } from "fastify";
import { createMotorista } from "./Usuario/criarMotorista";
// import { deleteMotorista } from "./Usuario/deleteMotorista";

export async function routes(app: FastifyInstance) {
  app.post("/criarMotorista", createMotorista);
  // app.delete("/deletarUsuario/:id_usuario", deleteMotorista);
}