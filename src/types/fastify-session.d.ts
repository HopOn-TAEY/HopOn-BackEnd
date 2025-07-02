import '@fastify/session';
import { setDefaultAutoSelectFamily } from 'net';

declare module '@fastify/session' {
  interface SessionData {
    usuario?: {
      id_usuario: number;
      email: string;
    }
  }
}