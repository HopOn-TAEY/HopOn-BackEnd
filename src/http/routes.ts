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
import { listarVeiculosPublicos } from "./Veiculos/listarVeiculos";
import { corridasFinalizadas } from "./Usuario/perfil";
import { criarReserva } from "./Corridas/criarReserva";
import { listarReservasCorrida } from "./Corridas/listarReservasCorrida";
import { autorizarReserva } from "./Corridas/autorizarReserva";
import { cancelarReserva } from "./Corridas/cancelarReserva";
import { deletarVeiculo } from "./Veiculos/deletarVeiculo";
import { listarCorridasPrivadasMotorista } from "./CorridasPrivadas/listarCorridasPrivadasMotorista";
import { cancelarCorrida } from "./Corridas/cancelarCorrida";
import { finalizarCorrida } from "./Corridas/finalizarCorrida";
import { listarNotificacoes } from "./Notificacoes/listarNotificacoes";
import { marcarComoLida } from "./Notificacoes/marcarComoLida";
import { marcarTodasComoLidas } from "./Notificacoes/marcarTodasComoLidas";
import { listarCorridasFinalizadasParaAvaliacao } from "./Avaliacoes/listarCorridasFinalizadasParaAvaliacao";
import { avaliarMotorista } from "./Avaliacoes/avaliarMotorista";
import { listarSolicitacoesPrivadasMotorista } from "./CorridasPrivadas/listarSolicitacoesPrivadasMotorista";
import { recusarSolicitacaoPrivada } from "./CorridasPrivadas/recusarSolicitacaoPrivada";
import { detalharCorrida } from "./Corridas/detalharCorrida";
import { detalharCorridaPrivada } from "./CorridasPrivadas/detalharCorridaPrivada";
import { listarCorridasFinalizadasUsuario } from "./Corridas/listarCorridasFinalizadasUsuario";
import { finalizarCorridaPrivada } from "./CorridasPrivadas/finalizarCorridaPrivada";
import { cancelarCorridaPrivada } from "./CorridasPrivadas/cancelarCorridaPrivada";

export async function routes(app: FastifyInstance) {

  app.post("/login", login);
  app.post("/criar-motorista", createMotorista);
  app.post("/criar-passageiro", createPassageiro);
  
  // Rotas públicas (não precisam de autenticação)
  app.get("/corridas", listarCorridas);
  app.get("/corridas/:id", buscarCorrida);
  app.get("/corridas/:id/reservas", { preHandler: onRequest }, listarReservasCorrida);
  app.get("/corridas/:id/detalhes", detalharCorrida);
  app.get("/corridas-privadas/:id/detalhes", detalharCorridaPrivada);
  app.get("/motoristas", listarMotoristas);
  app.get("/perfil/:id", perfil);
  
  // Removido: app.options('/*', ...)
  // Rota pública para listar veículos de um motorista
  app.get('/veiculos-publicos', listarVeiculosPublicos);
  
  
  // Rotas protegidas que precisam de autenticação
  app.get("/me", { preHandler: onRequest }, me);
  app.get("/veiculos", { preHandler: onRequest }, listarVeiculos);
  app.post("/criar-corrida", { preHandler: onRequest }, criarCorrida);
  app.delete("/deletar-corrida/:id", { preHandler: onRequest }, deletarCorrida);
  app.post("/adicionar-veiculo", { preHandler: onRequest }, adicionarVeiculo);
  app.put("/editar-veiculo", { preHandler: onRequest }, editarVeiculo);
  app.delete("/deletar-usuario/:id", { preHandler: onRequest }, deleteUsuario);
  app.put("/atualizar-motorista/:id", { preHandler: onRequest }, updateMotorista);
  app.get("/corridas-finalizadas", { preHandler: onRequest }, corridasFinalizadas);
  app.post("/criar-reserva", { preHandler: onRequest }, criarReserva);
  app.put("/reservas/:id/autorizar", { preHandler: onRequest }, autorizarReserva);
  app.put("/reservas/:id/cancelar", { preHandler: onRequest }, cancelarReserva);
  app.delete("/deletar-veiculo/:id", { preHandler: onRequest }, deletarVeiculo);
  app.put("/corridas/:id/cancelar", { preHandler: onRequest }, cancelarCorrida);
  app.put("/corridas/:id/finalizar", { preHandler: onRequest }, finalizarCorrida);
  app.get("/corridas-finalizadas-usuario", { preHandler: onRequest }, listarCorridasFinalizadasUsuario);
  
  // Rotas para corridas privadas
  app.post("/solicitar-corrida-privada", { preHandler: onRequest }, solicitarCorridaPrivada);
  app.post("/aceitar-proposta-corrida-privada", { preHandler: onRequest }, aceitarPropostaCorridaPrivada);
  app.post("/recusar-solicitacao-privada", { preHandler: onRequest }, recusarSolicitacaoPrivada);
  app.get("/corridas-privadas", { preHandler: onRequest }, listarCorridasPrivadas);
  app.put("/atualizar-vagas-corrida-privada", { preHandler: onRequest }, atualizarVagasCorridaPrivada);
  app.get("/corridas-privadas-motorista", { preHandler: onRequest }, listarCorridasPrivadasMotorista);
  app.get("/solicitacoes-privadas-motorista", { preHandler: onRequest }, listarSolicitacoesPrivadasMotorista);
  app.get("/notificacoes", { preHandler: onRequest }, listarNotificacoes);
  app.put("/notificacoes/:id/lida", { preHandler: onRequest }, marcarComoLida);
  app.put("/notificacoes/marcar-todas-lidas", { preHandler: onRequest }, marcarTodasComoLidas);
  // Nova rota para compatibilidade com frontend
  app.post("/notificacoes/:id/marcar-como-lida", { preHandler: onRequest }, marcarComoLida);
  app.get("/corridas-finalizadas-para-avaliacao", { preHandler: onRequest }, listarCorridasFinalizadasParaAvaliacao);
  app.post("/avaliar-motorista", { preHandler: onRequest }, avaliarMotorista);
  app.post("/avaliar/:id", { preHandler: onRequest }, avaliarMotorista);
  app.put("/corridas-privadas/:id/finalizar", { preHandler: onRequest }, finalizarCorridaPrivada);
  app.put("/corridas-privadas/:id/cancelar", { preHandler: onRequest }, cancelarCorridaPrivada);
}