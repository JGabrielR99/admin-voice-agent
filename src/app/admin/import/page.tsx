"use client";

import React from "react";
import { ExcelImporter } from "@/components/ExcelImporter";

export default function ImportPage() {
  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Administración de Datos</h1>

      <div className="mb-8">
        <ExcelImporter />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Instrucciones</h2>

        <div className="prose">
          <p>Para importar datos de llamadas desde un archivo Excel:</p>

          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Seleccione un archivo Excel con formato .xlsx o .xls</li>
            <li>Cada hoja del Excel debe representar una clínica diferente</li>
            <li>
              El nombre de cada hoja será usado como el nombre de la clínica
            </li>
            <li>
              Presione el botón &ldquo;Importar datos&rdquo; para comenzar la
              importación
            </li>
            <li>El proceso se ejecutará en segundo plano</li>
            <li>
              Puede cerrar esta ventana y volver más tarde para verificar el
              estado
            </li>
          </ol>

          <p className="text-amber-600">
            <strong>Importante:</strong> Solo se puede ejecutar una importación
            a la vez. Si hay una importación en progreso, debe esperar a que
            finalice.
          </p>
        </div>
      </div>
    </div>
  );
}
