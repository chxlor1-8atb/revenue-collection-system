import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const menuButtons = [
  {
    label: 'เช็คบิล',
    subtitle: 'ตรวจสอบยอดที่ต้องชำระ',
    actionText: 'ดูบิลของฉัน',
    badge: 'แนะนำ',
    accent: '#059669', // Dark Emerald
    iconPath: (
      <g>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        <polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="2" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="2" />
        <circle cx="17" cy="17" r="4.5" fill="#059669" stroke="white" strokeWidth="2" />
        <line x1="20" y1="20" x2="23" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ใบเสร็จ',
    subtitle: 'ประวัติการชำระเงินย้อนหลัง',
    actionText: 'ดูใบเสร็จ',
    badge: null,
    accent: '#0284C7', // Dark Sky Blue
    iconPath: (
      <g>
        <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2L19 4 16 2 13 4 10 2 7 4z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="2" />
        <line x1="8" y1="12" x2="14" y2="12" stroke="white" strokeWidth="2" />
        <circle cx="17" cy="15" r="4.5" fill="#0284C7" stroke="white" strokeWidth="2" />
        <polyline points="14.5 15 16 16.5 19.5 13" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'ข้อมูลของฉัน',
    subtitle: 'ข้อมูลบ้านและบัญชีผู้ใช้',
    actionText: 'จัดการบัญชี',
    badge: null,
    accent: '#6D28D9', // Dark Purple
    iconPath: (
      <g>
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        <polyline points="9 22 9 14 15 14 15 22" fill="#6D28D9" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </g>
    ),
  },
  {
    label: 'วิธีใช้งาน',
    subtitle: 'คู่มือและขั้นตอนการใช้บริการ',
    actionText: 'อ่านคู่มือ',
    badge: 'มือใหม่',
    accent: '#B45309', // Dark Amber
    iconPath: (
      <g>
        <path d="M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 21v-1a7 7 0 0 1-3.08-4.66A7 7 0 1 1 17 10c0 2.08-.8 3.97-2.5 5.34A3 3 0 0 0 14 17v1" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        <line x1="12" y1="1" x2="12" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="11" x2="3" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="11" x2="23" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'แจ้งปัญหา',
    subtitle: 'พบปัญหาขยะ รายงานได้ทันที',
    actionText: 'ส่งรายงาน',
    badge: null,
    accent: '#DC2626', // Red
    iconPath: (
      <g>
        <path d="M18 8a6 6 0 0 1 0 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 5a10 10 0 0 1 0 14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <path d="M2 11v2a2 2 0 0 0 2 2h1l4 5V4L5 9H4a2 2 0 0 0-2 2z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
        <path d="M15 18l3-5 3 5z" fill="#DC2626" stroke="white" strokeWidth="1.5" />
        <line x1="18" y1="16.5" x2="18" y2="16.6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="14" x2="18" y2="15.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สายตรงเทศบาลเมือง',
    actionText: 'ติดต่อเรา',
    badge: '24 ชม.',
    accent: '#BE185D', // Dark Pink
    iconPath: (
      <g>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" fill="#BE185D" stroke="white" strokeWidth="1.5" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="#BE185D" stroke="white" strokeWidth="1.5" />
        <circle cx="12" cy="13" r="4" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M10 14.5a2.5 2.5 0 0 0 4 0" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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
    const PADDING_X = 35;
    const PADDING_Y = 35;
    const GAP_X = 35;
    const GAP_Y = 35;
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
            background: '#E5E7EB', // Light gray background for contrast
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
                  background: '#FFFFFF', // Pure white card
                  border: `4px solid #D1D5DB`, // Subtle border
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 50,
                  boxShadow: `0 15px 30px rgba(0,0,0,0.05)`, // Soft shadow
                }}
              >
                {/* Colored Top Border Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 12,
                    background: btn.accent,
                  }}
                />

                {/* Top Section: Icon & Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginTop: 10 }}>
                  {/* Icon Container */}
                  <div
                    style={{
                      display: 'flex',
                      width: 280,
                      height: 280,
                      borderRadius: 75,
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: btn.accent,
                      boxShadow: `0 15px 30px ${btn.accent}40`,
                    }}
                  >
                    <svg width="170" height="170" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {btn.iconPath}
                    </svg>
                  </div>

                  {/* Badge */}
                  {btn.badge && (
                    <div
                      style={{
                        display: 'flex',
                        background: '#EF4444', // Red for high visibility
                        padding: '12px 30px',
                        borderRadius: 30,
                      }}
                    >
                      <span style={{ color: 'white', fontSize: 36, fontWeight: 700 }}>{btn.badge}</span>
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div style={{ display: 'flex', flex: 1 }} />

                {/* Content Section - High Contrast Text */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 95, fontWeight: 700, color: '#111827', letterSpacing: '-1px' }}>
                    {btn.label}
                  </div>
                  
                  <div style={{ fontSize: 45, fontWeight: 700, color: '#4B5563', marginTop: 15 }}>
                    {btn.subtitle}
                  </div>
                  
                  {/* Action Pill - High Contrast */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 45,
                      background: btn.accent,
                      padding: '25px 55px',
                      borderRadius: 100,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 50, fontWeight: 700, color: 'white', marginRight: 20 }}>
                      {btn.actionText}
                    </span>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
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
