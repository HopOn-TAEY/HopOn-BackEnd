import fastify from "fastify";
import {routes} from "./http/routes";
import cookie from '@fastify/cookie';
import session from '@fastify/session';


export const app = fastify()

// app.register(cookie)
// app.register(session, {
//     secret: "secretTestParaLoginDeMotoristasQueEstaoCadastradosNoSistema",
//     cookie: {
//         secure: false,
//         maxAge: 1000 * 60 * 60 * 24
//     }
// })
app.register(routes)