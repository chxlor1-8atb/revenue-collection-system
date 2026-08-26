import { EventEmitter } from "events";

export interface RealtimeEventPayloads {
  "qr:created": {
    transactionId: number;
    houseNumber?: string;
    ownerName?: string;
    amount: string;
    createdAt: string;
  };
  "slip:uploaded": {
    transactionId?: number;
    lineMessageId?: number;
    houseNumber?: string;
    amount?: string;
    source: "line" | "web";
    createdAt: string;
  };
  "transaction:verified": {
    transactionId: number;
    receiptCode?: string | null;
    houseNumber?: string;
    amount?: string | null;
    verifiedAt: string;
  };
  "transaction:rejected": {
    transactionId: number;
    reason?: string;
    rejectedAt: string;
  };
}

export type RealtimeEventName = keyof RealtimeEventPayloads;

// Declare global singleton event hub for Next.js hot-reloads / edge-node runtime
declare global {
  // eslint-disable-next-line no-var
  var __appEventHub: EventEmitter | undefined;
}

const eventHub: EventEmitter = global.__appEventHub || new EventEmitter();
eventHub.setMaxListeners(200); // Allow many concurrent SSE connections

if (process.env.NODE_ENV !== "production") {
  global.__appEventHub = eventHub;
}

export function broadcastEvent<K extends RealtimeEventName>(
  eventName: K,
  payload: RealtimeEventPayloads[K]
) {
  try {
    eventHub.emit(eventName, payload);
  } catch (error) {
    console.error(`[EventHub] Failed to broadcast event '${eventName}':`, error);
  }
}

export function subscribeEvent<K extends RealtimeEventName>(
  eventName: K,
  listener: (payload: RealtimeEventPayloads[K]) => void
) {
  eventHub.on(eventName, listener);
  return () => {
    eventHub.off(eventName, listener);
  };
}

export default eventHub;
