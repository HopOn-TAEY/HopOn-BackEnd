import { FastifyInstance } from "fastify";
import { createMotorista } from "./Usuario/criarMotorista";
import { createPassageiro } from "./Usuario/criarPassageiro";
import {authenticate} from "./auth/authenticate";
import { deleteMotorista } from "./Usuario/deleteMotorista";
import { updateMotorista } from "./Usuario/updateMotorista"
import { onRequest } from "./auth/onRequest";
import { me } from "./auth/me";

export async function routes(app: FastifyInstance) {

  app.post("/login", authenticate);
  app.post("/criar-motorista", createMotorista);
  app.post("/criar-passageiro", createPassageiro);
  
  // Rotas protegidas que precisam de autenticação
  app.get("/me", { onRequest }, me);
  app.delete("/deletar-usuario/:id", { onRequest }, deleteMotorista);
  app.put("/atualizar-motorista/:id", { onRequest }, updateMotorista);
}
