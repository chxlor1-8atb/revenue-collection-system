import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { collectors, qrCodes } from '../src/lib/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seedQr() {
  console.log('Seeding initial collector and QR Code...');
  
  try {
    const newCollector = await db.insert(collectors).values({
      name: 'เทศบาลเมืองนางรอง (ทดสอบ)',
      promptPayId: '0994000160759', // This is a standard test Biller ID / PromptPay format, or just a phone number
      telegramChatId: '123456789'
    }).returning({ id: collectors.id });

    await db.insert(qrCodes).values({
      collectorId: newCollector[0].id,
      label: 'QR Code สำหรับทดสอบระบบ'
    });

    console.log('Test QR Code seeded successfully!');
  } catch (error) {
    console.error('Failed to seed QR code:', error);
  } finally {
    process.exit(0);
  }
}

seedQr();
