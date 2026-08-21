import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// High-Detail Scalable Vector Illustrations
const cardIllustrations = {
  // 1. Bill Payment
  bill: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="96" fill="#ECFDF5" />
      <circle cx="110" cy="110" r="82" fill="#D1FAE5" />
      
      {/* Trash Bin */}
      <rect x="135" y="105" width="56" height="72" rx="10" fill="#10B981" />
      <rect x="130" y="97" width="66" height="11" rx="5" fill="#059669" />
      <rect x="150" y="90" width="26" height="8" rx="4" fill="#047857" />
      <path d="M152 125l6-6 6 6m0 0l-3 6m3-6h-8m-3 16l-6-6 6-6m0 0l3-6m-3 6h8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Phone Body */}
      <rect x="48" y="42" width="94" height="146" rx="18" fill="#1E293B" />
      <rect x="53" y="52" width="84" height="126" rx="12" fill="#FFFFFF" />
      
      {/* Phone Screen: QR Code Box */}
      <rect x="66" y="66" width="58" height="58" rx="10" fill="#F0FDF4" stroke="#10B981" strokeWidth="2.5" />
      <rect x="73" y="73" width="18" height="18" rx="4" fill="#10B981" />
      <rect x="99" y="73" width="18" height="18" rx="4" fill="#10B981" />
      <rect x="73" y="99" width="18" height="18" rx="4" fill="#10B981" />
      <rect x="99" y="99" width="9" height="9" fill="#059669" />
      <rect x="108" y="108" width="9" height="9" fill="#059669" />
      
      {/* Scan line */}
      <line x1="66" y1="95" x2="124" y2="95" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Coins */}
      <circle cx="42" cy="162" r="20" fill="#FBBF24" stroke="#F59E0B" strokeWidth="3.5" />
      <circle cx="42" cy="162" r="14" fill="#FDE68A" />
      <circle cx="68" cy="178" r="16" fill="#F59E0B" stroke="#D97706" strokeWidth="2.5" />
      <circle cx="68" cy="178" r="11" fill="#FDE68A" />
    </svg>
  ),

  // 2. Receipt
  receipt: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="96" fill="#EFF6FF" />
      <circle cx="110" cy="110" r="82" fill="#DBEAFE" />
      
      {/* Phone Base */}
      <rect x="64" y="42" width="94" height="146" rx="18" fill="#1E293B" />
      <rect x="69" y="52" width="84" height="126" rx="12" fill="#3B82F6" />
      
      {/* Receipt Paper Floating Out */}
      <path d="M76 38h68v104l-8.5-5-8.5 5-8.5-5-8.5 5-8.5-5-8.5 5-8.5-5-8.5 5V38z" fill="#FFFFFF" />
      
      {/* Green Success Badge */}
      <circle cx="110" cy="66" r="18" fill="#10B981" />
      <path d="M102 66l6 6 11-11" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Receipt lines */}
      <rect x="88" y="93" width="44" height="6" rx="3" fill="#93C5FD" />
      <rect x="86" y="105" width="48" height="4.5" rx="2" fill="#CBD5E1" />
      <rect x="86" y="115" width="48" height="4.5" rx="2" fill="#CBD5E1" />
      <rect x="86" y="125" width="30" height="4.5" rx="2" fill="#CBD5E1" />
      
      {/* Floating Card */}
      <rect x="124" y="125" width="70" height="46" rx="9" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
      <rect x="133" y="137" width="16" height="11" rx="2.5" fill="#FBBF24" />
      <circle cx="176" cy="156" r="7" fill="#EF4444" opacity="0.9" />
      <circle cx="167" cy="156" r="7" fill="#F59E0B" opacity="0.9" />
    </svg>
  ),

  // 3. House Registry
  house: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="96" fill="#F5F3FF" />
      <circle cx="110" cy="110" r="82" fill="#EDE9FE" />
      
      {/* House Body */}
      <path d="M58 114l52-36 52 36v58a6 6 0 0 1-6 6H64a6 6 0 0 1-6-6v-58z" fill="#8B5CF6" />
      <path d="M52 117l58-42 58 42" stroke="#6D28D9" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="142" y="78" width="14" height="24" fill="#6D28D9" rx="3" />
      
      {/* House Door & Windows */}
      <rect x="95" y="134" width="30" height="44" rx="5" fill="#FFFFFF" />
      <rect x="72" y="126" width="18" height="18" rx="4" fill="#DDD6FE" />
      <rect x="130" y="126" width="18" height="18" rx="4" fill="#DDD6FE" />
      
      {/* Location Pin */}
      <path d="M158 48c-12 0-22 10-22 22 0 16 22 34 22 34s22-18 22-34c0-12-10-22-22-22z" fill="#EC4899" />
      <circle cx="158" cy="70" r="8" fill="#FFFFFF" />
      
      {/* Document Icon */}
      <rect x="32" y="118" width="34" height="44" rx="5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" />
      <line x1="40" y1="129" x2="58" y2="129" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="138" x2="58" y2="138" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="147" x2="51" y2="147" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  // 4. Open Keyboard (Hand/Finger Pointing Down to Bottom-Left Corner)
  keyboard: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      {/* Outer target aura */}
      <circle cx="110" cy="110" r="96" fill="#F0FDF4" />
      <circle cx="110" cy="110" r="82" fill="#DCFCE7" />
      
      {/* Mini Keyboard preview bar at the top */}
      <rect x="38" y="44" width="144" height="50" rx="12" fill="#1E293B" />
      <rect x="42" y="48" width="136" height="42" rx="9" fill="#334155" />
      {/* Keyboard keys */}
      <rect x="48" y="53" width="14" height="12" rx="3" fill="#FFFFFF" />
      <rect x="66" y="53" width="14" height="12" rx="3" fill="#FFFFFF" />
      <rect x="84" y="53" width="14" height="12" rx="3" fill="#FFFFFF" />
      <rect x="102" y="53" width="14" height="12" rx="3" fill="#FFFFFF" />
      <rect x="120" y="53" width="14" height="12" rx="3" fill="#FFFFFF" />
      <rect x="138" y="53" width="34" height="12" rx="3" fill="#10B981" />
      <rect x="54" y="70" width="88" height="14" rx="4" fill="#FFFFFF" />
      <rect x="146" y="70" width="26" height="14" rx="4" fill="#94A3B8" />

      {/* Target focus ring at bottom-left */}
      <circle cx="68" cy="180" r="32" fill="#10B981" opacity="0.25" />
      <circle cx="68" cy="180" r="22" fill="#10B981" opacity="0.45" />
      <circle cx="68" cy="180" r="12" fill="#10B981" />

      {/* Hand Sleeve & Wrist */}
      <path d="M148 95l32 30-18 16-30-30z" fill="#0284C7" />
      
      {/* Hand Palm */}
      <path d="M115 110l30 25c6 5 7 15 2 21l-4 5c-5 6-15 7-21 2l-22-18 15-35z" fill="#FDBA74" />
      
      {/* Folded fingers (Knuckles) */}
      <circle cx="132" cy="144" r="10" fill="#FB923C" />
      <circle cx="122" cy="154" r="10" fill="#FB923C" />
      <circle cx="110" cy="160" r="9" fill="#EA580C" />
      
      {/* Big 3D Extended Index Finger Pointing Down-Left */}
      <path d="M125 118l-45 48c-4 5-11 5-16 1s-5-11-1-16l42-45 20 12z" fill="#FDBA74" />
      {/* Fingernail */}
      <ellipse cx="69" cy="173" rx="5" ry="7" transform="rotate(-40 69 173)" fill="#FED7AA" />

      {/* High-visibility Dynamic Down-Left Arrow */}
      <path d="M50 142l-14 24m0 0l22 2m-22-2l-2-22" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="130" r="5" fill="#F59E0B" />
      <circle cx="185" cy="160" r="6" fill="#F59E0B" />
    </svg>
  ),

  // 5. User Guide
  guide: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="96" fill="#FFFBEB" />
      <circle cx="110" cy="110" r="82" fill="#FEF3C7" />
      
      {/* Open Book */}
      <path d="M48 114c19-8 42-6 62 5 20-11 43-13 62-5v58c-19-8-42-6-62 5-20-11-43-13-62-5v-58z" fill="#F59E0B" />
      <path d="M52 108c18-8 40-6 58 4v58c-18-10-40-12-58-4v-58z" fill="#FFFFFF" />
      <path d="M168 108c-18-8-40-6-58 4v58c18-10 40-12 58-4v-58z" fill="#FFFFFF" />
      
      <line x1="62" y1="123" x2="98" y2="119" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="62" y1="134" x2="98" y2="130" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="62" y1="145" x2="88" y2="141" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      
      <line x1="122" y1="119" x2="158" y2="123" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="122" y1="130" x2="158" y2="134" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="122" y1="141" x2="148" y2="145" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Floating Lightbulb */}
      <circle cx="110" cy="62" r="24" fill="#FBBF24" />
      <path d="M101 84h18v7h-18z" fill="#D97706" rx="2.5" />
      <path d="M105 57a6 6 0 0 1 10 0c0 4-5 6-5 9" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      <line x1="110" y1="30" x2="110" y2="35" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="78" y1="46" x2="84" y2="51" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="142" y1="46" x2="136" y2="51" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),

  // 6. Contact Staff
  support: (
    <svg width="420" height="370" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="96" fill="#ECFEFF" />
      <circle cx="110" cy="110" r="82" fill="#CFFAFE" />
      
      <path d="M66 182c0-24 20-44 44-44s44 20 44 44v2H66v-2z" fill="#0891B2" />
      <circle cx="110" cy="106" r="30" fill="#FDBA74" />
      <path d="M80 103c0-17 13-30 30-30s30 13 30 30c0 4-1 9-2 11-6-15-17-17-28-17s-22 2-28 17c-1-2-2-7-2-11z" fill="#1E293B" />
      
      {/* Headset */}
      <path d="M78 106c0-18 14-32 32-32s32 14 32 32" stroke="#0284C7" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <rect x="73" y="97" width="9" height="18" rx="4.5" fill="#0369A1" />
      <rect x="138" y="97" width="9" height="18" rx="4.5" fill="#0369A1" />
      <path d="M140 114v9c0 5-4 9-9 9h-11" stroke="#0369A1" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="118" cy="132" r="4.5" fill="#0284C7" />
      
      {/* Chat Bubbles */}
      <rect x="138" y="52" width="48" height="32" rx="11" fill="#22C55E" />
      <circle cx="150" cy="68" r="3.5" fill="#FFFFFF" />
      <circle cx="162" cy="68" r="3.5" fill="#FFFFFF" />
      <circle cx="174" cy="68" r="3.5" fill="#FFFFFF" />
      
      <rect x="32" y="68" width="44" height="28" rx="9" fill="#3B82F6" />
      <circle cx="45" cy="82" r="3" fill="#FFFFFF" />
      <circle cx="54" cy="82" r="3" fill="#FFFFFF" />
      <circle cx="63" cy="82" r="3" fill="#FFFFFF" />
    </svg>
  ),
};

