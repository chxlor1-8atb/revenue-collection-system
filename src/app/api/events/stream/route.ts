import { NextRequest } from "next/server";
import eventHub, { RealtimeEventName } from "@/lib/eventHub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Helper to send SSE message
      const sendEvent = (event: string, data: any) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream might be closed
        }
      };

      // Initial connection established packet
      sendEvent("connected", {
        status: "ok",
        timestamp: new Date().toISOString(),
      });

      // Event listeners map to unsubscribe on close
      const unsubscribeFns: Array<() => void> = [];

      const events: RealtimeEventName[] = [
        "qr:created",
        "slip:uploaded",
        "transaction:verified",
        "transaction:rejected",
      ];

      events.forEach((eventName) => {
        const handler = (payload: any) => {
          sendEvent(eventName, payload);
        };
        eventHub.on(eventName, handler);
        unsubscribeFns.push(() => {
          eventHub.off(eventName, handler);
        });
      });

      // Heartbeat ping every 15s to keep connection alive through proxies
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        unsubscribeFns.forEach((unsub) => unsub());
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
    cancel() {
      // Stream cancelled by consumer
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disables Nginx buffering
    },
  });
}
