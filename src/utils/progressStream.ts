import { importProgressTracker } from "./constants";

// Almacenar los clientes conectados
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

// Función para enviar actualizaciones de progreso a los clientes
export function sendProgressUpdate() {
  const progress = importProgressTracker.get();
  const data = `data: ${JSON.stringify(progress)}\n\n`;

  clients.forEach((client) => {
    try {
      client.enqueue(new TextEncoder().encode(data));
    } catch (e) {
      console.error("Error sending to client:", e);
    }
  });
}

// Exportar el conjunto de clientes para usarlo en el endpoint SSE
export { clients };
