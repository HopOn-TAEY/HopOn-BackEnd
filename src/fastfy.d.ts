import { Session } from '@fastify/session';

declare module 'fastify' {
  interface FastifyRequest {
    session: Session;
  }
}