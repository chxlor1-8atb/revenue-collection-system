import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

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

    // Card dimensions - 3 columns, 2 rows
    const cardW = 780;
    const cardH = 680;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            fontFamily: 'NotoSansThai, sans-serif',
            background: 'linear-gradient(160deg, #0F172A 0%, #0C2D48 35%, #134E4A 70%, #115E59 100%)',
          }}
        >
          {/* ========== HEADER STRIP ========== */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 180,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
            }}
          >
            {/* Logo circle */}
            <div
              style={{
                display: 'flex',
                width: 76,
                height: 76,
                borderRadius: 38,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.5), rgba(14,165,233,0.5))',
                border: '2px solid rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 24,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.5" />
                <path d="M9 22V12h6v10" fill="none" stroke="white" strokeWidth="1.2" />
              </svg>
            </div>

            {/* Header text */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: '#ffffff' }}>
                ระบบจัดเก็บรายได้
              </div>
              <div style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
                เทศบาลเมืองนางรอง
              </div>
            </div>
          </div>

          {/* Gradient accent line */}
          <div
            style={{
              display: 'flex',
              width: '70%',
              height: 3,
              marginLeft: '15%',
              background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(14,165,233,0.6), rgba(139,92,246,0.6), transparent)',
            }}
          />

          {/* ========== TOP ROW ========== */}
          <div style={{ display: 'flex', flex: 1, width: '100%', padding: '30px 50px 15px 50px', gap: 35 }}>

            {/* Button 1: เช็คบิล */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
                  <path d="M14 2v6h6" fill="none" stroke="white" strokeWidth="1.2" />
                  <line x1="16" y1="13" x2="8" y2="13" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <line x1="16" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <circle cx="17" cy="17" r="3.5" fill="rgba(16,185,129,0.6)" stroke="white" strokeWidth="1.2" />
                  <line x1="19.5" y1="19.5" x2="22" y2="22" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>เช็คบิล</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>ตรวจสอบยอดค้างชำระ</div>
            </div>

            {/* Button 2: ใบเสร็จ */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
                  <line x1="8" y1="8" x2="16" y2="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <line x1="8" y1="12" x2="14" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <line x1="8" y1="16" x2="12" y2="16" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <circle cx="18" cy="15" r="4" fill="rgba(14,165,233,0.7)" stroke="white" strokeWidth="1" />
                  <path d="M15.5 15l1.5 1.5 3-3.5" fill="none" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>ใบเสร็จ</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>ประวัติการชำระเงิน</div>
            </div>

            {/* Button 3: ข้อมูลของฉัน */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
                  <path d="M9 22V14h6v8" fill="rgba(139,92,246,0.3)" stroke="white" strokeWidth="1" />
                  <circle cx="12" cy="10" r="2" fill="rgba(255,255,255,0.8)" />
                </svg>
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>ข้อมูลของฉัน</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>ข้อมูลบ้านและบัญชี</div>
            </div>
          </div>

          {/* ========== BOTTOM ROW ========== */}
          <div style={{ display: 'flex', flex: 1, width: '100%', padding: '15px 50px 30px 50px', gap: 35 }}>

            {/* Button 4: วิธีใช้งาน */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M9 21h6" stroke="white" strokeWidth="1.2" />
                  <path d="M10 21v-1a7 7 0 0 1-3.08-4.66A7 7 0 1 1 17 10c0 2.08-.8 3.97-2.5 5.34A3 3 0 0 0 14 17v1" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
                  <path d="M10 17h4" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" />
                  <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" />
                </svg>
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>วิธีใช้งาน</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>คู่มือการใช้บริการ</div>
            </div>

            {/* Button 5: แจ้งปัญหา */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M18 8a6 6 0 0 1 0 8" fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="1.2" />
                  <path d="M20 5a10 10 0 0 1 0 14" fill="none" stroke="rgba(249,115,22,0.4)" strokeWidth="1" />
                  <path d="M2 11v2a2 2 0 0 0 2 2h1l4 5V4L5 9H4a2 2 0 0 0-2 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.2" />
                  <path d="M15 18l2-3.5 2 3.5z" fill="rgba(249,115,22,0.7)" stroke="white" strokeWidth="0.8" />
                </svg>
              </div>
              <div style={{ fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>แจ้งปัญหา</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>รายงานปัญหาขยะ</div>
            </div>

            {/* Button 6: ติดต่อเจ้าหน้าที่ */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 36,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 150,
                  height: 150,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="none" stroke="white" strokeWidth="1.2" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" fill="rgba(236,72,153,0.4)" stroke="white" strokeWidth="1" />
                  <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="rgba(236,72,153,0.4)" stroke="white" strokeWidth="1" />
                  <circle cx="12" cy="13" r="3.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
                  <circle cx="10.5" cy="12" r="0.5" fill="white" />
                  <circle cx="13.5" cy="12" r="0.5" fill="white" />
                  <path d="M10 14.5a2.5 2.5 0 0 0 4 0" fill="none" stroke="white" strokeWidth="0.8" />
                </svg>
              </div>
              <div style={{ fontSize: 60, fontWeight: 700, color: '#ffffff', marginTop: 26 }}>ติดต่อเจ้าหน้าที่</div>
              <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>สายตรงเทศบาล</div>
            </div>
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
