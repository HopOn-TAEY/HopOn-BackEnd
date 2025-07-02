/*
  Warnings:

  - You are about to drop the `Corrida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Corrida_privada` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Motorista` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Passageiro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Veiculo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('MOTORISTA', 'PASSAGEIRO');

-- CreateEnum
CREATE TYPE "StatusCorrida" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoCorrida" AS ENUM ('RECORRENTE', 'PRIVADA');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('ABERTA', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Corrida" DROP CONSTRAINT "Corrida_id_motorista_fkey";

-- DropForeignKey
ALTER TABLE "Corrida_privada" DROP CONSTRAINT "Corrida_privada_id_motorista_fkey";

-- DropForeignKey
ALTER TABLE "Motorista" DROP CONSTRAINT "Motorista_id_fkey";

-- DropForeignKey
ALTER TABLE "Passageiro" DROP CONSTRAINT "Passageiro_corridaId_fkey";

-- DropForeignKey
ALTER TABLE "Passageiro" DROP CONSTRAINT "Passageiro_corridaPrivadaId_fkey";

-- DropForeignKey
ALTER TABLE "Passageiro" DROP CONSTRAINT "Passageiro_id_fkey";

-- DropForeignKey
ALTER TABLE "Veiculo" DROP CONSTRAINT "Veiculo_id_motorista_fkey";

-- DropTable
DROP TABLE "Corrida";

-- DropTable
DROP TABLE "Corrida_privada";

-- DropTable
DROP TABLE "Motorista";

-- DropTable
DROP TABLE "Passageiro";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "Veiculo";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "dataNasc" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "avaliacaoMedia" DOUBLE PRECISION DEFAULT 0,
    "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_motoristas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suporteCriancas" BOOLEAN NOT NULL DEFAULT false,
    "suporteDeficientes" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corridas" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "latitudeOrigem" DOUBLE PRECISION,
    "longitudeOrigem" DOUBLE PRECISION,
    "latitudeDestino" DOUBLE PRECISION,
    "longitudeDestino" DOUBLE PRECISION,
    "dataHoraSaida" TIMESTAMP(3) NOT NULL,
    "dataHoraChegada" TIMESTAMP(3),
    "numeroVagas" INTEGER NOT NULL,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" "StatusCorrida" NOT NULL DEFAULT 'AGENDADA',
    "tipo" "TipoCorrida" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corridas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corridas_recorrentes" (
    "id" TEXT NOT NULL,
    "corridaId" TEXT NOT NULL,
    "diasSemana" "DiaSemana"[],
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corridas_recorrentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "corridaId" TEXT NOT NULL,
    "passageiroId" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
    "numeroAssentos" INTEGER NOT NULL DEFAULT 1,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "corridaId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "avaliadoId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_viagem" (
    "id" TEXT NOT NULL,
    "passageiroId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "latitudeOrigem" DOUBLE PRECISION,
    "longitudeOrigem" DOUBLE PRECISION,
    "latitudeDestino" DOUBLE PRECISION,
    "longitudeDestino" DOUBLE PRECISION,
    "dataHoraSaida" TIMESTAMP(3) NOT NULL,
    "numeroPassageiros" INTEGER NOT NULL DEFAULT 1,
    "descricao" TEXT,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'ABERTA',
    "dataExpiracao" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_viagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas_solicitacao" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "observacoes" TEXT,
    "aceita" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefone_key" ON "usuarios"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_motoristas_usuarioId_key" ON "perfis_motoristas"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_motoristas_cnh_key" ON "perfis_motoristas"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "corridas_recorrentes_corridaId_key" ON "corridas_recorrentes"("corridaId");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_corridaId_passageiroId_key" ON "reservas"("corridaId", "passageiroId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_corridaId_avaliadorId_avaliadoId_key" ON "avaliacoes"("corridaId", "avaliadorId", "avaliadoId");

-- CreateIndex
CREATE UNIQUE INDEX "propostas_solicitacao_solicitacaoId_motoristaId_key" ON "propostas_solicitacao"("solicitacaoId", "motoristaId");

-- AddForeignKey
ALTER TABLE "perfis_motoristas" ADD CONSTRAINT "perfis_motoristas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "perfis_motoristas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "perfis_motoristas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas" ADD CONSTRAINT "corridas_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas_recorrentes" ADD CONSTRAINT "corridas_recorrentes_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "corridas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "corridas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_passageiroId_fkey" FOREIGN KEY ("passageiroId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "corridas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_viagem" ADD CONSTRAINT "solicitacoes_viagem_passageiroId_fkey" FOREIGN KEY ("passageiroId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_solicitacao" ADD CONSTRAINT "propostas_solicitacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_viagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_solicitacao" ADD CONSTRAINT "propostas_solicitacao_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "perfis_motoristas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_solicitacao" ADD CONSTRAINT "propostas_solicitacao_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
