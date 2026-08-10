import { db } from "@/lib/db";
import { qrCodes, collectors } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";
import SlipUploadForm from "@/components/SlipUploadForm";
import { CreditCard, ShieldCheck } from "lucide-react";

export default async function PayPage({ params, searchParams }: { params: Promise<{ qrCodeId: string }>, searchParams: Promise<{ invoices?: string }> }) {
  const qrCodeId = parseInt((await params).qrCodeId, 10);
  const sp = await searchParams;
  const invoiceIdsStr = sp.invoices;
  
  if (isNaN(qrCodeId) || !invoiceIdsStr) {
    // We need invoices to pay for! If not provided, redirect to home.
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

  // Fetch invoices to verify they exist and get the total amount
  const { invoices } = await import("@/lib/schema");
  const selectedInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
  
  if (selectedInvoices.length === 0) {
    redirect("/");
  }

  // Calculate total amount
  const totalAmount = selectedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  // Generate PromptPay QR Data (payload) with exact total amount
  const payload = generatePayload(collector.promptPayId, { amount: totalAmount });
  
  // Generate Data URI for the QR Code image
  const qrDataUri = await qrcode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    color: {
      dark: '#0f172a', // Ink dark navy
      light: '#ffffff'
    }
  });

  return (
    <div className="min-h-screen p-4 flex flex-col items-center py-10 justify-center bg-slate-50 relative overflow-hidden">
      <div className="receipt-card max-w-sm w-full relative border border-slate-200 shadow-md bg-white p-6 rounded-xl">
        <div className="text-center mb-5 flex flex-col items-center">
          <img 
            src="/nangrong-logo.png" 
            alt="ตราสัญลักษณ์เทศบาลเมืองนางรอง" 
            className="w-16 h-16 object-contain mb-2" 
          />
          <h1 className="font-serif text-xl font-bold text-slate-800">ชำระเงินออนไลน์</h1>
          <p className="font-sans text-[10px] text-teal-600 font-semibold tracking-wide uppercase mt-0.5">
            เทศบาลเมืองนางรอง
          </p>
        </div>
        
        <div className="perforation-line"></div>

        <div className="my-5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-4 bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>สแกน QR Code ชำระเงิน</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg mb-4 inline-block">
            <img src={qrDataUri} alt="PromptPay QR Code" className="w-44 h-44 rounded" />
          </div>
          
          <div className="text-left font-sans text-xs space-y-2 mt-2 bg-slate-50 border border-slate-100 p-3 rounded-lg w-full">
            <div className="flex justify-between items-center text-slate-500">
              <span>บัญชีผู้รับเงิน:</span>
              <span className="font-semibold text-slate-800">{collector.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>พร้อมเพย์ (PromptPay):</span>
              <span className="font-mono text-slate-800 font-semibold">{collector.promptPayId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 border-t border-slate-200/60 pt-2 mt-1.5 font-bold">
              <span className="text-slate-700">ยอดเงินที่ต้องชำระ:</span>
              <span className="font-mono text-teal-600 text-base">฿{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <SlipUploadForm qrCodeId={qrCodeId.toString()} invoiceIds={invoiceIdsStr} />
      </div>
      
      <a href="/" className="mt-6 text-xs text-slate-500 hover:text-teal-600 transition-colors underline font-sans flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        กลับไปหน้าหลักค้นหาข้อมูล
      </a>
    </div>
  );
}