const menuList = [
  {
    num: '01',
    badgeBg: '#D1FAE5',
    badgeBorder: '#10B981',
    badgeColor: '#047857',
    title: 'เช็คบิลค่าขยะ',
    subtitle: 'ตรวจสอบยอด & สแกน QR',
    illustration: cardIllustrations.bill,
  },
  {
    num: '02',
    badgeBg: '#DBEAFE',
    badgeBorder: '#3B82F6',
    badgeColor: '#1D4ED8',
    title: 'ประวัติใบเสร็จ',
    subtitle: 'ดูสลิป & ยอดชำระย้อนหลัง',
    illustration: cardIllustrations.receipt,
  },
  {
    num: '03',
    badgeBg: '#EDE9FE',
    badgeBorder: '#8B5CF6',
    badgeColor: '#6D28D9',
    title: 'ข้อมูลทะเบียนบ้าน',
    subtitle: 'ตรวจสอบข้อมูลที่พักอาศัย',
    illustration: cardIllustrations.house,
  },
  {
    num: '04',
    badgeBg: '#DCFCE7',
    badgeBorder: '#10B981',
    badgeColor: '#047857',
    title: 'เปิดแป้นพิมพ์',
    subtitle: 'กดปุ่มที่มุมซ้ายล่างนี้ ⬇️',
    illustration: cardIllustrations.keyboard,
  },
  {
    num: '05',
    badgeBg: '#FEF3C7',
    badgeBorder: '#F59E0B',
    badgeColor: '#B45309',
    title: 'คู่มือการใช้งาน',
    subtitle: 'ขั้นตอนการจ่ายเงิน & ใช้งาน',
    illustration: cardIllustrations.guide,
  },
  {
    num: '06',
    badgeBg: '#CFFAFE',
    badgeBorder: '#06B6D4',
    badgeColor: '#0E7490',
    title: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สอบถามข้อมูลบริการ 24 ชม.',
    illustration: cardIllustrations.support,
  },
];

