import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { ExcelRowData } from "../../types/import-excel";
import { EXCEL_IMPORT, importProgressTracker } from "../../utils/constants";
import { CallService } from "@/services/db/call-service";
import { sendProgressUpdate } from "@/app/api/calls/import/stream/route";

// Create a dedicated prisma client for Excel processing
const prisma = new PrismaClient();
const callService = new CallService(prisma);

export class ExcelProcessor {
  /**
   * Process an Excel file buffer
   */
  static async processExcelFile(buffer: ArrayBuffer): Promise<void> {
    const progress = importProgressTracker.get();
    const jobId = progress.jobId;

    try {
      console.log(`[Job ${jobId}] Starting Excel processing`);
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

      const totalRows = this.countTotalRows(workbook);
      console.log(
        `[Job ${jobId}] Found ${totalRows} total rows across ${workbook.SheetNames.length} sheets.`
      );

      importProgressTracker.set({
        totalRows,
        status: totalRows === 0 ? "completed" : "processing",
      });
      sendProgressUpdate();

      if (totalRows === 0) {
        console.log(`[Job ${jobId}] No rows found in Excel file.`);
        this.finalizeImport("completed");
        return;
      }

      await this.processAllSheets(workbook);

      if (importProgressTracker.get().status === "processing") {
        console.log(`[Job ${jobId}] Processing completed successfully.`);
        this.finalizeImport("completed");
      }
    } catch (error) {
      console.error(`[Job ${jobId}] Error during Excel processing:`, error);
      this.finalizeImport(
        "error",
        error instanceof Error ? error.message : "Unknown processing error."
      );
    }
  }

  /**
   * Count the total number of rows in all sheets
   */
  private static countTotalRows(workbook: XLSX.WorkBook): number {
    let totalRows = 0;
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ExcelRowData>(worksheet, {
        raw: false,
        defval: null,
      });
      totalRows += data.length;
    });
    return totalRows;
  }

  /**
   * Process all sheets in the workbook
   */
  private static async processAllSheets(
    workbook: XLSX.WorkBook
  ): Promise<void> {
    for (const sheetName of workbook.SheetNames) {
      const progress = importProgressTracker.get();
      if (progress.status !== "processing") break;

      importProgressTracker.set({ currentSheet: sheetName });
      sendProgressUpdate();

      console.log(`[Job ${progress.jobId}] Processing Clinic: ${sheetName}`);

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ExcelRowData>(worksheet, {
        raw: false,
        defval: null,
      });

      if (!data || data.length === 0) {
        console.log(
          `[Job ${progress.jobId}] Clinic: ${sheetName} - No data, skipping.`
        );
        continue;
      }

      const clinic = await this.ensureClinicExists(sheetName);
      if (!clinic) {
        console.error(
          `[Job ${progress.jobId}] Failed to create/find clinic for ${sheetName}, skipping sheet.`
        );
        importProgressTracker.set({
          failedRows: progress.failedRows + data.length,
          processedRows: progress.processedRows + data.length,
        });
        sendProgressUpdate();
        continue;
      }

      await this.processSheetData(data, clinic.id, sheetName);
    }
  }

  /**
   * Ensure a clinic exists for the given sheet name
   */
  private static async ensureClinicExists(sheetName: string) {
    const defaultCompany = await prisma.company.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", name: "Default Company" },
    });

    try {
      return (
        (await prisma.clinic.findFirst({
          where: {
            name: sheetName,
            companyId: defaultCompany.id,
          },
        })) ||
        (await prisma.clinic.create({
          data: {
            name: sheetName,
            company: {
              connect: { id: defaultCompany.id },
            },
          },
        }))
      );
    } catch (e) {
      console.error(`Error creating clinic ${sheetName}:`, e);
      return null;
    }
  }

  /**
   * Process data from a single sheet
   */
  private static async processSheetData(
    data: ExcelRowData[],
    clinicId: string,
    clinicName: string
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < data.length; i += EXCEL_IMPORT.MAX_BATCH_SIZE) {
      batches.push(data.slice(i, i + EXCEL_IMPORT.MAX_BATCH_SIZE));
    }

    for (const [index, batch] of batches.entries()) {
      const progress = importProgressTracker.get();
      if (progress.status !== "processing") break;

      if (index > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, EXCEL_IMPORT.DELAY_BETWEEN_BATCHES)
        );
      }

      const batchResult = await callService.processBatch(
        batch,
        clinicId,
        progress.jobId,
        clinicName
      );

      importProgressTracker.set({
        successfulRows: progress.successfulRows + batchResult.successfulRows,
        failedRows: progress.failedRows + batchResult.failedRows,
        processedRows: progress.processedRows + batch.length,
      });
      sendProgressUpdate();
    }
  }

  /**
   * Finalize the import process
   */
  private static finalizeImport(
    status: "completed" | "error",
    errorMessage?: string
  ): void {
    importProgressTracker.set({
      status,
      error: errorMessage,
      endTime: new Date(),
      inProgress: false,
      currentSheet: undefined,
    });
    sendProgressUpdate();

    const progress = importProgressTracker.get();
    console.log(
      `[Job ${progress.jobId}] Final import status: ${progress.status}. ` +
        `Processed: ${progress.processedRows}/${progress.totalRows}. ` +
        `Success: ${progress.successfulRows}. Failed: ${progress.failedRows}.`
    );
  }
}
