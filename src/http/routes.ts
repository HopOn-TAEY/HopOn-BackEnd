import { FastifyInstance } from "fastify";
import { createMotorista } from "./Usuario/criarMotorista";
import { createPassageiro } from "./Usuario/criarPassageiro";
import { login} from "./auth/login";
import { deleteMotorista } from "./Usuario/deleteMotorista";
import { updateMotorista } from "./Usuario/updateMotorista"
import {  VerifyJWT } from "../http/middlewares/verify-jwt"
import { perfil } from "./auth/perfil";

export async function routes(app: FastifyInstance) {

  app.post("/login", login);
  app.post("/criar-motorista", createMotorista);
  app.post("/criar-passageiro", createPassageiro);
  
  // Rotas protegidas que precisam de autenticação
  app.get("/perfil", { onRequest: VerifyJWT }, perfil);
  app.delete("/deletar-usuario/:id", { onRequest: VerifyJWT }, deleteMotorista);
  app.put("/atualizar-motorista/:id", { onRequest: VerifyJWT }, updateMotorista);
}
