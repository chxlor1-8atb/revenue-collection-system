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
          {/* Left Button - Check Bill */}
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
            <svg
              width="200"
              height="200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: '40px' }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div style={{ fontSize: 120, fontWeight: 700, marginTop: 20 }}>
              เช็คบิล
            </div>
          </div>

          {/* Right Button - Receipt */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0ea5e9', // Sky 500
              color: 'white',
            }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: '40px' }}
            >
              <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />
              <path d="M14 2v5h5" />
              <path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" />
            </svg>
            <div style={{ fontSize: 100, fontWeight: 700, marginTop: 20 }}>
              ใบเสร็จ
            </div>
          </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'flex', flex: 1, width: '100%' }}>
            {/* Bottom Left - How to Use */}
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
              <svg
                width="160"
                height="160"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '40px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div style={{ fontSize: 100, fontWeight: 700, marginTop: 20 }}>
                วิธีใช้งาน
              </div>
            </div>

            {/* Bottom Right - Report Issue */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ef4444', // Red 500
                color: 'white',
                borderTop: '4px solid #dc2626',
              }}
            >
              <svg
                width="160"
                height="160"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '40px' }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ fontSize: 100, fontWeight: 700, marginTop: 20 }}>
                แจ้งปัญหา
              </div>
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
