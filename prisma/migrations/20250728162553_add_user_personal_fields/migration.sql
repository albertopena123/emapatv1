-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'O');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "fecha_nacimiento" TIMESTAMP(3),
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "ubigeo_nac" TEXT;
