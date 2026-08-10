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

  const result = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);

  if (result.length === 0) {
    notFound();
  }

  const house = result[0];

  const houseInvoices = await db.select()
    .from(invoices)
    .where(eq(invoices.houseId, houseId))
    .orderBy(asc(invoices.monthYear));

  // A simple function to generate a fake "barcode" pattern
  const generateBarcode = () => {
    return Array.from({ length: 40 }).map((_, i) => {
      const width = Math.random() > 0.5 ? 'w-1' : 'w-0.5';
      const opacity = Math.random() > 0.7 ? 'opacity-40' : 'opacity-100';
      return <div key={i} className={`h-full bg-slate-300/30 ${width} ${opacity} mx-[1px]`}></div>
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col items-center">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col drop-shadow-2xl">
        {/* TOP SECTION: Identity Stub (Deep Navy) */}
        <div className="bg-slate-900 rounded-t-3xl p-8 sm:p-10 text-white relative overflow-hidden">
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-sans text-slate-400 uppercase tracking-widest mb-1">เลขประจำบ้าน / House No.</p>
              <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                {house.houseNumber}
              </h1>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">ชื่อเจ้าบ้าน / Owner</p>
                  <p className="font-sans text-lg font-medium text-slate-100">{house.ownerName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">ชุมชน / Zone</p>
                  <p className="font-sans text-sm font-medium text-slate-200">{house.zone || "-"}</p>
                </div>
              </div>
            </div>
            
            {/* Decorative Barcode */}
            <div className="h-32 flex items-center justify-end rotate-90 sm:rotate-0 origin-right opacity-80 mix-blend-screen ml-4">
              {generateBarcode()}
            </div>
          </div>
          
          {/* "Watermark" Logo large */}
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
             <img src="/nangrong-logo.png" alt="" className="w-64 h-64 grayscale" />
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
            {/* The navy background behind the cutouts */}
            <rect width="100%" height="16" y="0" fill="#0F172A" />
            {/* The white background behind the cutouts below */}
            <rect width="100%" height="16" y="16" fill="#FFFFFF" />
            {/* The actual sawtooth pattern colored the same as the body background (slate-50) */}
            <rect width="100%" height="32" fill="url(#sawtooth)" />
          </svg>
        </div>

        {/* BOTTOM SECTION: Transaction Ledger (White) */}
        <div className="bg-white rounded-b-3xl p-8 sm:p-10 relative shadow-inner">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">รายการค้างชำระ</h2>
            <span className="text-xs font-semibold text-slate-400 tracking-wider">INVOICES</span>
          </div>
          
          <InvoiceSelectionForm invoices={houseInvoices} houseId={houseId} />
        </div>
      </div>
      
      <Link href="/" className="mt-8 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors underline-offset-4 hover:underline relative z-10">
        ← กลับไปหน้าค้นหา
      </Link>
    </div>
  );
}
