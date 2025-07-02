import fastify from "fastify";
import {routes} from "./http/routes";
import { fastifyJwt } from '@fastify/jwt';
import { env } from "./env";

export const app = fastify()

app.register(fastifyJwt, {
    secret: env.JWT_SECRET
})

app.register(routes)