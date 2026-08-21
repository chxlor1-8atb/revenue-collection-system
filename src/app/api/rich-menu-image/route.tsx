import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Rich Vector Illustrations for each card
const cardIllustrations = {
  // 1. Bill Payment (Phone with QR + Trash Bin + Coins)
  bill: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      {/* Background Glow Circle */}
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
      <path d="M45 153v14m-4-10h8a3 3 0 0 1 0 6h-8a3 3 0 0 0 0 6h8" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      
      <circle cx="70" cy="175" r="15" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
      <circle cx="70" cy="175" r="10" fill="#FDE68A" />
    </svg>
  ),

  // 2. Receipt (Phone with Receipt Paper + Checkmark)
  receipt: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
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
      <rect x="88" y="123" width="28" height="4" rx="2" fill="#E2E8F0" />
      
      {/* Floating Card */}
      <rect x="125" y="125" width="65" height="42" rx="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
      <rect x="133" y="136" width="14" height="10" rx="2" fill="#FBBF24" />
      <circle cx="172" cy="153" r="6" fill="#EF4444" opacity="0.9" />
      <circle cx="164" cy="153" r="6" fill="#F59E0B" opacity="0.9" />
    </svg>
  ),

  // 3. House Registry (Modern House + Document + Location Pin)
  house: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#F5F3FF" />
      <circle cx="110" cy="110" r="80" fill="#EDE9FE" />
      
      {/* House Body */}
      <path d="M60 115l50-35 50 35v55a6 6 0 0 1-6 6H66a6 6 0 0 1-6-6v-55z" fill="#8B5CF6" />
      {/* Roof Highlight */}
      <path d="M54 118l56-40 56 40" stroke="#6D28D9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="140" y="80" width="12" height="22" fill="#6D28D9" rx="2" />
      
      {/* House Door & Windows */}
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
      <line x1="42" y1="146" x2="52" y2="146" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // 4. User Guide (Open Book + Lightbulb + Gears)
  guide: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#FFFBEB" />
      <circle cx="110" cy="110" r="80" fill="#FEF3C7" />
      
      {/* Open Book */}
      <path d="M50 115c18-8 40-6 60 5 20-11 42-13 60-5v55c-18-8-40-6-60 5-20-11-42-13-60-5v-55z" fill="#F59E0B" />
      <path d="M54 110c17-8 38-6 56 4v55c-18-10-39-12-56-4v-55z" fill="#FFFFFF" />
      <path d="M166 110c-17-8-38-6-56 4v55c18-10 39-12 56-4v-55z" fill="#FFFFFF" />
      
      {/* Text lines in book */}
      <line x1="64" y1="124" x2="98" y2="120" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="134" x2="98" y2="130" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="144" x2="90" y2="140" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      
      <line x1="122" y1="120" x2="156" y2="124" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="122" y1="130" x2="156" y2="134" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="122" y1="140" x2="148" y2="144" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      
      {/* Floating Lightbulb */}
      <circle cx="110" cy="65" r="22" fill="#FBBF24" />
      <path d="M102 85h16v6h-16z" fill="#D97706" rx="2" />
      <path d="M105 60a6 6 0 0 1 10 0c0 4-5 6-5 9" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rays */}
      <line x1="110" y1="35" x2="110" y2="40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="82" y1="50" x2="87" y2="54" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="138" y1="50" x2="133" y2="54" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // 5. Report Issue (Warning Triangle + Damaged Bin + Megaphone)
  report: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#FFF1F2" />
      <circle cx="110" cy="110" r="80" fill="#FFE4E6" />
      
      {/* Trash Bin with trash overflowing */}
      <rect x="50" y="115" width="48" height="60" rx="6" fill="#94A3B8" />
      <rect x="45" y="108" width="58" height="8" rx="3" fill="#64748B" />
      <path d="M58 108l10-18 15 6-5 12" fill="#CBD5E1" />
      
      {/* Big Alert Warning Triangle */}
      <path d="M135 60l42 70a6 6 0 0 1-5 9h-84a6 6 0 0 1-5-9l42-70a6 6 0 0 1 10 0z" fill="#F43F5E" />
      <path d="M135 72l32 54h-64l32-54z" fill="#FB7185" />
      <line x1="135" y1="88" x2="135" y2="106" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="135" cy="117" r="3.5" fill="#FFFFFF" />
      
      {/* Speech exclamation badge */}
      <circle cx="75" cy="80" r="16" fill="#E11D48" />
      <line x1="75" y1="73" x2="75" y2="82" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="75" cy="88" r="2" fill="#FFFFFF" />
    </svg>
  ),

  // 6. Contact Staff (Support Agent with Headset + Chat Bubbles)
  support: (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
      <circle cx="110" cy="110" r="95" fill="#ECFEFF" />
      <circle cx="110" cy="110" r="80" fill="#CFFAFE" />
      
      {/* Support Person */}
      <path d="M68 180c0-23 19-42 42-42s42 19 42 42v2H68v-2z" fill="#0891B2" />
      <circle cx="110" cy="108" r="28" fill="#FDBA74" />
      {/* Hair */}
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
      
      <rect x="35" y="70" width="40" height="26" rx="8" fill="#3B82F6" />
      <circle cx="47" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="55" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="63" cy="83" r="2.5" fill="#FFFFFF" />
    </svg>
  )
};

