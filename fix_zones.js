const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/houses/HousesClient.tsx', 'utf8');

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

if (!code.includes('OFFICIAL_ZONES')) {
  code = code.replace('const ALL_ZONES = useMemo(() => [', officialZonesObj + '\n  const ALL_ZONES = useMemo(() => [');

  code = code.replace(/\.\.\.ALL_ZONES\.map\(z => \(\{ value: z, label: \`ชุมชน\$\{z\}\` \}\)\)/g, 
    '...ALL_ZONES.map(z => ({ value: z, label: OFFICIAL_ZONES[z] || `ชุมชน${z}` }))');

  code = code.replace(/<span>ชุมชน\{selectedZone\}<\/span>/g, 
    '<span>{OFFICIAL_ZONES[selectedZone] || `ชุมชน${selectedZone}`}</span>');

  code = code.replace(/house\.zone && \`ชุมชน\$\{house\.zone\}\`/g, 
    'house.zone && (OFFICIAL_ZONES[house.zone] || `ชุมชน${house.zone}`)');

  code = code.replace(/icon={<Building2 size=\{15\} className="text-slate-500" \/>}/g, 
    'icon={<MapPin size={15} className="text-slate-500" />}');

  fs.writeFileSync('src/app/dashboard/houses/HousesClient.tsx', code, 'utf8');
  console.log('Modified HousesClient.tsx');
} else {
  console.log('Already modified HousesClient.tsx');
}
