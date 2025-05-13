-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "AgentEnvironment" AS ENUM ('DEVELOPMENT', 'PRODUCTION');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "environment" "AgentEnvironment" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "assistant" TEXT,
    "ended_reason" TEXT,
    "customer_phone" TEXT,
    "call_start_time" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION,
    "call_ended_time" TIMESTAMP(3),
    "date" TIMESTAMP(3),
    "recording_url" TEXT,
    "summary" TEXT,
    "vapi_score" BOOLEAN,
    "check" BOOLEAN,
    "status_feedback_engineer" TEXT,
    "comments_engineer" TEXT,
    "agentId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanEvaluation" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "evaluator" TEXT,
    "evaluation" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMEvaluation" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "sentiment" TEXT,
    "sentiment_reasoning" TEXT,
    "sentiment_confidence" DOUBLE PRECISION,
    "protocol_adherence" DOUBLE PRECISION,
    "protocol_reasoning" TEXT,
    "protocol_confidence" DOUBLE PRECISION,
    "outcome" TEXT,
    "outcome_reasoning" TEXT,
    "outcome_confidence" DOUBLE PRECISION,
    "call_type_value" TEXT,
    "call_type_reasoning" TEXT,
    "call_type_confidence" DOUBLE PRECISION,
    "llm_feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ade0db',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "callId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgProtocolScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positivePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negativePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neutralPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyCallVolume" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "volume" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourlyCallVolume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CallToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CallToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Clinic_companyId_idx" ON "Clinic"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_name_companyId_key" ON "Clinic"("name", "companyId");

-- CreateIndex
CREATE INDEX "Agent_companyId_idx" ON "Agent"("companyId");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_companyId_key" ON "Agent"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_call_id_key" ON "Call"("call_id");

-- CreateIndex
CREATE INDEX "Call_agentId_idx" ON "Call"("agentId");

-- CreateIndex
CREATE INDEX "Call_clinicId_idx" ON "Call"("clinicId");

-- CreateIndex
CREATE INDEX "Call_call_start_time_idx" ON "Call"("call_start_time");

-- CreateIndex
CREATE INDEX "Call_date_idx" ON "Call"("date");

-- CreateIndex
CREATE INDEX "Call_call_ended_time_idx" ON "Call"("call_ended_time");

-- CreateIndex
CREATE INDEX "Call_check_idx" ON "Call"("check");

-- CreateIndex
CREATE INDEX "Call_status_feedback_engineer_idx" ON "Call"("status_feedback_engineer");

-- CreateIndex
CREATE UNIQUE INDEX "HumanEvaluation_callId_key" ON "HumanEvaluation"("callId");

-- CreateIndex
CREATE INDEX "HumanEvaluation_evaluation_idx" ON "HumanEvaluation"("evaluation");

-- CreateIndex
CREATE INDEX "HumanEvaluation_createdAt_idx" ON "HumanEvaluation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LLMEvaluation_callId_key" ON "LLMEvaluation"("callId");

-- CreateIndex
CREATE INDEX "LLMEvaluation_sentiment_idx" ON "LLMEvaluation"("sentiment");

-- CreateIndex
CREATE INDEX "LLMEvaluation_protocol_adherence_idx" ON "LLMEvaluation"("protocol_adherence");

-- CreateIndex
CREATE INDEX "LLMEvaluation_outcome_idx" ON "LLMEvaluation"("outcome");

-- CreateIndex
CREATE INDEX "LLMEvaluation_call_type_value_idx" ON "LLMEvaluation"("call_type_value");

-- CreateIndex
CREATE INDEX "LLMEvaluation_createdAt_idx" ON "LLMEvaluation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CallType_name_key" ON "CallType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CallType_callId_key" ON "CallType"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_date_key" ON "DailyAnalytics"("date");

-- CreateIndex
CREATE INDEX "DailyAnalytics_date_idx" ON "DailyAnalytics"("date");

-- CreateIndex
CREATE INDEX "DailyAnalytics_companyId_idx" ON "DailyAnalytics"("companyId");

-- CreateIndex
CREATE INDEX "DailyAnalytics_clinicId_idx" ON "DailyAnalytics"("clinicId");

-- CreateIndex
CREATE INDEX "HourlyCallVolume_date_idx" ON "HourlyCallVolume"("date");

-- CreateIndex
CREATE INDEX "HourlyCallVolume_hour_idx" ON "HourlyCallVolume"("hour");

-- CreateIndex
CREATE INDEX "HourlyCallVolume_companyId_idx" ON "HourlyCallVolume"("companyId");

-- CreateIndex
CREATE INDEX "HourlyCallVolume_clinicId_idx" ON "HourlyCallVolume"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyCallVolume_date_hour_companyId_clinicId_key" ON "HourlyCallVolume"("date", "hour", "companyId", "clinicId");

-- CreateIndex
CREATE INDEX "_CallToTag_B_index" ON "_CallToTag"("B");

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanEvaluation" ADD CONSTRAINT "HumanEvaluation_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMEvaluation" ADD CONSTRAINT "LLMEvaluation_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallType" ADD CONSTRAINT "CallType_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CallToTag" ADD CONSTRAINT "_CallToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CallToTag" ADD CONSTRAINT "_CallToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
