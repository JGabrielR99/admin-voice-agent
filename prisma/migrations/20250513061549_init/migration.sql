/*
  Warnings:

  - You are about to drop the column `environment` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `assistant` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `call_ended_time` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `call_id` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `call_start_time` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `check` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `comments_engineer` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `customer_phone` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `ended_reason` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `recording_url` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `status_feedback_engineer` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `vapi_score` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the `CallType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DailyAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HourlyCallVolume` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HumanEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LLMEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CallToTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceCallId]` on the table `Call` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Clinic` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `callStartTime` to the `Call` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceCallId` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "CallType" DROP CONSTRAINT "CallType_callId_fkey";

-- DropForeignKey
ALTER TABLE "Clinic" DROP CONSTRAINT "Clinic_companyId_fkey";

-- DropForeignKey
ALTER TABLE "HumanEvaluation" DROP CONSTRAINT "HumanEvaluation_callId_fkey";

-- DropForeignKey
ALTER TABLE "LLMEvaluation" DROP CONSTRAINT "LLMEvaluation_callId_fkey";

-- DropForeignKey
ALTER TABLE "_CallToTag" DROP CONSTRAINT "_CallToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_CallToTag" DROP CONSTRAINT "_CallToTag_B_fkey";

-- DropIndex
DROP INDEX "Agent_companyId_idx";

-- DropIndex
DROP INDEX "Agent_isActive_idx";

-- DropIndex
DROP INDEX "Agent_name_companyId_key";

-- DropIndex
DROP INDEX "Call_call_ended_time_idx";

-- DropIndex
DROP INDEX "Call_call_id_key";

-- DropIndex
DROP INDEX "Call_call_start_time_idx";

-- DropIndex
DROP INDEX "Call_check_idx";

-- DropIndex
DROP INDEX "Call_date_idx";

-- DropIndex
DROP INDEX "Call_status_feedback_engineer_idx";

-- DropIndex
DROP INDEX "Clinic_companyId_idx";

-- DropIndex
DROP INDEX "Clinic_name_companyId_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "environment",
DROP COLUMN "isActive",
DROP COLUMN "type",
ADD COLUMN     "externalId" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "companyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "assistant",
DROP COLUMN "call_ended_time",
DROP COLUMN "call_id",
DROP COLUMN "call_start_time",
DROP COLUMN "check",
DROP COLUMN "comments_engineer",
DROP COLUMN "customer_phone",
DROP COLUMN "date",
DROP COLUMN "duration",
DROP COLUMN "ended_reason",
DROP COLUMN "recording_url",
DROP COLUMN "status_feedback_engineer",
DROP COLUMN "vapi_score",
ADD COLUMN     "callDate" TIMESTAMP(3),
ADD COLUMN     "callEndedTime" TIMESTAMP(3),
ADD COLUMN     "callReason" TEXT,
ADD COLUMN     "callStartTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "callTypeConfidence" DOUBLE PRECISION,
ADD COLUMN     "callTypeReasoning" TEXT,
ADD COLUMN     "callTypeValue" TEXT,
ADD COLUMN     "checkStatus" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhoneNumber" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "durationSeconds" DOUBLE PRECISION,
ADD COLUMN     "endedReason" TEXT,
ADD COLUMN     "engineerComments" TEXT,
ADD COLUMN     "engineerStatus" TEXT,
ADD COLUMN     "evaluation" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "insurance" TEXT,
ADD COLUMN     "llmFeedback" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "outcomeConfidence" DOUBLE PRECISION,
ADD COLUMN     "outcomeReasoning" TEXT,
ADD COLUMN     "protocolAdherence" INTEGER,
ADD COLUMN     "protocolConfidence" DOUBLE PRECISION,
ADD COLUMN     "protocolReasoning" TEXT,
ADD COLUMN     "qaCheck" TEXT,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "reviewerName" TEXT,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "sentimentConfidence" DOUBLE PRECISION,
ADD COLUMN     "sentimentReasoning" TEXT,
ADD COLUMN     "sourceCallId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "vapiScore" TEXT,
ALTER COLUMN "agentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Clinic" ALTER COLUMN "companyId" DROP NOT NULL;

-- DropTable
DROP TABLE "CallType";

-- DropTable
DROP TABLE "DailyAnalytics";

-- DropTable
DROP TABLE "HourlyCallVolume";

-- DropTable
DROP TABLE "HumanEvaluation";

-- DropTable
DROP TABLE "LLMEvaluation";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_CallToTag";

-- DropEnum
DROP TYPE "AgentEnvironment";

-- DropEnum
DROP TYPE "AgentType";

-- CreateIndex
CREATE UNIQUE INDEX "Agent_externalId_key" ON "Agent"("externalId");

-- CreateIndex
CREATE INDEX "Agent_companyId_externalId_idx" ON "Agent"("companyId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_sourceCallId_key" ON "Call"("sourceCallId");

-- CreateIndex
CREATE INDEX "Call_callStartTime_idx" ON "Call"("callStartTime");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_name_key" ON "Clinic"("name");

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
