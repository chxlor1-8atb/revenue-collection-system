import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const menuButtons = [
  {
    label: 'เช็คบิล',
    subtitle: 'ตรวจสอบยอดที่ต้องชำระ',
    actionText: 'ดูบิลของฉัน',
    badge: 'แนะนำ',
    accent: '#10B981',
    bgStart: '#064E3B',
    bgEnd: '#022C22',
    iconPath: (
      <g>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
        <polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="1.2" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
        <circle cx="17" cy="17" r="4.5" fill="#10B981" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="23" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ใบเสร็จ',
    subtitle: 'ประวัติการชำระเงินย้อนหลัง',
    actionText: 'ดูใบเสร็จ',
    badge: null,
    accent: '#0EA5E9',
    bgStart: '#0C4A6E',
    bgEnd: '#082F49',
    iconPath: (
      <g>
        <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2L19 4 16 2 13 4 10 2 7 4z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
        <line x1="8" y1="8" x2="16" y2="8" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
        <line x1="8" y1="12" x2="14" y2="12" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
        <circle cx="17" cy="15" r="4.5" fill="#0EA5E9" stroke="white" strokeWidth="1.5" />
        <polyline points="14.5 15 16 16.5 19.5 13" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'ข้อมูลของฉัน',
    subtitle: 'ข้อมูลบ้านและบัญชีผู้ใช้',
    actionText: 'จัดการบัญชี',
    badge: null,
    accent: '#8B5CF6',
    bgStart: '#4C1D95',
    bgEnd: '#2E1065',
    iconPath: (
      <g>
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
        <polyline points="9 22 9 14 15 14 15 22" fill="#8B5CF6" stroke="white" strokeWidth="1" />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </g>
    ),
  },
  {
    label: 'วิธีใช้งาน',
    subtitle: 'คู่มือและขั้นตอนการใช้บริการ',
    actionText: 'อ่านคู่มือ',
    badge: 'มือใหม่',
    accent: '#F59E0B',
    bgStart: '#78350F',
    bgEnd: '#451A03',
    iconPath: (
      <g>
        <path d="M9 21h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 21v-1a7 7 0 0 1-3.08-4.66A7 7 0 1 1 17 10c0 2.08-.8 3.97-2.5 5.34A3 3 0 0 0 14 17v1" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
        <line x1="12" y1="1" x2="12" y2="3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="11" x2="3" y2="11" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="11" x2="23" y2="11" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'แจ้งปัญหา',
    subtitle: 'พบปัญหาขยะ รายงานได้ทันที',
    actionText: 'ส่งรายงาน',
    badge: null,
    accent: '#EF4444',
    bgStart: '#7F1D1D',
    bgEnd: '#450A0A',
    iconPath: (
      <g>
        <path d="M18 8a6 6 0 0 1 0 8" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 5a10 10 0 0 1 0 14" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M2 11v2a2 2 0 0 0 2 2h1l4 5V4L5 9H4a2 2 0 0 0-2 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
        <path d="M15 18l3-5 3 5z" fill="#EF4444" stroke="white" strokeWidth="1" />
        <line x1="18" y1="16.5" x2="18" y2="16.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="14" x2="18" y2="15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สายตรงเทศบาลเมือง',
    actionText: 'ติดต่อเรา',
    badge: '24 ชม.',
    accent: '#EC4899',
    bgStart: '#831843',
    bgEnd: '#4C0519',
    iconPath: (
      <g>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth="1.5" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" fill="#EC4899" stroke="white" strokeWidth="1" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="#EC4899" stroke="white" strokeWidth="1" />
        <circle cx="12" cy="13" r="4" fill="none" stroke="white" strokeWidth="1" />
        <path d="M10 14.5a2.5 2.5 0 0 0 4 0" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </g>
    ),
  },
];

export async function GET(req: NextRequest) {
  try {
    // Load Thai fonts (Bold + Regular)
    const fontUrl = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf';
    let fontData: ArrayBuffer | null = null;
    let fontDataRegular: ArrayBuffer | null = null;
    try {
      const [boldRes, regularRes] = await Promise.all([
        fetch(fontUrl),
        fetch('https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansThai/NotoSansThai-Regular.ttf'),
      ]);
      fontData = await boldRes.arrayBuffer();
      fontDataRegular = await regularRes.arrayBuffer();
    } catch (e) {
      console.error('Failed to load font', e);
    }

    const W = 2500;
    const H = 1686;
    
    // Grid settings
    const PADDING_X = 40;
    const PADDING_Y = 40;
    const GAP_X = 40;
    const GAP_Y = 40;
    const COLS = 3;
    const ROWS = 2;
    
    const cardW = (W - (PADDING_X * 2) - (GAP_X * (COLS - 1))) / COLS;
    const cardH = (H - (PADDING_Y * 2) - (GAP_Y * (ROWS - 1))) / ROWS;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            fontFamily: 'NotoSansThai, sans-serif',
            background: '#09090b', // Deep dark background
          }}
        >
          {/* ========== BUTTON GRID ========== */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              paddingLeft: PADDING_X,
              paddingRight: PADDING_X,
              paddingTop: PADDING_Y,
              paddingBottom: PADDING_Y,
              gap: GAP_X,
              width: '100%',
              height: '100%',
            }}
          >
            {menuButtons.map((btn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: cardW,
                  height: cardH,
                  borderRadius: 60,
                  background: `linear-gradient(135deg, ${btn.bgStart} 0%, ${btn.bgEnd} 100%)`,
                  border: `2px solid rgba(255,255,255,0.15)`,
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 50,
                }}
              >
                {/* Giant watermark icon */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -50,
                    right: -40,
                    display: 'flex',
                    opacity: 0.1,
                  }}
                >
                  <svg width="450" height="450" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {btn.iconPath}
                  </svg>
                </div>

                {/* Top Section: Icon & Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  {/* Icon Container */}
                  <div
                    style={{
                      display: 'flex',
                      width: 170,
                      height: 170,
                      borderRadius: 45,
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.12)',
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      {btn.iconPath}
                    </svg>
                  </div>

                  {/* Optional Badge */}
                  {btn.badge && (
                    <div
                      style={{
                        display: 'flex',
                        background: btn.accent,
                        padding: '12px 28px',
                        borderRadius: 30,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      <span style={{ color: 'white', fontSize: 34, fontWeight: 700 }}>{btn.badge}</span>
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div style={{ display: 'flex', flex: 1 }} />

                {/* Content Section */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 95, fontWeight: 700, color: '#ffffff' }}>
                    {btn.label}
                  </div>
                  
                  <div style={{ fontSize: 44, fontWeight: 400, color: 'rgba(255,255,255,0.65)', marginTop: 10 }}>
                    {btn.subtitle}
                  </div>
                  
                  {/* Action Pill (Fake Button) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 45,
                      background: 'rgba(255,255,255,0.1)',
                      padding: '18px 35px',
                      borderRadius: 100,
                      alignSelf: 'flex-start',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <span style={{ fontSize: 38, fontWeight: 700, color: btn.accent, marginRight: 15 }}>
                      {btn.actionText}
                    </span>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={btn.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
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
        fonts: [
          ...(fontData
            ? [
                {
                  name: 'NotoSansThai',
                  data: fontData,
                  style: 'normal' as const,
                  weight: 700 as const,
                },
              ]
            : []),
          ...(fontDataRegular
            ? [
                {
                  name: 'NotoSansThai',
                  data: fontDataRegular,
                  style: 'normal' as const,
                  weight: 400 as const,
                },
              ]
            : []),
        ],
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
