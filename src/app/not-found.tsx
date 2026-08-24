import Link from "next/link";
import { Search, Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background radial grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6 relative z-10">
        {/* Municipal Logo */}
        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-xs">
          <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-14 h-14 object-contain" />
        </div>

        {/* 404 Code & Message */}
        <div className="space-y-2">
          <span className="text-xs font-black px-3 py-1 bg-[#EEF0FF] text-[#5B58F2] rounded-full border border-[#D5D9FF] uppercase tracking-wider">
            404 • Not Found
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ลบ หรือคุณอาจพิมพ์ที่อยู่ URL ไม่ถูกต้อง
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#5B58F2] hover:bg-[#4A47D1] text-white text-xs font-bold rounded-xl shadow-md shadow-[#5B58F2]/20 transition-all"
          >
            <Search size={14} />
            <span>ค้นหาบ้าน / ตรวจสอบบิล</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <LayoutDashboard size={14} />
            <span>ระบบจัดการสำหรับเจ้าหน้าที่</span>
          </Link>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
          ระบบจัดเก็บค่าธรรมเนียมขยะมูลฝอย เทศบาลเมืองนางรอง
        </p>
      </div>
    </div>
  );
}