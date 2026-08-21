import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Rich Vector Illustrations for each card
const cardIllustrations = {
  // 1. Bill Payment
  bill: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#ECFDF5" />
      <circle cx="110" cy="110" r="80" fill="#D1FAE5" />
      
      {/* Trash Bin */}
      <rect x="135" y="105" width="55" height="70" rx="8" fill="#10B981" />
      <rect x="130" y="98" width="65" height="10" rx="4" fill="#059669" />
      <rect x="150" y="92" width="25" height="7" rx="3" fill="#047857" />
      <path d="M152 125l6-6 6 6m0 0l-3 6m3-6h-8m-3 16l-6-6 6-6m0 0l3-6m-3 6h8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Phone Body */}
      <rect x="50" y="45" width="90" height="140" rx="16" fill="#1E293B" />
      <rect x="55" y="55" width="80" height="120" rx="10" fill="#FFFFFF" />
      
      {/* Phone Screen: QR Code Box */}
      <rect x="68" y="70" width="54" height="54" rx="8" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" />
      <rect x="75" y="77" width="16" height="16" rx="3" fill="#10B981" />
      <rect x="99" y="77" width="16" height="16" rx="3" fill="#10B981" />
      <rect x="75" y="101" width="16" height="16" rx="3" fill="#10B981" />
      <rect x="99" y="101" width="8" height="8" fill="#059669" />
      <rect x="107" y="109" width="8" height="8" fill="#059669" />
      
      {/* Scan line */}
      <line x1="68" y1="97" x2="122" y2="97" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
      
      {/* Coins */}
      <circle cx="45" cy="160" r="18" fill="#FBBF24" stroke="#F59E0B" strokeWidth="3" />
      <circle cx="45" cy="160" r="12" fill="#FDE68A" />
      <circle cx="70" cy="175" r="15" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
      <circle cx="70" cy="175" r="10" fill="#FDE68A" />
    </svg>
  ),

  // 2. Receipt
  receipt: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#EFF6FF" />
      <circle cx="110" cy="110" r="80" fill="#DBEAFE" />
      
      {/* Phone Base */}
      <rect x="65" y="45" width="90" height="140" rx="16" fill="#1E293B" />
      <rect x="70" y="55" width="80" height="120" rx="10" fill="#3B82F6" />
      
      {/* Receipt Paper Floating Out */}
      <path d="M78 40h64v100l-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5V40z" fill="#FFFFFF" />
      
      {/* Green Success Badge */}
      <circle cx="110" cy="68" r="16" fill="#10B981" />
      <path d="M103 68l5 5 10-10" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Receipt lines */}
      <rect x="90" y="94" width="40" height="5" rx="2" fill="#93C5FD" />
      <rect x="88" y="105" width="44" height="4" rx="2" fill="#E2E8F0" />
      <rect x="88" y="114" width="44" height="4" rx="2" fill="#E2E8F0" />
      
      {/* Floating Card */}
      <rect x="125" y="125" width="65" height="42" rx="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
      <rect x="133" y="136" width="14" height="10" rx="2" fill="#FBBF24" />
      <circle cx="172" cy="153" r="6" fill="#EF4444" opacity="0.9" />
      <circle cx="164" cy="153" r="6" fill="#F59E0B" opacity="0.9" />
    </svg>
  ),

  // 3. House Registry
  house: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#F5F3FF" />
      <circle cx="110" cy="110" r="80" fill="#EDE9FE" />
      
      {/* House Body */}
      <path d="M60 115l50-35 50 35v55a6 6 0 0 1-6 6H66a6 6 0 0 1-6-6v-55z" fill="#8B5CF6" />
      <path d="M54 118l56-40 56 40" stroke="#6D28D9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="140" y="80" width="12" height="22" fill="#6D28D9" rx="2" />
      
      <rect x="96" y="136" width="28" height="40" rx="4" fill="#FFFFFF" />
      <rect x="74" y="128" width="16" height="16" rx="3" fill="#DDD6FE" />
      <rect x="130" y="128" width="16" height="16" rx="3" fill="#DDD6FE" />
      
      {/* Location Pin */}
      <path d="M155 50c-11 0-20 9-20 20 0 15 20 32 20 32s20-17 20-32c0-11-9-20-20-20z" fill="#EC4899" />
      <circle cx="155" cy="70" r="7" fill="#FFFFFF" />
      
      {/* Document Icon on Left */}
      <rect x="35" y="120" width="30" height="40" rx="4" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2" />
      <line x1="42" y1="130" x2="58" y2="130" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="138" x2="58" y2="138" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // 4. User Guide
  guide: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#FFFBEB" />
      <circle cx="110" cy="110" r="80" fill="#FEF3C7" />
      
      <path d="M50 115c18-8 40-6 60 5 20-11 42-13 60-5v55c-18-8-40-6-60 5-20-11-42-13-60-5v-55z" fill="#F59E0B" />
      <path d="M54 110c17-8 38-6 56 4v55c-18-10-39-12-56-4v-55z" fill="#FFFFFF" />
      <path d="M166 110c-17-8-38-6-56 4v55c18-10 39-12 56-4v-55z" fill="#FFFFFF" />
      
      <line x1="64" y1="124" x2="98" y2="120" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="134" x2="98" y2="130" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      
      <line x1="122" y1="120" x2="156" y2="124" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="122" y1="130" x2="156" y2="134" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      
      {/* Floating Lightbulb */}
      <circle cx="110" cy="65" r="22" fill="#FBBF24" />
      <path d="M102 85h16v6h-16z" fill="#D97706" rx="2" />
      <path d="M105 60a6 6 0 0 1 10 0c0 4-5 6-5 9" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="110" y1="35" x2="110" y2="40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // 5. Contact Staff
  support: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#ECFEFF" />
      <circle cx="110" cy="110" r="80" fill="#CFFAFE" />
      
      <path d="M68 180c0-23 19-42 42-42s42 19 42 42v2H68v-2z" fill="#0891B2" />
      <circle cx="110" cy="108" r="28" fill="#FDBA74" />
      <path d="M82 105c0-16 12-28 28-28s28 12 28 28c0 4-1 8-2 10-6-14-16-16-26-16s-20 2-26 16c-1-2-2-6-2-10z" fill="#1E293B" />
      
      {/* Headset */}
      <path d="M80 108c0-17 13-30 30-30s30 13 30 30" stroke="#0284C7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="76" y="100" width="8" height="16" rx="4" fill="#0369A1" />
      <rect x="136" y="100" width="8" height="16" rx="4" fill="#0369A1" />
      <path d="M138 116v8c0 4-4 8-8 8h-10" stroke="#0369A1" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="118" cy="132" r="4" fill="#0284C7" />
      
      {/* Chat Bubbles */}
      <rect x="140" y="55" width="45" height="30" rx="10" fill="#22C55E" />
      <circle cx="152" cy="70" r="3" fill="#FFFFFF" />
      <circle cx="162" cy="70" r="3" fill="#FFFFFF" />
      <circle cx="172" cy="70" r="3" fill="#FFFFFF" />
    </svg>
  ),

  // 6. Open Keyboard / Chat Input
  keyboard: (
    <svg width="340" height="320" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#F1F5F9" />
      <circle cx="110" cy="110" r="80" fill="#E2E8F0" />
      
      {/* Keyboard Base */}
      <rect x="40" y="70" width="140" height="88" rx="14" fill="#1E293B" />
      <rect x="44" y="74" width="132" height="80" rx="10" fill="#334155" />
      
      {/* Keys Row 1 */}
      <rect x="52" y="82" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="74" y="82" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="96" y="82" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="118" y="82" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="140" y="82" width="28" height="16" rx="4" fill="#94A3B8" />
      
      {/* Keys Row 2 */}
      <rect x="52" y="102" width="22" height="16" rx="4" fill="#94A3B8" />
      <rect x="78" y="102" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="100" y="102" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="122" y="102" width="18" height="16" rx="4" fill="#FFFFFF" />
      <rect x="144" y="102" width="24" height="16" rx="4" fill="#0EA5E9" />
      
      {/* Spacebar Row 3 */}
      <rect x="52" y="122" width="20" height="16" rx="4" fill="#94A3B8" />
      <rect x="76" y="122" width="68" height="16" rx="4" fill="#FFFFFF" />
      <rect x="148" y="122" width="20" height="16" rx="4" fill="#94A3B8" />
      
      {/* Floating Chat Bubble */}
      <rect x="120" y="32" width="65" height="42" rx="12" fill="#0EA5E9" />
      <path d="M135 74l-6 10v-10h6z" fill="#0EA5E9" />
      <circle cx="140" cy="53" r="4" fill="#FFFFFF" />
      <circle cx="152" cy="53" r="4" fill="#FFFFFF" />
      <circle cx="164" cy="53" r="4" fill="#FFFFFF" />
      
      {/* Downward indicator arrow */}
      <circle cx="110" cy="180" r="18" fill="#0EA5E9" />
      <path d="M103 177l7 7 7-7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const menuList = [
  {
    num: '01',
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    title: 'เช็คบิลค่าขยะ',
    subtitle: 'ตรวจสอบยอด & ชำระเงิน',
    illustration: cardIllustrations.bill,
  },
  {
    num: '02',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    title: 'ประวัติใบเสร็จ',
    subtitle: 'ดูสลิปและใบเสร็จย้อนหลัง',
    illustration: cardIllustrations.receipt,
  },
  {
    num: '03',
    badgeBg: '#EDE9FE',
    badgeColor: '#6D28D9',
    title: 'ข้อมูลทะเบียนบ้าน',
    subtitle: 'ตรวจสอบข้อมูลที่พักอาศัย',
    illustration: cardIllustrations.house,
  },
  {
    num: '04',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    title: 'คู่มือการใช้งาน',
    subtitle: 'ขั้นตอนการใช้งานระบบ',
    illustration: cardIllustrations.guide,
  },
  {
    num: '05',
    badgeBg: '#CFFAFE',
    badgeColor: '#0E7490',
    title: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สอบถามข้อมูลบริการ',
    illustration: cardIllustrations.support,
  },
  {
    num: '06',
    badgeBg: '#E2E8F0',
    badgeColor: '#334155',
    title: 'เปิดแป้นพิมพ์',
    subtitle: 'กดเพื่อพิมพ์คุยกับแอดมิน ⬇️',
    illustration: cardIllustrations.keyboard,
  },
];

