import { FastifyInstance } from "fastify";
import { createMotorista } from "./Usuario/criarMotorista";
import { createPassageiro } from "./Usuario/criarPassageiro";
import { login} from "./auth/login";
import { deleteUsuario } from "./Usuario/deleteUsuario";
import { updateMotorista } from "./Usuario/updateMotorista"
import { adicionarVeiculo } from "./Veiculos/adicionarVeiculo";
import { listarVeiculos } from "./Veiculos/listarVeiculos";
import { editarVeiculo } from "./Veiculos/editarVeiculo";
import { onRequest } from "./auth/onRequest";
import { me } from "./auth/me";
import { criarCorrida } from "./Corridas/criarCorrida";
import { deletarCorrida } from "./Corridas/deletarCorrida";
import { listarCorridas } from "./Corridas/listarCorridas";
import { buscarCorrida } from "./Corridas/buscarCorrida";
import { listarMotoristas } from "./Usuario/listarMotoristas";
import { perfil } from "./Usuario/perfil";
import { solicitarCorridaPrivada } from "./CorridasPrivadas/solicitarCorridaPrivada";
import { aceitarPropostaCorridaPrivada } from "./CorridasPrivadas/aceitarPropostaCorridaPrivada";
import { listarCorridasPrivadas } from "./CorridasPrivadas/listarCorridasPrivadas";
import { atualizarVagasCorridaPrivada } from "./CorridasPrivadas/atualizarVagasCorridaPrivada";

export async function routes(app: FastifyInstance) {

  app.post("/login", login);
  app.post("/criar-motorista", createMotorista);
  app.post("/criar-passageiro", createPassageiro);
  
  // Rotas públicas (não precisam de autenticação)
  app.get("/corridas", listarCorridas);
  app.get("/corridas/:id", buscarCorrida);
  app.get("/motoristas", listarMotoristas);
  app.get("/perfil/:id", perfil);
  
  // Rotas protegidas que precisam de autenticação
  app.get("/me", { preHandler: onRequest }, me);
  app.get("/veiculos", { preHandler: onRequest }, listarVeiculos);
  app.post("/criar-corrida", { preHandler: onRequest }, criarCorrida);
  app.delete("/deletar-corrida/:id", { preHandler: onRequest }, deletarCorrida);
  app.post("/adicionar-veiculo", { preHandler: onRequest }, adicionarVeiculo);
  app.put("/editar-veiculo", { preHandler: onRequest }, editarVeiculo);
  app.delete("/deletar-usuario/:id", { preHandler: onRequest }, deleteUsuario);
  app.put("/atualizar-motorista/:id", { preHandler: onRequest }, updateMotorista);
  
  // Rotas para corridas privadas
  app.post("/solicitar-corrida-privada", { preHandler: onRequest }, solicitarCorridaPrivada);
  app.post("/aceitar-proposta-corrida-privada", { preHandler: onRequest }, aceitarPropostaCorridaPrivada);
  app.get("/corridas-privadas", { preHandler: onRequest }, listarCorridasPrivadas);
  app.put("/atualizar-vagas-corrida-privada", { preHandler: onRequest }, atualizarVagasCorridaPrivada);
}