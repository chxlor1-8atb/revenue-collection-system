import { messagingApi } from '@line/bot-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import sharp from 'sharp';
dotenv.config({ path: '.env.local' });

const client = new messagingApi.MessagingApiClient({ channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN as string });
const blobClient = new messagingApi.MessagingApiBlobClient({ channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN as string });

async function run() {
  try {
    const menus = await client.getRichMenuList();
    console.log('Current Menus:', menus.richmenus.length);
    for (const m of menus.richmenus) {
      console.log('Deleting:', m.richMenuId);
      await client.deleteRichMenu(m.richMenuId);
    }
    
    console.log('Creating new Numbered Rich Menu with Keyboard at 04...');
    const richMenu = {
      size: { width: 2500, height: 1686 },
      selected: true,
      name: 'Main Menu',
      chatBarText: 'เมนูหลัก',
      areas: [
        { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'เช็คบิล' } },
        { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: 'message', text: 'ใบเสร็จ' } },
        { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'ข้อมูลของฉัน' } },
        { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'message', text: 'พิมพ์ข้อความ' } },
        { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: 'message', text: 'วิธีใช้งาน' } },
        { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: 'message', text: 'ติดต่อเจ้าหน้าที่' } },
      ],
    };
    const createResponse = await client.createRichMenu(richMenu as any);
    const richMenuId = createResponse.richMenuId;
    console.log('Created ID:', richMenuId);
    
    console.log('Downloading image from Localhost...');
    const res = await fetch('http://localhost:3000/api/rich-menu-image');
    const arrayBuffer = await res.arrayBuffer();
    const pngBuffer = Buffer.from(arrayBuffer);
    const jpegBuffer = await sharp(pngBuffer).jpeg({ quality: 85 }).toBuffer();
    console.log('Size after compression:', (jpegBuffer.length / 1024).toFixed(1), 'KB');
    const imageBlob = new Blob([jpegBuffer], { type: 'image/jpeg' });
    
    console.log('Uploading image to LINE...');
    await blobClient.setRichMenuImage(richMenuId, imageBlob);
    
    console.log('Setting as default...');
    await client.setDefaultRichMenu(richMenuId);
    console.log('Done!');
  } catch (e) {
    console.error(e);
  }
}
run();
