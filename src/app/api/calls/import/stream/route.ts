import { importProgressTracker } from "../../../../../utils/constants";
import { clients } from "../../../../../utils/progressStream";
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
