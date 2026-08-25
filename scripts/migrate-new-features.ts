import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  console.log("Starting database migration for 6 core backend modules...");

  try {
    // 1. Create audit_logs table
    console.log("Creating audit_logs table...");
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_name TEXT NOT NULL,
        user_role TEXT DEFAULT 'staff',
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs (action);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);`;
    console.log("audit_logs created.");

    // 2. Create fee_categories table
    console.log("Creating fee_categories table...");
    await sql`
      CREATE TABLE IF NOT EXISTS fee_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        default_amount NUMERIC(12, 2) NOT NULL DEFAULT 20.00,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Seed default fee categories if empty
    console.log("Seeding default fee categories...");
    await sql`
      INSERT INTO fee_categories (name, code, default_amount, description)
      VALUES 
        ('บ้านพักอาศัยทั่วไป', 'residential', 20.00, 'บ้านพักอาศัยและอาคารชุดทั่วไปในเขตเทศบาล'),
        ('ร้านค้า / พาณิชยกรรมขนาดเล็ก', 'small_shop', 40.00, 'ร้านค้า โชห่วย ร้านขายของชำทั่วไป'),
        ('ร้านอาหาร / สถานประกอบการขนาดกลาง', 'restaurant', 100.00, 'ร้านอาหาร ร้านกาแฟ คลินิก สำนักงาน'),
        ('ตลาดสด / โรงแรม / สถานประกอบการขนาดใหญ่', 'commercial_large', 200.00, 'ตลาดสด โรงแรม ห้างร้าน อู่ซ่อมรถ โรงงาน')
      ON CONFLICT (code) DO NOTHING;
    `;
    console.log("fee_categories created and seeded.");

    // 3. Alter houses table to add fee_category_id
    console.log("Updating houses table columns...");
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'fee_category_id') THEN
          ALTER TABLE houses ADD COLUMN fee_category_id INTEGER REFERENCES fee_categories(id);
        END IF;
      END $$;
    `;
    console.log("houses table updated.");

    // 4. Alter transactions table to add official receipt series columns
    console.log("Updating transactions table columns...");
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'book_number') THEN
          ALTER TABLE transactions ADD COLUMN book_number INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receipt_number') THEN
          ALTER TABLE transactions ADD COLUMN receipt_number INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fiscal_year') THEN
          ALTER TABLE transactions ADD COLUMN fiscal_year TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receipt_code') THEN
          ALTER TABLE transactions ADD COLUMN receipt_code TEXT;
        END IF;
      END $$;
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_receipt_code ON transactions (receipt_code);`;
    console.log("transactions table updated.");

    // 5. Alter system_settings to add receiptBookConfig and lineConfig
    console.log("Updating system_settings table columns...");
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'receipt_book_config') THEN
          ALTER TABLE system_settings ADD COLUMN receipt_book_config JSONB DEFAULT '{"itemsPerBook": 50, "currentBook": 1, "fiscalYear": "2569"}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'line_config') THEN
          ALTER TABLE system_settings ADD COLUMN line_config JSONB DEFAULT '{"emergencyPhone": "044-631405", "healthDeptPhone": "044-631405", "announcementText": "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา", "isAnnouncementActive": true}';
        END IF;
      END $$;
    `;
    console.log("system_settings table updated.");

    console.log("All migrations executed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
