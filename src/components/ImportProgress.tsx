import React from "react";
import { useImportProgress } from "@/hooks/useImportProgress";
export function ImportProgress() {
  const { progress, isLoading, error } = useImportProgress();
  if (isLoading && !progress.inProgress) {
    return (
      <div className="text-gray-500">Verificando estado de importación...</div>
    );
  }
  if (error) {
    return (
      <div className="text-red-500">Error al verificar el estado: {error}</div>
    );
  }
  if (!progress.inProgress) {
    return null;
  }
  const percentage =
    progress.totalRows && progress.processedRows
      ? Math.round((progress.processedRows / progress.totalRows) * 100)
      : null;
  return (
    <div className="border rounded-lg p-4 bg-white shadow mb-4">
      <h3 className="font-medium text-lg mb-2">Importación en progreso</h3>
      <div className="mb-2">
        <span className="font-medium">Archivo:</span> {progress.fileName}
      </div>
      <div className="mb-2">
        <span className="font-medium">Estado:</span>{" "}
        {progress.status === "processing" && "Procesando"}
        {progress.status === "completed" && "Completado"}
        {progress.status === "error" && "Error"}
      </div>
      {progress.currentSheet && (
        <div className="mb-2">
          <span className="font-medium">Procesando clínica:</span>{" "}
          {progress.currentSheet}
        </div>
      )}
      {percentage !== null && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {progress.processedRows} de {progress.totalRows} filas ({percentage}
            %)
          </div>
        </div>
      )}
      {(progress.successfulRows !== undefined ||
        progress.failedRows !== undefined) && (
        <div className="flex space-x-4 text-sm mt-2">
          {progress.successfulRows !== undefined && (
            <div className="text-green-600">
              <span className="font-medium">Exitosos:</span>{" "}
              {progress.successfulRows}
            </div>
          )}
          {progress.failedRows !== undefined && (
            <div className="text-red-600">
              <span className="font-medium">Fallidos:</span>{" "}
              {progress.failedRows}
            </div>
          )}
        </div>
      )}
      {progress.status === "completed" && (
        <div className="text-green-600 font-medium mt-2">
          Importación completada exitosamente
        </div>
      )}
      {progress.status === "error" && progress.error && (
        <div className="text-red-600 mt-2">Error: {progress.error}</div>
      )}
      {progress.startTime && (
        <div className="text-xs text-gray-500 mt-2">
          Iniciado: {new Date(progress.startTime).toLocaleString()}
          {progress.endTime && (
            <>
              {" · "}
              Finalizado: {new Date(progress.endTime).toLocaleString()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