export async function GET(req: NextRequest) {
  try {
    const W = 2500;
    const H = 1686;
    
    const GAP = 20;
    const P = 24;
    
    const CARD_W = Math.floor((W - P * 2 - GAP * 2) / 3);
    const CARD_H = Math.floor((H - P * 2 - GAP) / 2);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#E2E8F0',
            padding: `${P}px`,
            gap: `${GAP}px`,
          }}
        >
          {/* Row 1 */}
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: CARD_H, gap: `${GAP}px` }}>
            {menuList.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: CARD_W,
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '44px',
                  padding: '36px 36px 44px 36px',
                  boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top Row: Number Badge */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '76px',
                      height: '76px',
                      borderRadius: '38px',
                      background: item.badgeBg,
                      color: item.badgeColor,
                      fontSize: '38px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.num}
                  </div>
                </div>

                {/* Central Large Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                  {item.illustration}
                </div>

                {/* Big Bold Thai Title & Subtitle (No Bottom Pill Button) */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '74px', fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: 1.15 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '38px', color: '#64748B', textAlign: 'center', marginTop: '10px', lineHeight: 1.15 }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: CARD_H, gap: `${GAP}px` }}>
            {menuList.slice(3, 6).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: CARD_W,
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '44px',
                  padding: '36px 36px 44px 36px',
                  boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top Row: Number Badge */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '76px',
                      height: '76px',
                      borderRadius: '38px',
                      background: item.badgeBg,
                      color: item.badgeColor,
                      fontSize: '38px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.num}
                  </div>
                </div>

                {/* Central Large Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                  {item.illustration}
                </div>

                {/* Big Bold Thai Title & Subtitle (No Bottom Pill Button) */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '74px', fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: 1.15 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '38px', color: '#64748B', textAlign: 'center', marginTop: '10px', lineHeight: 1.15 }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: W,
        height: H,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
