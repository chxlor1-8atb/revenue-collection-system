import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Lucide icons
const icons = {
  bill: (
    <g>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="10 9 9 9 8 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  receipt: (
    <g>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 12h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  user: (
    <g>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  book: (
    <g>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  alert: (
    <g>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  phone: (
    <g>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
};

export async function GET(req: NextRequest) {
  try {
    const W = 2500;
    const H = 1686;
    
    // Grid gap & padding
    const GAP = 24;
    const P = 32; // Outer padding
    
    // Row heights
    const R1_H = (H - GAP - P * 2) / 2; 
    const R2_H = R1_H;
    
    // Col widths
    const R1_W_TOTAL = W - P * 2 - GAP;
    const R1_ITEM1_W = Math.floor((R1_W_TOTAL * 2) / 3);
    const R1_ITEM2_W = R1_W_TOTAL - R1_ITEM1_W;
    
    const R2_W_TOTAL = W - P * 2 - GAP * 3;
    const R2_ITEM_W = Math.floor(R2_W_TOTAL / 4);

    const baseUrl = req.nextUrl.origin;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#000000', // Black background to contrast the beautiful images
            padding: `${P}px`,
            gap: `${GAP}px`,
          }}
        >
          {/* ROW 1 */}
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: R1_H, gap: `${GAP}px` }}>
            
            {/* ITEM 1: Check Bill */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: R1_ITEM1_W,
                height: '100%',
                borderRadius: '48px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <img src={`${baseUrl}/bento/bg_green.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '64px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', marginBottom: '24px' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24">{icons.bill}</svg>
                </div>
                <div style={{ fontSize: '100px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  เช็คบิลค่าขยะ
                </div>
                <div style={{ fontSize: '48px', color: 'rgba(255,255,255,0.9)', marginTop: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  ตรวจสอบยอดและชำระเงิน
                </div>
                
                <div style={{ display: 'flex', marginTop: 'auto' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '24px 48px', borderRadius: '100px', fontSize: '40px', fontWeight: 'bold', display: 'flex', alignItems: 'center', border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
                    กดที่นี่เพื่อเริ่มต้น
                    <svg style={{ marginLeft: '16px' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ITEM 2: Receipt */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: R1_ITEM2_W,
                height: '100%',
                borderRadius: '48px',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <img src={`${baseUrl}/bento/bg_blue.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '64px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', color: '#ffffff' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24">{icons.receipt}</svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '72px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1.1, textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                    ใบเสร็จ
                  </div>
                  <div style={{ fontSize: '40px', color: 'rgba(255,255,255,0.9)', marginTop: '12px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    ประวัติชำระเงิน
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* ROW 2 */}
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: R2_H, gap: `${GAP}px` }}>
            
            {/* ITEM 3: My Info */}
            <div style={{ display: 'flex', flexDirection: 'column', width: R2_ITEM_W, height: '100%', borderRadius: '48px', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <img src={`${baseUrl}/bento/bg_purple.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '70px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: '#ffffff', marginBottom: '32px' }}>
                  <svg width="70" height="70" viewBox="0 0 24 24">{icons.user}</svg>
                </div>
                <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>ข้อมูลของฉัน</div>
                <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.9)', marginTop: '12px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>แก้ไขบ้านเลขที่</div>
              </div>
            </div>

            {/* ITEM 4: How to use */}
            <div style={{ display: 'flex', flexDirection: 'column', width: R2_ITEM_W, height: '100%', borderRadius: '48px', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <img src={`${baseUrl}/bento/bg_orange.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '70px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: '#ffffff', marginBottom: '32px' }}>
                  <svg width="70" height="70" viewBox="0 0 24 24">{icons.book}</svg>
                </div>
                <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>วิธีใช้งาน</div>
                <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.9)', marginTop: '12px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>ขั้นตอนจ่ายเงิน</div>
              </div>
            </div>

            {/* ITEM 5: Report */}
            <div style={{ display: 'flex', flexDirection: 'column', width: R2_ITEM_W, height: '100%', borderRadius: '48px', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <img src={`${baseUrl}/bento/bg_red.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '70px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: '#ffffff', marginBottom: '32px' }}>
                  <svg width="70" height="70" viewBox="0 0 24 24">{icons.alert}</svg>
                </div>
                <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>แจ้งปัญหา</div>
                <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.9)', marginTop: '12px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>ขยะตกค้าง</div>
              </div>
            </div>

            {/* ITEM 6: Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', width: R2_ITEM_W, height: '100%', borderRadius: '48px', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <img src={`${baseUrl}/bento/bg_lightblue.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '70px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: '#ffffff', marginBottom: '32px' }}>
                  <svg width="70" height="70" viewBox="0 0 24 24">{icons.phone}</svg>
                </div>
                <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>ติดต่อเรา</div>
                <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.9)', marginTop: '12px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>เจ้าหน้าที่เทศบาล</div>
              </div>
            </div>
            
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
