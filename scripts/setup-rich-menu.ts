import { messagingApi } from "@line/bot-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!token) {
  console.error("❌ Error: LINE_CHANNEL_ACCESS_TOKEN is missing in .env");
  process.exit(1);
}

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: token as string,
});

async function main() {
  try {
    console.log("1. Creating Rich Menu Object...");
    const richMenu = {
      size: {
        width: 2500,
        height: 1686,
      },
      selected: true,
      name: "Main Menu",
      chatBarText: "เมนูหลัก",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1250, height: 843 },
          action: { type: "message", text: "เช็คบิล" },
        },
        {
          bounds: { x: 1250, y: 0, width: 1250, height: 843 },
          action: { type: "message", text: "ใบเสร็จ" },
        },
        {
          bounds: { x: 0, y: 843, width: 1250, height: 843 },
          action: { type: "message", text: "วิธีใช้งาน" },
        },
        {
          bounds: { x: 1250, y: 843, width: 1250, height: 843 },
          action: { type: "message", text: "แจ้งปัญหา" },
        },
      ],
    };

    const createResponse = await client.createRichMenu(richMenu as any);
    const richMenuId = createResponse.richMenuId;
    console.log("✅ Rich Menu Created! ID:", richMenuId);

    console.log("2. Downloading Placeholder Image...");
    const imageUrl = "http://localhost:3000/api/rich-menu-image";
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save temporarily
    const tempPath = path.join(process.cwd(), "temp-rich-menu.jpg");
    fs.writeFileSync(tempPath, buffer);

    console.log("3. Uploading Image to LINE...");
    const blobClient = new messagingApi.MessagingApiBlobClient({
      channelAccessToken: token as string,
    });
    
    // Convert buffer to a Blob-like object for the new SDK
    const imageBlob = new Blob([buffer], { type: "image/jpeg" });
    
    await blobClient.setRichMenuImage(richMenuId, imageBlob);
    console.log("✅ Image Uploaded!");

    console.log("4. Setting as Default Rich Menu...");
    await client.setDefaultRichMenu(richMenuId);
    console.log("✅ Set as Default successfully!");

    // Cleanup
    fs.unlinkSync(tempPath);
    
    console.log("🎉 All Done! The rich menu is now active on your LINE OA.");
  } catch (error: any) {
    console.error("❌ Failed:", error.originalError?.response?.data || error.message || error);
  }
}

main();
