import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";

export default async function HouseDashboard({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  
  if (isNaN(houseId)) {
    notFound();
  }

  const [result, houseInvoices] = await Promise.all([
    db.select().from(houses).where(eq(houses.id, houseId)).limit(1),
    db.select().from(invoices).where(eq(invoices.houseId, houseId)).orderBy(asc(invoices.monthYear))
  ]);

  if (result.length === 0) {
    notFound();
  }

  const house = result[0];

  // Deterministic barcode using houseId as seed to prevent SSR/client hydration mismatch
  const generateBarcode = () => {
    return Array.from({ length: 40 }).map((_, i) => {
      const seed = (houseId * 31 + i * 17) % 100;
      const width = seed > 50 ? 'w-1' : 'w-0.5';
      const opacity = seed > 70 ? 'opacity-40' : 'opacity-100';
      return <div key={i} className={`h-full bg-slate-300/30 ${width} ${opacity} mx-[1px]`}></div>
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col items-center relative">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col drop-shadow-2xl">
        {/* TOP SECTION: Identity Stub (Deep Navy) */}
        <div className="bg-slate-900 rounded-t-3xl p-8 sm:p-10 text-white relative overflow-hidden">
          
          {/* Diagonal Watermark (คาดสะพาย) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
             <span className="text-4xl sm:text-5xl font-sans font-bold text-slate-100/5 -rotate-[25deg] whitespace-nowrap tracking-widest scale-125">
               กองสาธารณสุขและสิ่งแวดล้อม
             </span>
          </div>

          {/* Small Logo in Top Right */}
          <div className="absolute top-8 right-8 z-10 opacity-90 drop-shadow-md">
             <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-10 h-10 object-contain" />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="pr-12"> {/* Padding to avoid logo overlap */}
              <p className="text-[10px] font-sans text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง
              </p>
              <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                {house.houseNumber}
              </h1>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">ชื่อเจ้าบ้าน / Owner</p>
                  <p className="font-sans text-lg font-medium text-slate-100">{house.ownerName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">ชุมชน / Zone</p>
                  <p className="font-sans text-sm font-medium text-slate-200">{house.zone || "-"}</p>
                </div>
              </div>
            </div>
            
            {/* Decorative Barcode */}
            <div className="hidden sm:flex h-32 items-center justify-end origin-right opacity-80 mix-blend-screen ml-4 mt-8">
              {generateBarcode()}
            </div>
          </div>
        </div>

        {/* PERFORATION DIVIDER */}
        <div className="relative w-full h-8 bg-slate-50 flex items-center justify-center overflow-hidden -my-1 z-20">
          <svg width="100%" height="32" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="sawtooth" x="0" y="0" width="20" height="32" patternUnits="userSpaceOnUse">
                <path d="M 0,16 L 10,0 L 20,16 L 10,32 Z" fill="#F8FAFC" />
              </pattern>
            </defs>
            <rect width="100%" height="16" y="0" fill="#0F172A" />
            <rect width="100%" height="16" y="16" fill="#FFFFFF" />
            <rect width="100%" height="32" fill="url(#sawtooth)" />
          </svg>
        </div>

        {/* BOTTOM SECTION: Transaction Ledger (White) */}
        <div className="bg-white rounded-b-3xl p-8 sm:p-10 relative shadow-inner">
          <div className="mb-6 flex items-baseline justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">รายการแจ้งหนี้ค่าขยะ</h2>
              <p className="text-xs text-slate-500 mt-1">กำหนดชำระภายในวันที่ 15 ของทุกเดือน</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider">INVOICES</span>
          </div>
          
          <InvoiceSelectionForm invoices={houseInvoices} houseId={houseId} />

          {/* Contact Info Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              กรณีมีข้อสงสัย ติดต่อ <strong>กองสาธารณสุขและสิ่งแวดล้อม</strong><br/>
              โทร: 044-631-419 (เทศบาลเมืองนางรอง)
            </p>
          </div>
        </div>
      </div>
      
      <Link href="/" className="mt-8 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors underline-offset-4 hover:underline relative z-10">
        ← กลับไปหน้าค้นหา
      </Link>
    </div>
  );
}
