import { db } from './src/lib/db';
import { systemSettings } from './src/lib/schema';

const communities = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", 
  "วัดกลาง", "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", 
  "ถนนหักพัฒนา", "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", 
  "หัวสะพาน", "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"
];

async function run() {
  const settings = await db.select().from(systemSettings).limit(1);
  if (settings.length > 0) {
    let schema = settings[0].houseCustomFieldsSchema || [];
    let updated = false;
    for (let field of schema) {
      if (field.id === 'zone') {
        field.type = 'select';
        field.options = communities;
        updated = true;
      }
    }
    
    // If zone isn't found, we'll just insert it
    if (!updated) {
      schema.push({
        id: "zone", name: "ชุมชน / หมู่ (ตัวเลือก)", placeholder: "เช่น หมู่ 1 ซอย 5", 
        type: "select", options: communities, required: false, isSystem: true, isHidden: false
      });
    }

    await db.update(systemSettings).set({ houseCustomFieldsSchema: schema });
    console.log("Updated DB schema successfully");
  } else {
    console.log("No settings found in DB to update.");
  }
  process.exit(0);
}

run().catch(console.error);