const menuList = [
  {
    tag: 'PAYMENT',
    tagBg: '#ECFDF5',
    tagColor: '#059669',
    title: 'เช็คบิล / จ่ายค่าขยะ',
    subtitle: 'ตรวจสอบยอด & สแกนจ่าย QR',
    btnText: 'ชำระเงิน',
    btnBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    btnShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
    illustration: cardIllustrations.bill,
  },
  {
    tag: 'RECEIPTS',
    tagBg: '#EFF6FF',
    tagColor: '#2563EB',
    title: 'ประวัติใบเสร็จ',
    subtitle: 'ดูและดาวน์โหลดใบเสร็จรับเงิน',
    btnText: 'ดูใบเสร็จ',
    btnBg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    btnShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
    illustration: cardIllustrations.receipt,
  },
  {
    tag: 'HOUSE REGISTRY',
    tagBg: '#F5F3FF',
    tagColor: '#7C3AED',
    title: 'ข้อมูลทะเบียนบ้าน',
    subtitle: 'ตรวจสอบและจัดการที่พักอาศัย',
    btnText: 'จัดการข้อมูล',
    btnBg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    btnShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
    illustration: cardIllustrations.house,
  },
  {
    tag: 'USER GUIDE',
    tagBg: '#FFFBEB',
    tagColor: '#D97706',
    title: 'คู่มือการใช้งาน',
    subtitle: 'ขั้นตอนและวิธีชำระค่าธรรมเนียม',
    btnText: 'ดูคู่มือ',
    btnBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    btnShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
    illustration: cardIllustrations.guide,
  },
  {
    tag: 'REPORT ISSUE',
    tagBg: '#FFF1F2',
    tagColor: '#E11D48',
    title: 'แจ้งปัญหา / ร้องเรียน',
    subtitle: 'ขยะตกค้าง ถังขยะชำรุด หรืออื่นๆ',
    btnText: 'แจ้งเรื่อง',
    btnBg: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
    btnShadow: '0 8px 20px rgba(225, 29, 72, 0.35)',
    illustration: cardIllustrations.report,
  },
  {
    tag: 'SUPPORT 24/7',
    tagBg: '#ECFEFF',
    tagColor: '#0891B2',
    title: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สอบถามข้อมูลและขอความช่วยเหลือ',
    btnText: 'ติดต่อเรา',
    btnBg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    btnShadow: '0 8px 20px rgba(8, 145, 178, 0.35)',
    illustration: cardIllustrations.support,
  },
];

export async function GET(req: NextRequest) {
  try {
    const W = 2500;
    const H = 1686;
    
    const GAP = 28;
    const P = 36;
    
    const CARD_W = Math.floor((W - P * 2 - GAP * 2) / 3); // 3 cols
    const CARD_H = Math.floor((H - P * 2 - GAP) / 2);     // 2 rows

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#F1F5F9', // Modern Slate 100
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
                  borderRadius: '40px',
                  padding: '40px 36px 36px 36px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                  border: '1.5px solid #E2E8F0',
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top Tag & Header */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      background: item.tagBg,
                      color: item.tagColor,
                      padding: '8px 20px',
                      borderRadius: '100px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                    }}
                  >
                    {item.tag}
                  </div>
                </div>

                {/* Central Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                  {item.illustration}
                </div>

                {/* Texts & Button */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '46px', fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: 1.2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '28px', color: '#64748B', textAlign: 'center', marginTop: '8px', lineHeight: 1.2 }}>
                    {item.subtitle}
                  </div>

                  {/* Modern Pill Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      background: item.btnBg,
                      color: '#FFFFFF',
                      borderRadius: '100px',
                      padding: '18px 0',
                      marginTop: '24px',
                      fontSize: '34px',
                      fontWeight: 'bold',
                      boxShadow: item.btnShadow,
                    }}
                  >
                    {item.btnText}
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
                  borderRadius: '40px',
                  padding: '40px 36px 36px 36px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                  border: '1.5px solid #E2E8F0',
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top Tag & Header */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      background: item.tagBg,
                      color: item.tagColor,
                      padding: '8px 20px',
                      borderRadius: '100px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                    }}
                  >
                    {item.tag}
                  </div>
                </div>

                {/* Central Vector Illustration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                  {item.illustration}
                </div>

                {/* Texts & Button */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '46px', fontWeight: 'bold', color: '#0F172A', textAlign: 'center', lineHeight: 1.2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '28px', color: '#64748B', textAlign: 'center', marginTop: '8px', lineHeight: 1.2 }}>
                    {item.subtitle}
                  </div>

                  {/* Modern Pill Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      background: item.btnBg,
                      color: '#FFFFFF',
                      borderRadius: '100px',
                      padding: '18px 0',
                      marginTop: '24px',
                      fontSize: '34px',
                      fontWeight: 'bold',
                      boxShadow: item.btnShadow,
                    }}
                  >
                    {item.btnText}
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
