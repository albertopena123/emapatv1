-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "billing_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "billingDay" INTEGER NOT NULL,
    "billingHour" INTEGER NOT NULL,
    "billingMinute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'America/Lima',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "periodDuration" INTEGER NOT NULL DEFAULT 30,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT true,
    "retryOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "tariffCategories" INTEGER[],
    "sensorStatuses" "SensorStatus"[] DEFAULT ARRAY['ACTIVE']::"SensorStatus"[],
    "notifyOnSuccess" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnError" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmails" TEXT[],
    "lastRun" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "nextRun" TIMESTAMP(3),
    "totalInvoices" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_executions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "totalSensors" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "summary" JSONB,

    CONSTRAINT "billing_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_executions_configId_startedAt_idx" ON "billing_executions"("configId", "startedAt");

-- AddForeignKey
ALTER TABLE "billing_executions" ADD CONSTRAINT "billing_executions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "billing_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
