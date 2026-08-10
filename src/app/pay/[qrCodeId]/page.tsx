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
      dark: '#1F2E22', // Ink green from our palette
      light: '#ffffff'
    }
  });

  return (
    <div className="min-h-screen p-4 flex flex-col items-center py-12">
      <div className="receipt-card max-w-md w-full relative">
        {/* Decorative slip corner */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-[#F6F4EC] border-l border-b border-[#D8D3C3] -mt-1 -mr-1 transform rotate-45"></div>

        <div className="text-center mb-6 flex flex-col items-center">
          <img src="/nangrong-logo.png" alt="ตราสัญลักษณ์เทศบาลเมืองนางรอง" style={{ width: "4rem", height: "4rem", objectFit: "contain", marginBottom: "0.5rem" }} />
          <h1 className="font-serif text-2xl font-bold mb-1">เทศบาลเมืองนางรอง</h1>
          <p className="font-sans text-sm text-status-dark">ระบบจัดเก็บรายได้ออนไลน์</p>
        </div>
        
        <div className="perforation-line"></div>

        <div className="my-6 flex flex-col items-center">
          <p className="font-serif font-bold text-lg mb-2">สแกนเพื่อชำระเงิน</p>
          <div className="p-2 bg-white border border-[#D8D3C3] shadow-sm rounded-sm mb-4 inline-block">
            <img src={qrDataUri} alt="PromptPay QR Code" className="w-48 h-48" />
          </div>
          
          <div className="text-center font-mono text-sm space-y-1 mt-2">
            <p className="font-sans font-semibold">ชื่อผู้รับเงิน: <span className="font-mono">{collector.name}</span></p>
            <p className="text-gray-600">PromptPay: {collector.promptPayId}</p>
          </div>
        </div>

        <SlipUploadForm qrCodeId={qrCodeId.toString()} invoiceIds={invoiceIdsStr} />
      </div>
    </div>
  );
}
