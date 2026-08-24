import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const icons: Record<string, any> = {
  receipt: (
    <g>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8h-6" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 12h-8" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16h-8" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  user: (
    <g>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" fill="none" strokeWidth="2" />
    </g>
  ),
  book: (
    <g>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  alert: (
    <g>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  phone: (
    <g>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  check: (
    <g>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22 4 12 14.01 9 11.01" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  home: (
    <g>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await context.params;
    const { searchParams } = new URL(req.url);
    const colorHex = searchParams.get('color') || '000000';
    const color = `#${colorHex}`;
    
    // Size is fixed to 120x120 for crisp rendering on high-DPI displays (retina)
    const SIZE = 120;
    
    const icon = icons[name] || icons['alert']; // Fallback to alert

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: SIZE - 20,
              height: SIZE - 20,
              borderRadius: (SIZE - 20) / 2,
              background: `${color}15`, 
            }}
          >
            <svg
              width={SIZE - 50}
              height={SIZE - 50}
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
          </div>
        </div>
      ),
      {
        width: SIZE,
        height: SIZE,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
