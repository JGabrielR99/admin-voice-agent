import { useState, useEffect } from "react";
export interface ImportProgress {
  inProgress: boolean;
  jobId?: string;
  startTime?: Date;
  endTime?: Date;
  status: "idle" | "processing" | "completed" | "error";
  fileName?: string;
  error?: string;
  totalRows?: number;
  processedRows?: number;
  successfulRows?: number;
  failedRows?: number;
  currentSheet?: string;
}
export function useImportProgress() {
  const [progress, setProgress] = useState<ImportProgress>({
    inProgress: false,
    status: "idle",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/calls/import");
        if (!response.ok) {
          throw new Error("Failed to fetch import status");
        }
        const data = await response.json();
        setProgress(data);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };
    loadInitialState();
    let eventSource: EventSource;
    try {
      eventSource = new EventSource("/api/calls/import/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(data);
          setIsLoading(false);
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      };
      eventSource.onerror = (e) => {
        console.error("SSE error:", e);
        setError("Error en la conexión de eventos en tiempo real");
        eventSource.close();
      };
    } catch (err) {
      setError("No se pudo establecer la conexión de eventos en tiempo real");
      console.error("Error creating EventSource:", err);
    }
    return () => {
      if (eventSource && eventSource.readyState !== 2) {
        eventSource.close();
      }
    };
  }, []);
  return { progress, isLoading, error };
}
