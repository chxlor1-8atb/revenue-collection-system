import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const menuButtons = [
  {
    label: 'เช็คบิล',
    subtitle: 'ตรวจสอบยอดค้างชำระ',
    actionText: 'ดูบิลของฉัน',
    bgStart: '#22c55e',
    bgEnd: '#15803d',
    btnBg: '#ffffff',
    btnColor: '#15803d',
    iconPath: (
      <g>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10" y1="9" x2="8" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ใบเสร็จ',
    subtitle: 'ประวัติการชำระเงิน',
    actionText: 'ดูใบเสร็จ',
    bgStart: '#3b82f6',
    bgEnd: '#1d4ed8',
    btnBg: '#ffffff',
    btnColor: '#1d4ed8',
    iconPath: (
      <g>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8h-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 12h-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 16h-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ข้อมูลของฉัน',
    subtitle: 'ข้อมูลบ้านและบัญชี',
    actionText: 'จัดการบัญชี',
    bgStart: '#a855f7',
    bgEnd: '#7e22ce',
    btnBg: '#ffffff',
    btnColor: '#7e22ce',
    iconPath: (
      <g>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" fill="none" stroke="white" strokeWidth="1.8" />
      </g>
    ),
  },
  {
    label: 'วิธีใช้งาน',
    subtitle: 'คู่มือและขั้นตอน',
    actionText: 'อ่านคู่มือ',
    bgStart: '#f97316',
    bgEnd: '#c2410c',
    btnBg: '#ffffff',
    btnColor: '#c2410c',
    iconPath: (
      <g>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    label: 'แจ้งปัญหา',
    subtitle: 'รายงานปัญหาขยะ',
    actionText: 'ส่งรายงาน',
    bgStart: '#ef4444',
    bgEnd: '#b91c1c',
    btnBg: '#ffffff',
    btnColor: '#b91c1c',
    iconPath: (
      <g>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  },
  {
    label: 'ติดต่อ',
    subtitle: 'สายตรงเจ้าหน้าที่',
    actionText: 'แชทเลย',
    bgStart: '#06b6d4',
    bgEnd: '#0e7490',
    btnBg: '#ffffff',
    btnColor: '#0e7490',
    iconPath: (
      <g>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
    
    // Grid settings — tight gaps like the reference
    const PADDING_X = 30;
    const PADDING_Y = 30;
    const GAP = 24;
    const COLS = 3;
    const ROWS = 2;
    
    const cardW = Math.floor((W - (PADDING_X * 2) - (GAP * (COLS - 1))) / COLS);
    const cardH = Math.floor((H - (PADDING_Y * 2) - (GAP * (ROWS - 1))) / ROWS);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            fontFamily: 'NotoSansThai, sans-serif',
            background: 'linear-gradient(180deg, #1e293b, #0f172a)',
          }}
        >
          {/* GRID */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              paddingLeft: PADDING_X,
              paddingRight: PADDING_X,
              paddingTop: PADDING_Y,
              paddingBottom: PADDING_Y,
              gap: GAP,
              width: '100%',
              height: '100%',
            }}
          >
            {menuButtons.map((btn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: cardW,
                  height: cardH,
                  borderRadius: 40,
                  background: `linear-gradient(135deg, ${btn.bgStart}, ${btn.bgEnd})`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* LEFT SIDE: Number + Text + Button */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '45px 0 45px 45px',
                    flex: 1,
                  }}
                >
                  {/* Number Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      background: 'rgba(255,255,255,0.3)',
                      fontSize: 48,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Title & Subtitle */}
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
                    <div style={{ fontSize: 80, fontWeight: 700, color: 'white' }}>
                      {btn.label}
                    </div>
                    <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
                      {btn.subtitle}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                      background: btn.btnBg,
                      padding: '20px 50px',
                      borderRadius: 100,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 40, fontWeight: 700, color: btn.btnColor }}>
                      {btn.actionText}
                    </span>
                  </div>
                </div>

                {/* RIGHT SIDE: Big Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 300,
                    paddingRight: 30,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 260,
                      height: 260,
                      borderRadius: 130,
                      background: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {btn.iconPath}
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
