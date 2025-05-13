import { importProgressTracker } from "./constants";
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
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
export { clients };
