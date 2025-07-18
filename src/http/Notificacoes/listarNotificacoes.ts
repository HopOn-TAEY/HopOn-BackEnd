import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function listarNotificacoes(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;

  // Schema de validação para query parameters
  const querySchema = z.object({
    naoLidas: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1)
  });

  try {
    const query = querySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    // Construir filtros
    const where: any = {
      usuarioId: userId
    };

    if (query.naoLidas) {
      where.lida = false;
    }

    // Buscar notificações
    const [notificacoes, total] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: {
          criadoEm: 'desc'
        },
        skip,
        take: query.limit
      }),
      prisma.notificacao.count({ where })
    ]);

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    return reply.status(200).send({
      message: "Notificações listadas com sucesso",
      paginacao: {
        pagina: query.page,
        totalPaginas: totalPages,
        totalItens: total,
        itensPorPagina: query.limit,
        temProximaPagina: hasNextPage,
        temPaginaAnterior: hasPreviousPage
      },
      notificacoes: notificacoes.map(n => ({
        ...n,
        corridaId: n.corridaId || null
      }))
    });

  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Parâmetros de consulta inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 