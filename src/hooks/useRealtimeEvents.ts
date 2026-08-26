"use client";

import { useEffect, useRef } from "react";
import { RealtimeEventName, RealtimeEventPayloads } from "@/lib/eventHub";

export type EventListeners = {
  [K in RealtimeEventName]?: (payload: RealtimeEventPayloads[K]) => void;
};

export function useRealtimeEvents(listeners: EventListeners, enabled: boolean = true) {
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/events/stream");

        eventSource.onopen = () => {
          // Connected successfully
        };

        const eventNames: RealtimeEventName[] = [
          "qr:created",
          "slip:uploaded",
          "transaction:verified",
          "transaction:rejected",
        ];

        eventNames.forEach((eventName) => {
          eventSource?.addEventListener(eventName, (e: MessageEvent) => {
            try {
              const data = JSON.parse(e.data);
              const listener = listenersRef.current[eventName];
              if (listener) {
                listener(data);
              }
            } catch (err) {
              console.error(`[SSE] Error parsing '${eventName}' data:`, err);
            }
          });
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff reconnect
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              if (document.visibilityState === "visible") {
                connect();
              }
            }, 5000);
          }
        };
      } catch (err) {
        console.error("[SSE] Connection error:", err);
      }
    };

    connect();

    // Reconnect when tab becomes visible if connection dropped
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [enabled]);
}
