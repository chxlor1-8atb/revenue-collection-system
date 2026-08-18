import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

const payload = JSON.stringify({
  destination: "xxxxxxxxxx",
  events: [
    {
      type: "message",
      message: {
        type: "text",
        id: "1234567890",
        text: "เช็คบิล"
      },
      timestamp: 1625665242211,
      source: {
        type: "user",
        userId: "U1234567890"
      },
      replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
      mode: "active"
    }
  ]
});

const signature = crypto.createHmac('sha256', channelSecret).update(payload).digest('base64');

async function test() {
  const res = await fetch('http://localhost:3000/api/webhook/line', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-line-signature': signature
    },
    body: payload
  });
  const data = await res.json().catch(() => res.statusText);
  console.log('Status:', res.status);
  console.log('Response:', data);
}

test();
