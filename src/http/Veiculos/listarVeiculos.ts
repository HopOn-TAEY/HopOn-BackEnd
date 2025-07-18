import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarVeiculos(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id_usuario;
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfilMotorista: true }
  });

  if (!usuario || usuario.tipo !== "MOTORISTA" || !usuario.perfilMotorista) {
    return reply.status(403).send({ error: "Apenas motoristas podem visualizar veículos" });
  }

  const motoristaId = usuario.perfilMotorista.id;

  try {
    const veiculos = await prisma.veiculo.findMany({
      where: { motoristaId: motoristaId },
      include: {
        imagens: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    console.log('Veículos encontrados no banco:', veiculos);
    console.log('Primeiro veículo:', veiculos[0]);

    const veiculosMapeados = veiculos.map(veiculo => ({
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
      imagens: veiculo.imagens?.map(img => ({
        id: img.id,
        url: img.url,
        tipo: img.tipo,
        ordem: img.ordem
      })) || []
    }));

    console.log('Veículos mapeados:', veiculosMapeados);

    return reply.status(200).send({
      message: "Veículos listados com sucesso",
      total: veiculos.length,
      veiculos: veiculosMapeados
    });

  } catch (error) {
    console.error("Erro ao listar veículos:", error);
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
}

export async function listarVeiculosPublicos(request: FastifyRequest, reply: FastifyReply) {
  const id = (request.query as any).id;
  if (!id) {
    return reply.status(400).send({ error: 'ID do motorista é obrigatório' });
  }
  try {
    const veiculos = await prisma.veiculo.findMany({
      where: { motoristaId: id },
      include: {
        imagens: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    const veiculosMapeados = veiculos.map(veiculo => ({
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
      imagens: veiculo.imagens?.map(img => ({
        id: img.id,
        url: img.url,
        tipo: img.tipo,
        ordem: img.ordem
      })) || []
    }));
    return reply.status(200).send({
      message: "Veículos públicos listados com sucesso",
      total: veiculos.length,
      veiculos: veiculosMapeados
    });
  } catch (error) {
    console.error("Erro ao listar veículos públicos:", error);
    return reply.status(500).send({ error: "Erro interno do servidor" });
  }
}