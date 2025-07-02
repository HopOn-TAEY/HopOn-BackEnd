import fastify from "fastify";
import {routes} from "./http/routes";
<<<<<<< HEAD
import jwt from '@fastify/jwt';
import { env } from "./env";

export const app = fastify()

app.register(jwt, {
    secret: env.JWT_SECRET
})

=======
import cookie from '@fastify/cookie';
const session = require('@fastify/session').default


export const app = fastify()

app.register(cookie)
app.register(session, {
    secret: "secretTestParaLoginDeMotoristasQueEstaoCadastradosNoSistema",
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
})
>>>>>>> fix
app.register(routes)