export { pusherServer } from './pusher-server';

// Client-side Pusher (Only instantiate on browser)
export const getPusherClient = async () => {
  if (typeof window === 'undefined') return null;
  
  const isPusherConfigured = process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!isPusherConfigured) return null;
  
  const PusherClient = (await import('pusher-js')).default;
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
};
