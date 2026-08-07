import { db } from '../src/lib/db';
import { adminUsers } from '../src/lib/schema';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('Seeding initial admin user...');
  const defaultPassword = 'adminpassword123'; // The user should change this in production!
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  
  try {
    await db.insert(adminUsers).values({
      username: 'admin',
      passwordHash,
      role: 'admin',
    });
    console.log('Admin user seeded successfully. Username: admin, Password:', defaultPassword);
  } catch (err) {
    console.error('Failed to seed admin user (perhaps it already exists?):', err);
  }
}

seed().catch(console.error);
