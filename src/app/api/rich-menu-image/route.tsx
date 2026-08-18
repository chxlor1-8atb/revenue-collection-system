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
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
          }}
        >
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
            <div style={{ fontSize: 120, fontWeight: 700, marginTop: 20 }}>
              ใบเสร็จ
            </div>
          </div>
        </div>
      ),
      {
        width: 2500,
        height: 843,
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
