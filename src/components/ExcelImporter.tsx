import React, { useState, useRef } from "react";
import { ImportProgress } from "./ImportProgress";
import { useImportProgress } from "@/hooks/useImportProgress";
export function ExcelImporter() {
  const { progress } = useImportProgress();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setUploadError("Por favor seleccione un archivo Excel (.xlsx o .xls)");
      return;
    }
    const file = fileInputRef.current.files[0];
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadError("El archivo debe ser un documento Excel (.xlsx o .xls)");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/calls/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setUploadError("Ya hay una importación en progreso");
        } else {
          setUploadError(data.error || "Error al importar el archivo");
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError("Error al conectar con el servidor");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Importar datos desde Excel</h3>
      {}
      <ImportProgress />
      {}
      {!progress.inProgress && (
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo Excel
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Formatos aceptados: .xlsx, .xls
            </p>
          </div>
          {uploadError && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600">
              {uploadError}
            </div>
          )}
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium 
              ${isUploading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isUploading ? "Subiendo..." : "Importar datos"}
          </button>
        </form>
      )}
    </div>
  );
}
