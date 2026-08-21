import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const menuButtons = [
  {
    label: 'เช็คบิล',
    subtitle: 'ตรวจสอบยอดที่ต้องชำระ',
    actionText: 'ดูบิลของฉัน',
    badge: 'แนะนำ',
    accent: '#34C759', // Apple Green
    bgStart: '#4ADE80',
    bgEnd: '#22C55E',
    tintBg: 'rgba(52, 199, 89, 0.15)',
    iconPath: (
      <g>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="9" x2="8" y2="9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'ใบเสร็จ',
    subtitle: 'ประวัติการชำระเงินย้อนหลัง',
    actionText: 'ดูใบเสร็จ',
    badge: null,
    accent: '#007AFF', // Apple Blue
    bgStart: '#60A5FA',
    bgEnd: '#2563EB',
    tintBg: 'rgba(0, 122, 255, 0.15)',
    iconPath: (
      <g>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8h-6" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12h-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 16h-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'ข้อมูลของฉัน',
    subtitle: 'ข้อมูลบ้านและบัญชีผู้ใช้',
    actionText: 'จัดการบัญชี',
    badge: null,
    accent: '#AF52DE', // Apple Purple
    bgStart: '#C084FC',
    bgEnd: '#9333EA',
    tintBg: 'rgba(175, 82, 222, 0.15)',
    iconPath: (
      <g>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'วิธีใช้งาน',
    subtitle: 'คู่มือและขั้นตอนการใช้บริการ',
    actionText: 'อ่านคู่มือ',
    badge: 'มือใหม่',
    accent: '#FF9500', // Apple Orange
    bgStart: '#FBBF24',
    bgEnd: '#EA580C',
    tintBg: 'rgba(255, 149, 0, 0.15)',
    iconPath: (
      <g>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'แจ้งปัญหา',
    subtitle: 'พบปัญหาขยะ รายงานได้ทันที',
    actionText: 'ส่งรายงาน',
    badge: null,
    accent: '#FF3B30', // Apple Red
    bgStart: '#F87171',
    bgEnd: '#DC2626',
    tintBg: 'rgba(255, 59, 48, 0.15)',
    iconPath: (
      <g>
        <path d="M3 6h18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="11" x2="10" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="11" x2="14" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'ติดต่อเจ้าหน้าที่',
    subtitle: 'สายตรงเทศบาลเมือง',
    actionText: 'ติดต่อเรา',
    badge: '24 ชม.',
    accent: '#FF2D55', // Apple Pink
    bgStart: '#F472B6',
    bgEnd: '#DB2777',
    tintBg: 'rgba(255, 45, 85, 0.15)',
    iconPath: (
      <g>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
];

export async function GET(req: NextRequest) {
  try {
    // Load Thai fonts
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
            background: '#F2F2F7', // Apple iOS System Grouped Background
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
                  borderRadius: 40,
                  background: '#FFFFFF',
                  border: '4px solid #E5E5EA',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 40,
                  alignItems: 'center',
                }}
              >
                {/* Number Badge (Top Left) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 30,
                    left: 30,
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    background: btn.accent,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 50,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>

                {/* Giant Icon in Center */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 50,
                    width: 320,
                    height: 320,
                    borderRadius: 160,
                    background: btn.tintBg,
                  }}
                >
                  <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke={btn.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {btn.iconPath}
                  </svg>
                </div>

                {/* Title */}
                <div style={{ fontSize: 75, fontWeight: 700, color: '#111111', marginTop: 30 }}>
                  {btn.label}
                </div>
                
                {/* Subtitle */}
                <div style={{ fontSize: 36, color: '#666666', marginTop: 15 }}>
                  {btn.subtitle}
                </div>

                {/* Bottom Full-width Pill Button */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 40,
                    right: 40,
                    background: `linear-gradient(90deg, ${btn.bgStart}, ${btn.bgEnd})`,
                    borderRadius: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                  }}
                >
                  <span style={{ color: 'white', fontSize: 45, fontWeight: 700 }}>{btn.actionText}</span>
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
