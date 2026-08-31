import { Client } from "@upstash/qstash";
import { pushMessage } from "./line";

// Initialize QStash client if token is available
const isQStashConfigured = process.env.QSTASH_TOKEN;
const qstashClient = isQStashConfigured ? new Client({ token: process.env.QSTASH_TOKEN! }) : null;

/**
 * Enqueue a LINE message.
 * If QStash is configured, it sends to the queue for background processing.
 * If not, it falls back to direct synchronous execution.
 */
export async function enqueueLineMessage(userId: string, messages: any[]) {
  if (qstashClient && process.env.NEXT_PUBLIC_APP_URL) {
    // We send a POST request to our own webhook handler to process it in the background
    try {
      await qstashClient.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/queue-worker`,
        body: { userId, messages },
      });
      return { success: true, queued: true };
    } catch (error) {
      console.warn("Failed to enqueue message, falling back to sync execution:", error);
    }
  }

  // Fallback: Synchronous execution
  try {
    await pushMessage(userId, messages);
    return { success: true, queued: false };
  } catch (error) {
    console.error("Failed to send LINE message synchronously:", error);
    return { success: false, error };
  }
}
