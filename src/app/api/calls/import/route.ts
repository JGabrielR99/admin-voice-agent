import { NextRequest, NextResponse } from "next/server";
import { ExcelProcessor } from "../../../../services/excel/excel-processor";
import { importProgressTracker } from "../../../../utils/constants";
import { sendProgressUpdate } from "./stream/route";

/**
 * POST handler for Excel file imports
 */
export async function POST(request: NextRequest) {
  const currentProgress = importProgressTracker.get();

  if (currentProgress.inProgress) {
    return NextResponse.json(
      {
        error: "An import is already in progress.",
        inProgress: true,
        progress: currentProgress,
      },
      { status: 409 }
    );
  }

  try {
    // Parse form data and get the file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File must be an Excel document (.xlsx or .xls)." },
        { status: 400 }
      );
    }

    // Setup progress tracking
    importProgressTracker.reset();
    const jobId = importProgressTracker.generateJobId();
    importProgressTracker.set({
      inProgress: true,
      jobId,
      startTime: new Date(),
      status: "processing",
      fileName: file.name,
    });

    // Notificar a los clientes sobre el inicio de la importación
    sendProgressUpdate();

    // Read file as array buffer
    const buffer = await file.arrayBuffer();

    // Start processing in the background without awaiting
    ExcelProcessor.processExcelFile(buffer).catch((error) => {
      console.error("Background processing error:", error);
      importProgressTracker.set({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unknown background processing error",
        endTime: new Date(),
        inProgress: false,
      });
      sendProgressUpdate();
    });

    // Immediately return response that processing has started
    return NextResponse.json({
      success: true,
      jobId,
      message: "Excel import started in background.",
      progress: importProgressTracker.get(),
    });
  } catch (error) {
    console.error("Critical error in POST /api/calls/import:", error);
    importProgressTracker.set({
      status: "error",
      error:
        error instanceof Error ? error.message : "Unknown POST handler error.",
      endTime: new Date(),
      inProgress: false,
    });
    sendProgressUpdate();

    return NextResponse.json(
      {
        error:
          "Critical error during file processing: " +
          (error instanceof Error ? error.message : "Unknown error"),
        progress: importProgressTracker.get(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to check the status of an import
 */
export async function GET() {
  return NextResponse.json(importProgressTracker.get());
}
