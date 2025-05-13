"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud, AlertCircle } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ImportProgress {
  inProgress: boolean;
  jobId: string | null;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  startTime: string | null;
  endTime: string | null;
  status: "idle" | "processing" | "completed" | "error";
  error?: string;
  fileName?: string;
  currentSheet?: string;
}

export function ImportExportDashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );

  // Use SSE for real-time updates
  useEffect(() => {
    // First load the initial state
    const fetchInitialState = async () => {
      try {
        const response = await fetch("/api/calls/import");
        if (!response.ok) {
          throw new Error("Failed to fetch initial status");
        }

        const initialData = await response.json();
        setImportProgress(initialData);
      } catch (error) {
        console.error("Error fetching initial import state:", error);
      }
    };

    fetchInitialState();

    // Set up EventSource for real-time updates
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/calls/import/stream");

      eventSource.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          setImportProgress(progress);

          // Update the state based on progress
          if (progress.status === "completed") {
            setUploadStatus("success");
            setSuccessMessage(
              `Import completed: ${
                progress.successfulRows
              } records successfully imported${
                progress.failedRows > 0
                  ? `, ${progress.failedRows} with errors`
                  : ""
              }`
            );
          } else if (progress.status === "error") {
            setUploadStatus("error");
            setErrorMessage(progress.error || "Error during import");
          } else if (!progress.inProgress && uploadStatus === "uploading") {
            // Handle case where backend reset but we still think we're uploading
            setUploadStatus("idle");
          }
        } catch (e) {
          console.error("Error processing SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        console.error("SSE error");
        // Try to reconnect after an error
        if (eventSource) {
          eventSource.close();

          // Try to reconnect after 3 seconds
          setTimeout(() => {
            try {
              eventSource = new EventSource("/api/calls/import/stream");
            } catch (err) {
              console.error("Error reconnecting to SSE:", err);
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.error("Error setting up SSE:", err);
    }

    // Clean up when component unmounts
    return () => {
      if (eventSource && eventSource.readyState !== 2) {
        eventSource.close();
      }
    };
  }, [uploadStatus]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Don't allow new uploads if one is in progress
      if (importProgress?.inProgress) {
        setErrorMessage(
          "An import is already in progress. Please wait for it to complete."
        );
        return;
      }

      if (!acceptedFiles.length) return;

      // Filter only Excel files
      const excelFiles = acceptedFiles.filter(
        (file) =>
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
      );

      if (!excelFiles.length) {
        setErrorMessage("Please upload Excel files (.xlsx or .xls)");
        return;
      }

      setFiles(excelFiles);
      setUploadStatus("uploading");
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        // Create FormData to send files
        const formData = new FormData();
        excelFiles.forEach((file) => {
          formData.append("file", file);
        });

        // Send to backend API endpoint
        const response = await fetch("/api/calls/import", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle case where an import is already in progress
          if (response.status === 409 && errorData.inProgress) {
            setImportProgress(errorData.progress);
            throw new Error(
              "An import is already in progress. Please wait for it to complete."
            );
          }

          throw new Error(errorData.error || "Error processing the file");
        }

        // Just show the message that the process has started
        // we don't need to store the jobId because we use SSE
        await response.json();
      } catch (error) {
        setUploadStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown import error"
        );
      }
    },
    [importProgress?.inProgress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploadStatus === "uploading",
  });

  // Calculate progress percentage
  const progressPercentage = importProgress?.totalRows
    ? Math.round(
        (importProgress.processedRows / importProgress.totalRows) * 100
      )
    : 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6" style={{ color: "#333333" }}>
        Import
      </h2>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4" style={{ color: "#333333" }}>
          Import Data
        </h3>

        {importProgress?.inProgress ? (
          <div className="mb-6 border border-teal-200 rounded-lg p-6 bg-teal-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-teal-800">
                Importing file: {importProgress.fileName}
              </h4>
              <span className="text-teal-800 font-medium">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-teal-200 rounded-full h-2.5">
              <div
                className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-teal-700">
              <span>
                Processed: {importProgress.processedRows} of{" "}
                {importProgress.totalRows}
              </span>
              <span>
                Success: {importProgress.successfulRows} | Errors:{" "}
                {importProgress.failedRows}
              </span>
            </div>
            {importProgress.currentSheet && (
              <div className="mt-1 text-sm text-teal-700">
                <span>Processing clinic: {importProgress.currentSheet}</span>
              </div>
            )}

            <div className="mt-4 p-3 bg-amber-50 border-amber-200 border rounded-md text-amber-700">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>
                  An import is in progress. You can continue browsing without
                  interrupting the import process.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-teal-400 bg-teal-50" : "border-gray-300"}
              ${uploadStatus === "error" ? "border-red-300 bg-red-50" : ""}
              ${
                uploadStatus === "success" ? "border-green-300 bg-green-50" : ""
              }
              ${
                uploadStatus === "uploading"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            style={{
              borderColor: isDragActive ? "#8dd8cd" : "#bcebdf",
              backgroundColor: isDragActive ? "#e8f8f6" : "#f8fafa",
            }}
          >
            <input
              {...getInputProps()}
              disabled={uploadStatus === "uploading"}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="h-12 w-12 text-teal-500 animate-spin" />
                  <p className="text-gray-600">Processing file...</p>
                </>
              ) : (
                <>
                  <UploadCloud
                    className="h-12 w-12"
                    style={{ color: isDragActive ? "#8dd8cd" : "#ade0db" }}
                  />
                  <p style={{ color: "#333333" }}>
                    {isDragActive
                      ? "Drop your file here..."
                      : "Drag and drop an Excel file, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Excel files only (.xlsx, .xls)
                  </p>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
                {successMessage}
              </div>
            )}

            {files.length > 0 && uploadStatus !== "uploading" && (
              <div className="mt-4">
                <p className="font-medium" style={{ color: "#333333" }}>
                  Selected file:
                </p>
                <ul className="mt-2 text-sm">
                  {files.map((file) => (
                    <li key={file.name} className="flex items-center space-x-2">
                      <span>{file.name}</span>
                      <span className="text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          The import process will run in the background. You can continue
          browsing while data is being processed.
        </p>
      </div>
    </div>
  );
}
