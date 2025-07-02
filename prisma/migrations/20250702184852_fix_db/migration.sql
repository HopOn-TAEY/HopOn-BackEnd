/*
  Warnings:

  - You are about to drop the column `avaliacaoMedia` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `totalAvaliacoes` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "StatusSolicitacao" ADD VALUE 'EXPIRADA';

-- AlterTable
ALTER TABLE "corridas" ADD COLUMN     "preco" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "perfis_motoristas" ADD COLUMN     "avaliacaoMedia" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "propostas_solicitacao" ADD COLUMN     "precoOfertado" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "solicitacoes_viagem" ADD COLUMN     "precoMaximo" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "avaliacaoMedia",
DROP COLUMN "totalAvaliacoes";

-- CreateTable
CREATE TABLE "localidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);
