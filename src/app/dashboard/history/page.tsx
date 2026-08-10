import { History, Info } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-bold text-3xl mb-6 text-white flex items-center gap-2">
        <History className="w-8 h-8 text-emerald-400" />
        ประวัติการรับชำระเงิน
      </h1>
      <div className="receipt-card text-center py-16 border border-white/5 flex flex-col items-center justify-center">
        <History className="w-16 h-16 text-slate-700 mb-3" />
        <p className="font-sans text-slate-300 font-medium">ยังไม่มีประวัติการชำระเงินในระบบ</p>
        <span className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed flex items-center gap-1">
          <Info className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          ระบบจะบันทึกประวัติการรับเงินอัตโนมัติเมื่อได้รับการกดยืนยันสลิป
        </span>
      </div>
    </div>
  );
}
