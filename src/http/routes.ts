import { FastifyInstance } from "fastify";
import { createMotorista } from "./Usuario/criarMotorista";
import {login} from "./auth/login";
// import { deleteMotorista } from "./Usuario/deleteMotorista";

export async function routes(app: FastifyInstance) {

  app.post("/criarMotorista", createMotorista);
  app.post("/logIn", login);
  // app.delete("/deletarUsuario/:id_usuario", deleteMotorista);
}