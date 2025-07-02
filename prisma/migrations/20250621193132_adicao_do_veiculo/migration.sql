/*
  Warnings:

  - You are about to drop the column `veiculo_marca` on the `Motorista` table. All the data in the column will be lost.
  - You are about to drop the column `veiculo_modelo` on the `Motorista` table. All the data in the column will be lost.
  - You are about to drop the column `veiculo_placa` on the `Motorista` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telefone]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Motorista_veiculo_placa_key";

-- AlterTable
ALTER TABLE "Motorista" DROP COLUMN "veiculo_marca",
DROP COLUMN "veiculo_modelo",
DROP COLUMN "veiculo_placa";

-- CreateTable
CREATE TABLE "Veiculo" (
    "veiculo_marca" TEXT NOT NULL,
    "veiculo_placa" TEXT NOT NULL,
    "veiculo_modelo" TEXT NOT NULL,
    "id_motorista" INTEGER NOT NULL,
    "suporteCrianças" BOOLEAN NOT NULL DEFAULT false,
    "suportePessoasDeficientes" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_veiculo_placa_key" ON "Veiculo"("veiculo_placa");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefone_key" ON "Usuario"("telefone");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_id_motorista_fkey" FOREIGN KEY ("id_motorista") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
