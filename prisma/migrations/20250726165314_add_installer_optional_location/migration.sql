-- DropForeignKey
ALTER TABLE "sensors" DROP CONSTRAINT "sensors_locationId_fkey";

-- AlterTable
ALTER TABLE "sensors" ADD COLUMN     "installerId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'INACTIVE',
ALTER COLUMN "locationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
