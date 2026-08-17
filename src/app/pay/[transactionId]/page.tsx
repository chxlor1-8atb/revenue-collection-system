import { db } from "@/lib/db";
import { systemSettings, transactions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";
import CountdownTimer from "@/components/CountdownTimer";

export default async function PayPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const transactionId = parseInt((await params).transactionId, 10);
  
  if (isNaN(transactionId)) {
    redirect("/");
  }

  // Find the pending transaction
  const result = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);

  if (result.length === 0) {
    notFound();
  }

  const tx = result[0];
  const settings = await db.select().from(systemSettings).limit(1);
  const system = settings[0];

  // If transaction is already verified → redirect to success page
  if (tx.slipStatus === "verified") {
    redirect(`/pay/${transactionId}/success`);
  }
  
  // If transaction is rejected → redirect back to house page (can't reuse a rejected transaction)
  if (tx.slipStatus === "rejected" || tx.slipStatus === "expired") {
    redirect("/");
  }

  const totalAmount = parseFloat(tx.amount || "0");

  let qrDataUri = "";
  if (system?.qrCodeImageUrl) {
    qrDataUri = system.qrCodeImageUrl;
  } else if (system?.promptPayId) {
    const payload = generatePayload(system.promptPayId, { amount: totalAmount });
    qrDataUri = await qrcode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#0F172A', // Deep Navy for the QR code
        light: '#ffffff'
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          
          {/* Top Info Banner */}
          <div className="bg-slate-900 px-6 py-3 flex justify-center items-center text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium tracking-widest uppercase text-slate-300">SECURE PAYMENT</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 flex flex-col items-center">
            
            <div className="mb-8 text-center">
              <p className="font-sans text-sm font-semibold text-slate-400 tracking-widest uppercase mb-2">ยอดชำระสุทธิ</p>
              <h1 className="font-mono text-5xl font-bold text-slate-900 tracking-tighter flex items-end justify-center gap-1">
                ฿{Math.floor(totalAmount)}
              </h1>
              <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-3 font-medium">
                กรุณาโอนเงินตามยอดที่แสดง
              </p>
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

            {tx.createdAt && (
              (() => {
                const now = new Date();
                const expiryTime = new Date(tx.createdAt.getTime() + 3 * 60000);
                const difference = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
                const initialTimeLeft = difference > 0 ? difference : 0;
                return <CountdownTimer initialTimeLeft={initialTimeLeft} transactionId={transactionId} />;
              })()
            )}

            <div className="w-full text-center mb-8 mt-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-1">โอนเงินเข้าบัญชี</p>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{system?.accountName || "เทศบาลเมืองนางรอง"}</h3>
              <p className="text-slate-500 font-medium">พร้อมเพย์: {system?.promptPayId || "-"}</p>
            </div>

            <div className="w-full text-center">
              <a 
                href={process.env.NEXT_PUBLIC_LINE_BOT_URL || "https://line.me/R/ti/p/@618apcbm"}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-sans font-semibold py-4 px-6 rounded-xl shadow-lg shadow-[#06C755]/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                <span>คลิกเพื่อส่งสลิปผ่านทาง LINE</span>
              </a>
              <p className="mt-4 text-xs font-sans text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                โอนเสร็จแล้วกดปุ่มสีเขียวเพื่อส่งสลิปเข้าไปในแชท LINE<br/>ระบบจะตรวจสอบสลิปและตัดหนี้ <b>{Math.floor(totalAmount)} บาท</b> ให้อัตโนมัติ!
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
