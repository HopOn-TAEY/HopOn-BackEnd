import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id_usuario: string
      email: string
      tipo: string
    }
    user: {
      id_usuario: string
      email: string
      tipo: string
    }
  }
}