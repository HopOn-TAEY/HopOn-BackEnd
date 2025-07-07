-- CreateTable
CREATE TABLE "corridas_privadas" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "passageiroId" TEXT NOT NULL,
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
    "preco" DOUBLE PRECISION,
    "observacoes" TEXT,
    "status" "StatusCorrida" NOT NULL DEFAULT 'AGENDADA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corridas_privadas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "corridas_privadas" ADD CONSTRAINT "corridas_privadas_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "perfis_motoristas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas_privadas" ADD CONSTRAINT "corridas_privadas_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corridas_privadas" ADD CONSTRAINT "corridas_privadas_passageiroId_fkey" FOREIGN KEY ("passageiroId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
