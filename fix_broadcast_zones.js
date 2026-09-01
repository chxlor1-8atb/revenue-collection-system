const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/broadcast/BroadcastClient.tsx', 'utf8');

const officialZonesObj = `
const OFFICIAL_ZONES: Record<string, string> = {
  "หนองรี": "ชุมชนหนองรี",
  "หนองกราด": "ชุมชนบ้านหนองกราด",
  "หนองเสม็ด": "ชุมชนบ้านหนองเสม็ด",
  "บ้านเก่า": "ชุมชนบ้านเก่า",
  "วัดขุนก้อง": "ชุมชนวัดขุนก้อง",
  "วัดกลาง": "ชุมชนวัดกลาง",
  "ป่าเรไร": "ชุมชนวัดป่าเรไร",
  "วัดร่องมันเทศ": "ชุมชนวัดร่องมันเทศ",
  "บ้านถนนหัก": "ชุมชนบ้านถนนหัก",
  "วัดถนนหัก": "ชุมชนวัดถนนหัก",
  "ถนนหักพัฒนา": "ชุมชนถนนหักพัฒนา",
  "ทุ่งแหลม": "ชุมชนทุ่งแหลม",
  "หนองโพรง": "ชุมชนหนองโพรง",
  "วัดใหม่เรไรทอง": "ชุมชนวัดใหม่เรไรทอง",
  "จะบวก": "ชุมชนบ้านจะบวก",
  "หัวสะพาน": "ชุมชนวัดหัวสะพาน",
  "ป่าตาเส็ง": "ชุมชนป่าตาเส็ง",
  "ป่ารักน้ำ": "ชุมชนวัดสวนป่ารักน้ำ",
  "ดอนแสลงพันธ์": "ชุมชนบ้านดอนแสลงพันธ์",
  "โคกหลวงพ่อ": "ชุมชนโคกหลวงพ่อ"
};
`;

if (!code.includes('const OFFICIAL_ZONES')) {
  code = code.replace('export default function BroadcastClient({', officialZonesObj + '\nexport default function BroadcastClient({');
  fs.writeFileSync('src/app/dashboard/broadcast/BroadcastClient.tsx', code, 'utf8');
  console.log('Fixed BroadcastClient.tsx');
}
