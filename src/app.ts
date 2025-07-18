import fastify from "fastify";
import {routes} from "./http/routes";
import { fastifyJwt } from '@fastify/jwt';
import { fastifyCors } from '@fastify/cors';
import { env } from "./env";

export const app = fastify()

// Configuração do CORS para permitir requisições do front-end
app.register(fastifyCors, {
  origin: true, // Permite todas as origens em desenvolvimento
  credentials: true, // Permite cookies e headers de autenticação
  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Corrigido para string
  allowedHeaders: 'Content-Type,Authorization', // Corrigido para string
});

app.register(fastifyJwt, {
    secret: env.JWT_SECRET
})

app.register(routes)