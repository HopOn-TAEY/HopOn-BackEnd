-- CreateEnum
CREATE TYPE "TipoImagemVeiculo" AS ENUM ('PRINCIPAL', 'SECUNDARIA');

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "imagemPrincipal" TEXT;

-- CreateTable
CREATE TABLE "imagens_veiculos" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "TipoImagemVeiculo" NOT NULL DEFAULT 'SECUNDARIA',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagens_veiculos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "imagens_veiculos" ADD CONSTRAINT "imagens_veiculos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
