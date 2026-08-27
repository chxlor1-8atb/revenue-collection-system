import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

const isPusherConfigured = 
  process.env.PUSHER_APP_ID && 
  process.env.NEXT_PUBLIC_PUSHER_KEY && 
  process.env.PUSHER_SECRET && 
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Server-side Pusher
export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

// Client-side Pusher (Only instantiate on browser)
export const getPusherClient = () => {
  if (typeof window === 'undefined' || !isPusherConfigured) return null;
  
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
};
