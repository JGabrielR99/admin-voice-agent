import { importProgressTracker } from "../../../../../utils/constants";

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

// Endpoint SSE
export async function GET() {
  const encoder = new TextEncoder();

  const cleanupMap = new WeakMap();

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      const initialData = `data: ${JSON.stringify(
        importProgressTracker.get()
      )}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      const cleanup = () => {
        clients.delete(controller);
      };

      cleanupMap.set(controller, cleanup);
    },
    cancel() {
      const cleanup = cleanupMap.get(this);
      if (cleanup) {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