export async function GET(req: NextRequest) {
  try {
    const W = 2500;
    const H = 1686;
    
    const GAP = 16;
    const P = 16;
    
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
            backgroundColor: '#CBD5E1',
            padding: `${P}px`,
            gap: `${GAP}px`,
          }}
        >
          {/* Row 1: 01, 02, 03 */}
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
                  borderRadius: '48px',
                  padding: '28px 24px 36px 24px',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.09)',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
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
                      width: '92px',
                      height: '92px',
                      borderRadius: '46px',
                      background: item.badgeBg,
                      border: `3px solid ${item.badgeBorder}`,
                      color: item.badgeColor,
                      fontSize: '46px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.num}
                  </div>
                </div>

                {/* Central Massive Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                  {item.illustration}
                </div>

                {/* Extra Large Thai Title & Subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '86px', fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 600, color: '#64748B', textAlign: 'center', marginTop: '12px', lineHeight: 1.15 }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: 04 (Keyboard at Bottom-Left), 05 (Guide), 06 (Support) */}
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: CARD_H, gap: `${GAP}px` }}>
            {menuList.slice(3, 6).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: CARD_W,
                  height: '100%',
                  backgroundColor: item.num === '04' ? '#F0FDF4' : '#FFFFFF', // Special subtle tint for slot 04
                  borderRadius: '48px',
                  padding: '28px 24px 36px 24px',
                  boxShadow: item.num === '04' ? '0 16px 40px rgba(16, 185, 129, 0.15)' : '0 16px 40px rgba(15, 23, 42, 0.09)',
                  border: item.num === '04' ? '3px solid #10B981' : '2px solid rgba(255, 255, 255, 0.9)',
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
                      width: '92px',
                      height: '92px',
                      borderRadius: '46px',
                      background: item.badgeBg,
                      border: `3px solid ${item.badgeBorder}`,
                      color: item.badgeColor,
                      fontSize: '46px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.num}
                  </div>
                </div>

                {/* Central Massive Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                  {item.illustration}
                </div>

                {/* Extra Large Thai Title & Subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '86px', fontWeight: 'bold', color: item.num === '04' ? '#047857' : '#0F172A', textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 600, color: item.num === '04' ? '#059669' : '#64748B', textAlign: 'center', marginTop: '12px', lineHeight: 1.15 }}>
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
