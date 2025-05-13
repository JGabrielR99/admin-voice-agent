import { Prisma, PrismaClient, Call } from "@/generated/prisma";
import { ExcelRowData, BatchResult } from "../../types/import-excel";
import {
  parseDate,
  parseFloatOrNull,
  parseIntOrNull,
  getStringOrNull,
  getCallIdDisplay,
} from "../../utils/data-parsers";
import { importProgressTracker } from "../../utils/constants";

export class CallService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Process a batch of Excel rows and create/update Call records
   */
  async processBatch(
    rows: ExcelRowData[],
    clinicId: string,
    jobId: string | null,
    clinicName: string
  ): Promise<BatchResult> {
    const result: BatchResult = { successfulRows: 0, failedRows: 0 };
    const operations: Prisma.PrismaPromise<Call>[] = [];
    const rowsInBatch = rows.length;

    console.log(
      `[Job ${jobId}] Clinic: ${clinicName} - Preparing batch of ${rowsInBatch} rows for transaction.`
    );

    for (const row of rows) {
      importProgressTracker.set({
        processedRows: importProgressTracker.get().processedRows + 1,
      });
      const currentRowNumber = importProgressTracker.get().processedRows;
      const sourceCallId = String(row.call_id || "").trim();
      const callIdDisplay = getCallIdDisplay(sourceCallId);

      console.log(
        `[Job ${jobId}] Clinic: ${clinicName} - Row ${currentRowNumber}/${
          importProgressTracker.get().totalRows
        } (ID: ${callIdDisplay})... preparing for batch.`
      );

      const callData = await this.prepareCallData(
        row,
        clinicId,
        jobId,
        clinicName,
        currentRowNumber
      );

      if (callData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sourceCallId: _, clinic: __, ...updateWithoutKey } = callData;
        operations.push(
          this.prisma.call.upsert({
            where: { sourceCallId: callData.sourceCallId },
            create: callData,
            update: updateWithoutKey,
          })
        );
      } else {
        result.failedRows++;
      }
    }

    if (operations.length > 0) {
      console.log(
        `[Job ${jobId}] Clinic: ${clinicName} - Attempting to upsert ${operations.length} calls in a transaction...`
      );
      try {
        await this.prisma.$transaction(operations);
        result.successfulRows += operations.length;
        console.log(
          `[Job ${jobId}] Clinic: ${clinicName} - Batch upsert of ${operations.length} calls successful.`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown transaction error";
        console.error(
          `[Job ${jobId}] Clinic: ${clinicName} - Batch upsert FAILED for ${operations.length} calls. All operations in this batch rolled back. Error: ${errorMessage}`
        );
        result.failedRows += operations.length;
      }
    } else {
      console.log(
        `[Job ${jobId}] Clinic: ${clinicName} - No valid operations to run in transaction for this batch (all rows may have failed preparation).`
      );
    }

    return result;
  }

  /**
   * Prepare call data from a single Excel row
   */
  private async prepareCallData(
    row: ExcelRowData,
    clinicId: string,
    jobId: string | null,
    clinicName: string,
    currentRowNumber: number
  ): Promise<Prisma.CallCreateInput | null> {
    const sourceCallId = String(row.call_id || "").trim();
    const callIdDisplay = getCallIdDisplay(sourceCallId);
    const totalRows = importProgressTracker.get().totalRows;

    if (!sourceCallId) {
      console.warn(
        `[Job ${jobId}] Clinic: ${clinicName} - Row ${currentRowNumber}/${totalRows} (ID: ${callIdDisplay}): SKIPPED (missing call_id).`
      );
      return null;
    }

    try {
      let agentId: string | null = null;
      if (row.assistant) {
        const externalAgentId = String(row.assistant).trim();
        if (externalAgentId) {
          // Look up agent by externalId first
          let agent = await this.prisma.agent.findFirst({
            where: { externalId: externalAgentId },
          });

          // If not found by externalId, try to find by name (for backward compatibility)
          if (!agent) {
            agent = await this.prisma.agent.findFirst({
              where: { name: externalAgentId },
            });

            // If found by name but no externalId, update it with the externalId
            if (agent && !agent.externalId) {
              agent = await this.prisma.agent.update({
                where: { id: agent.id },
                data: { externalId: externalAgentId },
              });
            }
          }

          // If still not found, create a new agent with both name and externalId
          if (!agent) {
            agent = await this.prisma.agent.create({
              data: {
                name: externalAgentId,
                externalId: externalAgentId,
                company: { connect: { id: "default" } },
              },
            });
          }
          agentId = agent.id;
        }
      }

      const callStartTime = parseDate(
        row.call_start_time,
        "call_start_time",
        sourceCallId
      );

      if (!callStartTime) {
        console.warn(
          `[Job ${jobId}] Clinic: ${clinicName} - Row ${currentRowNumber}/${totalRows} (ID: ${callIdDisplay}): SKIPPED (invalid call_start_time).`
        );
        return null;
      }

      const vapiScoreRaw =
        row.vapi_score !== undefined ? row.vapi_score : row["FALSE"];
      const customerPhoneNumber =
        row.customer_phone || row.customer_phone_number || null;
      const feedback = row.feedback || row["Feedback QA"] || null;
      const engineerStatus =
        row.status_feedback_engineer || row["Status Feedback Engineer"] || null;
      const engineerComments =
        row.comments_engineer || row["Comments Engineer"] || null;

      const createData: Prisma.CallCreateInput = {
        sourceCallId: sourceCallId,
        clinic: { connect: { id: clinicId } },
        ...(agentId ? { agent: { connect: { id: agentId } } } : {}),
        endedReason: getStringOrNull(row.ended_reason),
        customerPhoneNumber: getStringOrNull(customerPhoneNumber),
        callStartTime: callStartTime,
        durationSeconds: parseFloatOrNull(row.duration),
        callEndedTime: parseDate(
          row.call_ended_time,
          "call_ended_time",
          sourceCallId
        ),
        callDate: parseDate(row.date, "date", sourceCallId),
        recordingUrl: getStringOrNull(row.recording_url),
        summary: getStringOrNull(row.summary),
        vapiScore: getStringOrNull(vapiScoreRaw),
        checkStatus: row.check ? String(row.check).toUpperCase() : null,
        evaluation: getStringOrNull(row.evaluation),
        feedback: getStringOrNull(feedback),
        sentiment: getStringOrNull(row.sentiment),
        protocolAdherence: parseIntOrNull(row.protocol_adherence),
        llmFeedback: getStringOrNull(row.llm_feedback),
        outcome: getStringOrNull(row.outcome),
        callTypeValue: getStringOrNull(row.call_type_value),
        callTypeConfidence: parseFloatOrNull(row.call_type_confidence),
        callTypeReasoning: getStringOrNull(row.call_type_reasoning),
        sentimentReasoning: getStringOrNull(row.sentiment_reasoning),
        sentimentConfidence: parseFloatOrNull(row.sentiment_confidence),
        protocolReasoning: getStringOrNull(row.protocol_reasoning),
        protocolConfidence: parseFloatOrNull(row.protocol_confidence),
        outcomeReasoning: getStringOrNull(row.outcome_reasoning),
        outcomeConfidence: parseFloatOrNull(row.outcome_confidence),
        engineerStatus: getStringOrNull(engineerStatus),
        engineerComments: getStringOrNull(engineerComments),
        type: getStringOrNull(row.type),
        customerName: getStringOrNull(row.customer_name),
        insurance: getStringOrNull(row.insurance),
        dateOfBirth: parseDate(row.dob, "date_of_birth", sourceCallId),
        callReason: getStringOrNull(row.call_reason),
        reviewerName: getStringOrNull(row.Reviewer),
        qaCheck: getStringOrNull(row["QA Check"]),
      };
      return createData;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during row prep";
      console.error(
        `[Job ${jobId}] Clinic: ${clinicName} - Row ${currentRowNumber}/${totalRows} (ID: ${callIdDisplay}): ERROR during preparation - ${errorMessage}.`
      );
      return null;
    }
  }
}
