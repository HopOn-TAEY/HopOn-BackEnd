-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "data_nasc" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "avaliacao_media" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" INTEGER NOT NULL,
    "cnh" TEXT NOT NULL,
    "veiculo_placa" TEXT NOT NULL,
    "veiculo_modelo" TEXT NOT NULL,
    "veiculo_marca" TEXT NOT NULL,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corrida" (
    "id_corrida" SERIAL NOT NULL,
    "id_passageiro" INTEGER NOT NULL,
    "id_motorista" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "preco" DOUBLE PRECISION NOT NULL,
    "hora_saida" TIMESTAMP(3) NOT NULL,
    "n_vagas" INTEGER NOT NULL,

    CONSTRAINT "Corrida_pkey" PRIMARY KEY ("id_corrida")
);

-- CreateTable
CREATE TABLE "Corrida_privada" (
    "id_corrida_privada" SERIAL NOT NULL,
    "id_motorista" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "n_vagas" INTEGER NOT NULL,

    CONSTRAINT "Corrida_privada_pkey" PRIMARY KEY ("id_corrida_privada")
);

-- CreateTable
CREATE TABLE "Passageiro" (
    "id" INTEGER NOT NULL,
    "corridaId" INTEGER NOT NULL,
    "corridaPrivadaId" INTEGER NOT NULL,

    CONSTRAINT "Passageiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cnh_key" ON "Motorista"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_veiculo_placa_key" ON "Motorista"("veiculo_placa");

-- AddForeignKey
ALTER TABLE "Motorista" ADD CONSTRAINT "Motorista_id_fkey" FOREIGN KEY ("id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corrida" ADD CONSTRAINT "Corrida_id_motorista_fkey" FOREIGN KEY ("id_motorista") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corrida_privada" ADD CONSTRAINT "Corrida_privada_id_motorista_fkey" FOREIGN KEY ("id_motorista") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passageiro" ADD CONSTRAINT "Passageiro_id_fkey" FOREIGN KEY ("id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passageiro" ADD CONSTRAINT "Passageiro_corridaId_fkey" FOREIGN KEY ("corridaId") REFERENCES "Corrida"("id_corrida") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passageiro" ADD CONSTRAINT "Passageiro_corridaPrivadaId_fkey" FOREIGN KEY ("corridaPrivadaId") REFERENCES "Corrida_privada"("id_corrida_privada") ON DELETE RESTRICT ON UPDATE CASCADE;
