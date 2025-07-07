import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function editarVeiculo(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  // Verificar se o usuário é um motorista
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem editar veículos" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  // Schema de validação para os dados do veículo
  const editarVeiculoSchema = z.object({
    veiculoId: z.string().cuid("ID do veículo inválido"),
    placa: z.string().min(7, "Placa deve ter pelo menos 7 caracteres").max(8, "Placa deve ter no máximo 8 caracteres").optional(),
    marca: z.string().min(1, "Marca é obrigatória").optional(),
    modelo: z.string().min(1, "Modelo é obrigatório").optional(),
    ano: z.number().int().min(1900, "Ano deve ser maior que 1900").max(new Date().getFullYear() + 1, "Ano não pode ser futuro").optional(),
    cor: z.string().min(1, "Cor é obrigatória").optional(),
    capacidade: z.number().int().min(1, "Capacidade deve ser pelo menos 1").max(20, "Capacidade máxima é 20").optional(),
    suporteCriancas: z.boolean().optional(),
    suporteDeficientes: z.boolean().optional(),
    imagemPrincipal: z.string().url("URL da imagem principal deve ser válida").optional(),
    imagens: z.array(z.object({
      id: z.string().cuid().optional(), // ID opcional para imagens existentes
      url: z.string().url("URL da imagem deve ser válida"),
      tipo: z.enum(["PRINCIPAL", "SECUNDARIA"]).default("SECUNDARIA"),
      ordem: z.number().int().min(0).default(0),
      deletar: z.boolean().default(false) // Flag para deletar imagem existente
    })).optional()
  });

  try {
    const dados = editarVeiculoSchema.parse(request.body);

    // Verificar se o veículo existe e pertence ao motorista
    const veiculoExistente = await prisma.veiculo.findFirst({
      where: {
        id: dados.veiculoId,
        motoristaId: motoristaId
      },
      include: {
        imagens: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

    if (!veiculoExistente) {
      return reply.status(404).send({ error: "Veículo não encontrado ou não pertence a este motorista" });
    }

    // Se a placa foi alterada, verificar se já existe
    if (dados.placa && dados.placa !== veiculoExistente.placa) {
      const placaExistente = await prisma.veiculo.findUnique({
        where: { placa: dados.placa }
      });

      if (placaExistente) {
        return reply.status(400).send({ error: "Veículo com esta placa já está cadastrado" });
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {};
    
    if (dados.placa) dadosAtualizacao.placa = dados.placa;
    if (dados.marca) dadosAtualizacao.marca = dados.marca;
    if (dados.modelo) dadosAtualizacao.modelo = dados.modelo;
    if (dados.ano) dadosAtualizacao.ano = dados.ano;
    if (dados.cor) dadosAtualizacao.cor = dados.cor;
    if (dados.capacidade) dadosAtualizacao.capacidade = dados.capacidade;
    if (dados.suporteCriancas !== undefined) dadosAtualizacao.suporteCriancas = dados.suporteCriancas;
    if (dados.suporteDeficientes !== undefined) dadosAtualizacao.suporteDeficientes = dados.suporteDeficientes;
    if (dados.imagemPrincipal !== undefined) dadosAtualizacao.imagemPrincipal = dados.imagemPrincipal;

    // Atualizar o veículo
    const veiculo = await prisma.veiculo.update({
      where: { id: dados.veiculoId },
      data: dadosAtualizacao,
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

    // Gerenciar imagens se fornecidas
    if (dados.imagens) {
      // Deletar imagens marcadas para exclusão
      const imagensParaDeletar = dados.imagens.filter(img => img.deletar && img.id);
      if (imagensParaDeletar.length > 0) {
        await prisma.imagemVeiculo.deleteMany({
          where: {
            id: { in: imagensParaDeletar.map(img => img.id!) }
          }
        });
      }

      // Atualizar ou criar novas imagens
      for (const img of dados.imagens) {
        if (img.deletar) continue; // Pular imagens marcadas para deletar

        if (img.id) {
          // Atualizar imagem existente
          await prisma.imagemVeiculo.update({
            where: { id: img.id },
            data: {
              url: img.url,
              tipo: img.tipo,
              ordem: img.ordem
            }
          });
        } else {
          // Criar nova imagem
          await prisma.imagemVeiculo.create({
            data: {
              veiculoId: dados.veiculoId,
              url: img.url,
              tipo: img.tipo,
              ordem: img.ordem
            }
          });
        }
      }

      // Buscar imagens atualizadas
      const imagensAtualizadas = await prisma.imagemVeiculo.findMany({
        where: { veiculoId: dados.veiculoId },
        orderBy: { ordem: 'asc' }
      });

      return reply.status(200).send({
        message: "Veículo atualizado com sucesso",
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
          atualizadoEm: veiculo.atualizadoEm,
          motorista: {
            id: veiculo.motorista.usuario.id,
            nome: veiculo.motorista.usuario.nome,
            email: veiculo.motorista.usuario.email
          },
          imagens: imagensAtualizadas.map(img => ({
            id: img.id,
            url: img.url,
            tipo: img.tipo,
            ordem: img.ordem
          }))
        }
      });
    }

    return reply.status(200).send({
      message: "Veículo atualizado com sucesso",
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
        atualizadoEm: veiculo.atualizadoEm,
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
    console.error("Erro ao editar veículo:", error);
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }

    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
} 