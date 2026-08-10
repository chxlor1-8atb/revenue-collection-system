import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function testSlip2Go() {
  try {
    const apiKey = process.env.SLIP2GO_API_KEY;
    if (!apiKey) {
      console.log("No API key");
      return;
    }
    
    // We need a sample image to convert to base64. 
    // Wait, let's just make a tiny invalid jpeg or png.
    const fakeImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    console.log("Testing WITHOUT data URI prefix...");
    let res = await fetch("https://connect.slip2go.com/api/verify-slip/qr-base64/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-secret": apiKey,
      },
      body: JSON.stringify({
        payload: {
          imageBase64: fakeImageBuffer.toString('base64')
        }
      }),
    });
    console.log("Without prefix:", await res.text());

    console.log("Testing WITH data URI prefix...");
    let res2 = await fetch("https://connect.slip2go.com/api/verify-slip/qr-base64/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-api-secret": apiKey,
      },
      body: JSON.stringify({
        payload: {
          imageBase64: `data:image/jpeg;base64,${fakeImageBuffer.toString('base64')}`
        }
      }),
    });
    console.log("With prefix:", await res2.text());

  } catch (error) {
    console.error("Error:", error);
  }
}

testSlip2Go();
