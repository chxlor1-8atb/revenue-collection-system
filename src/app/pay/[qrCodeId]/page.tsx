import { db } from "@/lib/db";
import { qrCodes, collectors } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";
import SlipUploadForm from "@/components/SlipUploadForm";

export default async function PayPage({ params, searchParams }: { params: Promise<{ qrCodeId: string }>, searchParams: Promise<{ invoices?: string }> }) {
  const qrCodeId = parseInt((await params).qrCodeId, 10);
  const sp = await searchParams;
  const invoiceIdsStr = sp.invoices;
  
  if (isNaN(qrCodeId) || !invoiceIdsStr) {
    redirect("/");
  }

  const invoiceIds = invoiceIdsStr.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  
  if (invoiceIds.length === 0) {
    redirect("/");
  }

  const result = await db
    .select({
      qrCode: qrCodes,
      collector: collectors,
    })
    .from(qrCodes)
    .innerJoin(collectors, eq(qrCodes.collectorId, collectors.id))
    .where(eq(qrCodes.id, qrCodeId))
    .limit(1);

  if (result.length === 0 || !result[0].qrCode.active) {
    notFound();
  }

  const { collector } = result[0];

  const { invoices } = await import("@/lib/schema");
  const selectedInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
  
  if (selectedInvoices.length === 0) {
    redirect("/");
  }

  const totalAmount = selectedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const payload = generatePayload(collector.promptPayId, { amount: totalAmount });
  
  const qrDataUri = await qrcode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    color: {
      dark: '#0F172A', // Deep Navy for the QR code
      light: '#ffffff'
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          
          {/* Top Info Banner - The Book Number Badge */}
          <div className="bg-slate-900 px-6 py-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium tracking-widest uppercase text-slate-300">SECURE PAYMENT</span>
            </div>
            <div className="font-mono text-sm border border-slate-700 bg-slate-800 px-3 py-1 rounded-md shadow-inner text-emerald-400">
              เล่มที่ ๐๑/๒๕๖๙
            </div>
          </div>

          <div className="p-8 sm:p-10 flex flex-col items-center">
            
            <div className="mb-8 text-center">
              <p className="font-sans text-sm font-semibold text-slate-400 tracking-widest uppercase mb-2">ยอดชำระสุทธิ</p>
              <h1 className="font-mono text-5xl font-bold text-slate-900 tracking-tighter">
                ฿{totalAmount.toFixed(2)}
              </h1>
            </div>

            {/* QR Code Frame */}
            <div className="relative p-1 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                <img src={qrDataUri} alt="PromptPay QR Code" className="w-56 h-56 object-contain" />
              </div>
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-2xl"></div>
            </div>

            <div className="w-full text-center mb-8 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-1">โอนเงินเข้าบัญชี</p>
              <p className="font-sans font-semibold text-slate-900">{collector.name}</p>
              <p className="font-mono text-sm text-emerald-600 font-medium">PromptPay: {collector.promptPayId}</p>
            </div>

            <div className="w-full h-px bg-slate-100 mb-8 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                แนบหลักฐาน
              </div>
            </div>

            <div className="w-full">
              <SlipUploadForm qrCodeId={qrCodeId.toString()} invoiceIds={invoiceIdsStr} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
