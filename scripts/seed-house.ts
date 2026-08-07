import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { houses, invoices } from '../src/lib/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seedHouse() {
  console.log('Seeding initial house and invoices...');
  
  try {
    const newHouse = await db.insert(houses).values({
      houseNumber: '123/4',
      ownerName: 'สมชาย ใจดี',
      zone: 'หมู่ 5'
    }).returning({ id: houses.id });

    const houseId = newHouse[0].id;

    await db.insert(invoices).values([
      { houseId, monthYear: '2024-01', amount: '20.00', status: 'unpaid' },
      { houseId, monthYear: '2024-02', amount: '20.00', status: 'unpaid' },
      { houseId, monthYear: '2024-03', amount: '20.00', status: 'paid' },
    ]);

    console.log('Test House and Invoices seeded successfully!');
  } catch (error) {
    console.error('Failed to seed house:', error);
  } finally {
    process.exit(0);
  }
}

seedHouse();
