import { NextRequest, NextResponse } from "next/server";
import { ExcelProcessor } from "@/services/excel/excel-processor";
import { importProgressTracker } from "@/utils/constants";
import { sendProgressUpdate } from "@/utils/progressStream";
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File must be an Excel document (.xlsx or .xls)." },
        { status: 400 }
      );
    }
    importProgressTracker.reset();
    const jobId = importProgressTracker.generateJobId();
    importProgressTracker.set({
      inProgress: true,
      jobId,
      startTime: new Date(),
      status: "processing",
      fileName: file.name,
    });
    sendProgressUpdate();
    const buffer = await file.arrayBuffer();
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
export async function GET() {
  return NextResponse.json(importProgressTracker.get());
}
