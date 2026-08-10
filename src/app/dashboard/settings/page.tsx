import { Settings, Info } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-bold text-3xl mb-6 text-white flex items-center gap-2">
        <Settings className="w-8 h-8 text-emerald-400" />
        ตั้งค่าระบบ
      </h1>
      <div className="receipt-card text-center py-16 border border-white/5 flex flex-col items-center justify-center">
        <Settings className="w-16 h-16 text-slate-700 mb-3" />
        <p className="font-sans text-slate-300 font-medium">ตั้งค่าระบบจัดเก็บรายได้</p>
        <span className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed flex items-center gap-1">
          <Info className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          การตั้งค่าอัตราภาษี ค่าธรรมเนียม และรายละเอียดหน่วยงาน อยู่ในขั้นตอนทดสอบสิทธิ์แอดมินระดับสูง
        </span>
      </div>
    </div>
  );
}
