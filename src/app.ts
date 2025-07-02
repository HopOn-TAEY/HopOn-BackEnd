import fastify from "fastify";
import {routes} from "./http/routes";
import jwt from '@fastify/jwt';
import { env } from "./env";

export const app = fastify()

app.register(jwt, {
    secret: env.JWT_SECRET
})

app.register(routes)