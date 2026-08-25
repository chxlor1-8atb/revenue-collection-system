import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, inArray, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function HouseDashboard({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  
  if (isNaN(houseId)) {
    notFound();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result, houseInvoices, recentTransactions] = await Promise.all([
    db.select().from(houses).where(eq(houses.id, houseId)).limit(1),
    db.select().from(invoices).where(eq(invoices.houseId, houseId)).orderBy(asc(invoices.monthYear)),
    db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      verifiedBy: transactions.verifiedBy,
      slipStatus: transactions.slipStatus,
    })
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'verified'),
          sql`EXISTS (SELECT 1 FROM ${invoices} WHERE ${invoices.transactionId} = ${transactions.id} AND ${invoices.houseId} = ${houseId})`,
          gte(transactions.paidAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(transactions.paidAt))
      .limit(10)
  ]);

  if (result.length === 0) {
    notFound();
  }

  const house = result[0];

  const formatThaiDate = (date: Date) => {
    if (!date) return "";
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  };

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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-center gap-12 lg:gap-24 relative overflow-hidden">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Decorative gradient blur for desktop */}
      <div className="hidden lg:block absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0"></div>

      {/* Desktop Branding Left Column */}
      <div className="hidden lg:flex flex-col max-w-md relative z-10">
        <div className="bg-white/80 p-4 rounded-3xl shadow-sm border border-slate-100 w-fit mb-8 backdrop-blur-sm">
          <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-5xl font-sans font-bold text-slate-900 tracking-tight leading-[1.15] mb-6">
          ตรวจสอบและ<br/><span className="text-[#5B58F2]">ชำระค่าธรรมเนียมขยะ</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 leading-relaxed">
          เทศบาลเมืองนางรองอำนวยความสะดวกในการตรวจสอบยอดค้างชำระและชำระเงินผ่าน QR Code ได้ทันที ปลอดภัยและรวดเร็ว
        </p>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700 bg-white/60 px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm w-fit">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          อัปเดตข้อมูลแบบเรียลไทม์
        </div>
        
        <Link href="/" className="mt-12 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors underline-offset-4 hover:underline flex items-center gap-2 w-fit">
          ← กลับไปหน้าค้นหา
        </Link>
      </div>

      {/* The Ticket (Right side on desktop, centered on mobile) */}
      <div className="w-full max-w-lg relative z-10 flex flex-col drop-shadow-2xl lg:hover:-translate-y-2 transition-transform duration-500">
        {/* TOP SECTION: Identity Stub (Deep Navy) */}
        <div className="bg-slate-900 rounded-t-3xl p-8 sm:p-10 text-white relative overflow-hidden">
          
          {/* Diagonal Watermark (คาดสะพาย) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
             <span className="text-4xl sm:text-5xl font-sans font-bold text-slate-100/5 -rotate-[25deg] whitespace-nowrap tracking-widest scale-125">
               กองสาธารณสุขและสิ่งแวดล้อม
             </span>
          </div>

          {/* Small Logo in Top Right (Mobile only, hidden on Desktop since it's in left col) */}
          <div className="lg:hidden absolute top-8 right-8 z-10 opacity-90 drop-shadow-md">
             <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-10 h-10 object-contain" />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="pr-12 lg:pr-0"> {/* Padding to avoid logo overlap on mobile */}
              <p className="text-[length:10px] font-sans text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง
              </p>
              <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                {house.houseNumber}
              </h1>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[length:10px] text-slate-500 uppercase tracking-widest font-semibold">ชื่อเจ้าบ้าน / Owner</p>
                  <p className="font-sans text-lg font-medium text-slate-100">{house.ownerName}</p>
                </div>
                <div>
                  <p className="text-[length:10px] text-slate-500 uppercase tracking-widest font-semibold">ชุมชน / Zone</p>
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
              <h2 className="text-xl font-bold text-slate-900">รายการค่าธรรมเนียมเก็บขนมูลฝอย</h2>
              <p className="text-xs text-slate-500 mt-1">กำหนดชำระภายในวันที่ 15 ของทุกเดือน</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider">INVOICES</span>
          </div>
          {parseFloat(house.walletBalance || "0") > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-lg font-bold">
                  ??
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">�ʹ�Թ㹡����� (������ǧ˹��)</p>
                  <p className="text-xs text-emerald-600">�ж١����ѡź�ѵ��ѵ�������պ���ͺ����</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-emerald-600">
                  �{parseFloat(house.walletBalance || "0").toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
          <InvoiceSelectionForm invoices={houseInvoices} house={house} />
          
          {recentTransactions.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ประวัติการชำระเงิน (30 วันล่าสุด)
                </h3>
              </div>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {formatThaiDate(new Date(tx.paidAt || tx.createdAt || new Date()))}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ผ่าน {tx.verifiedBy === 'line_bot_auto' ? 'ระบบอัตโนมัติ' : tx.verifiedBy === 'line_bot' ? 'LINE Bot' : 'เจ้าหน้าที่'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-600">
                        +{parseFloat(tx.amount || "0").toFixed(2)} ฿
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              กรณีมีข้อสงสัย ติดต่อ <strong>กองสาธารณสุขและสิ่งแวดล้อม</strong><br/>
              โทร: 044-631-419 (เทศบาลเมืองนางรอง)
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile return link */}
      <Link href="/" className="lg:hidden mt-8 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors underline-offset-4 hover:underline relative z-10">
        ← กลับไปหน้าค้นหา
      </Link>
    </div>
  );
}
