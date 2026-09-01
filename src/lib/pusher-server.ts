import PusherServer from 'pusher';

const isPusherConfigured = 
  process.env.PUSHER_APP_ID && 
  process.env.NEXT_PUBLIC_PUSHER_KEY && 
  process.env.PUSHER_SECRET && 
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;
