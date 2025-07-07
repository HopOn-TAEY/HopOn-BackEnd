import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function adicionarVeiculo(request: FastifyRequest, reply: FastifyReply) {
  // Verificar se o usuário está autenticado
  if (!request.user) {
    return reply.status(401).send({ error: "Usuário não autenticado" });
  }
  
  const userId = request.user.id_usuario;
  
  // Verificar se o usuário é um motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem adicionar veículos" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Schema de validação para os dados do veículo
  const adicionarVeiculoSchema = z.object({
    placa: z.string().min(7, "Placa deve ter pelo menos 7 caracteres").max(8, "Placa deve ter no máximo 8 caracteres"),
    marca: z.string().min(1, "Marca é obrigatória"),
    modelo: z.string().min(1, "Modelo é obrigatório"),
    ano: z.number().int().min(1900, "Ano deve ser maior que 1900").max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),
    cor: z.string().min(1, "Cor é obrigatória"),
    capacidade: z.number().int().min(1, "Capacidade deve ser pelo menos 1").max(20, "Capacidade máxima é 20"),
    suporteCriancas: z.boolean().default(false),
    suporteDeficientes: z.boolean().default(false),
    imagemPrincipal: z.string().url("URL da imagem principal deve ser válida").optional(),
    imagens: z.array(z.object({
      url: z.string().url("URL da imagem deve ser válida"),
      tipo: z.enum(["PRINCIPAL", "SECUNDARIA"]).default("SECUNDARIA"),
      ordem: z.number().int().min(0).default(0)
    })).optional()
  });

  try {
    const dados = adicionarVeiculoSchema.parse(request.body);

    // Verificar se a placa já existe
    const veiculoExistente = await prisma.veiculo.findUnique({
      where: { placa: dados.placa }
    });

    if (veiculoExistente) {
      return reply.status(400).send({ error: "Veículo com esta placa já está cadastrado" });
    }

    // Criar o veículo com imagens
    const veiculo = await prisma.veiculo.create({
      data: {
        motoristaId: motoristaId,
        placa: dados.placa,
        marca: dados.marca,
        modelo: dados.modelo,
        ano: dados.ano,
        cor: dados.cor,
        capacidade: dados.capacidade,
        suporteCriancas: dados.suporteCriancas,
        suporteDeficientes: dados.suporteDeficientes,
        imagemPrincipal: dados.imagemPrincipal,
        imagens: dados.imagens ? {
          create: dados.imagens.map((img, index) => ({
            url: img.url,
            tipo: img.tipo,
            ordem: img.ordem || index
          }))
        } : undefined
      },
      include: {
        motorista: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        imagens: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

    return reply.status(201).send({
      message: "Veículo adicionado com sucesso",
      veiculo: {
        id: veiculo.id,
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        cor: veiculo.cor,
        capacidade: veiculo.capacidade,
        suporteCriancas: veiculo.suporteCriancas,
        suporteDeficientes: veiculo.suporteDeficientes,
        imagemPrincipal: veiculo.imagemPrincipal,
        criadoEm: veiculo.criadoEm,
        motorista: {
          id: veiculo.motorista.usuario.id,
          nome: veiculo.motorista.usuario.nome,
          email: veiculo.motorista.usuario.email
        },
        imagens: veiculo.imagens?.map(img => ({
          id: img.id,
          url: img.url,
          tipo: img.tipo,
          ordem: img.ordem
        })) || []
      }
    });

  } catch (error) {
    console.error("Erro ao adicionar veículo:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 