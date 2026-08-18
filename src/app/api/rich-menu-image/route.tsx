import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const fontUrl = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf';
    let fontData = null;
    try {
      const res = await fetch(fontUrl);
      fontData = await res.arrayBuffer();
    } catch (e) {
      console.error('Failed to load font', e);
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Top Row */}
          <div style={{ display: 'flex', flex: 1, width: '100%' }}>
            {/* 1. Check Bill */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#059669', // Emerald 600
                color: 'white',
                borderRight: '4px solid #047857',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>เช็คบิล</div>
            </div>

            {/* 2. Receipt */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0ea5e9', // Sky 500
                color: 'white',
                borderRight: '4px solid #0284c7',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />
                <path d="M14 2v5h5" />
                <path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>ใบเสร็จ</div>
            </div>

            {/* 3. My House */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#8b5cf6', // Violet 500
                color: 'white',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>ข้อมูลบ้าน</div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'flex', flex: 1, width: '100%' }}>
            {/* 4. How to Use */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f59e0b', // Amber 500
                color: 'white',
                borderRight: '4px solid #d97706',
                borderTop: '4px solid #d97706',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>วิธีใช้งาน</div>
            </div>

            {/* 5. Report Issue */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ef4444', // Red 500
                color: 'white',
                borderRight: '4px solid #dc2626',
                borderTop: '4px solid #dc2626',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>แจ้งปัญหา</div>
            </div>

            {/* 6. Contact Admin */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ec4899', // Pink 500
                color: 'white',
                borderTop: '4px solid #db2777',
              }}
            >
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '30px' }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div style={{ fontSize: 90, fontWeight: 700, marginTop: 10 }}>ติดต่อแอดมิน</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 2500,
        height: 1686,
        fonts: fontData
          ? [
              {
                name: 'NotoSansThai',
                data: fontData,
                style: 'normal',
                weight: 700,
              },
            ]
          : undefined,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
