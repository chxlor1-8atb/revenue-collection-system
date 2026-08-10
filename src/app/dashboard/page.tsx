import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, DollarSign, ShieldAlert, Award } from "lucide-react";

export default async function DashboardPage() {
  return (
    <div className="space-y-6 font-sans">
      <h1 className="font-serif font-bold text-3xl text-slate-800 flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-teal-600" />
        ภาพรวมระบบ (Overview)
      </h1>
      
      {/* Mock Analytics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="card bg-white border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">ยอดจัดเก็บวันนี้</p>
            <p className="text-2xl font-bold font-mono text-slate-800 mt-1">฿3,840.00</p>
            <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12% จากสัปดาห์ก่อน
            </span>
          </div>
          <div className="p-2.5 bg-teal-50 rounded-lg">
            <DollarSign className="w-5.5 h-5.5 text-teal-600" />
          </div>
        </div>

        <div className="card bg-white border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">บิลรอการตรวจสอบ</p>
            <p className="text-2xl font-bold font-mono text-slate-800 mt-1">12 รายการ</p>
            <span className="text-[10px] text-slate-500 mt-1 block">ต้องยืนยันความถูกต้องสลิป</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg">
            <ShieldAlert className="w-5.5 h-5.5 text-amber-600" />
          </div>
        </div>

        <div className="card bg-white border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">อัตราจัดเก็บสำเร็จ</p>
            <p className="text-2xl font-bold font-mono text-slate-800 mt-1">94.2%</p>
            <span className="text-[10px] text-sky-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> เพิ่มขึ้นจากงวดแรก
            </span>
          </div>
          <div className="p-2.5 bg-sky-50 rounded-lg">
            <Award className="w-5.5 h-5.5 text-sky-600" />
          </div>
        </div>
      </div>

      <div className="receipt-card border border-slate-200 bg-white shadow-sm p-6 rounded-xl">
        <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-teal-600" />
          รายงานรายได้สะสม
        </h2>
        <div className="perforation-line"></div>
        <div className="py-12 text-center text-slate-400 text-xs font-sans flex flex-col items-center justify-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mb-2.5" />
          <p className="font-medium text-slate-600">สถิติยอดเก็บสะสมขยะมูลฝอยของเทศบาลเมืองนางรอง</p>
          <span className="text-[10px] text-slate-400 mt-1">ฐานข้อมูลและระบบการรายงานผลอยู่ระหว่างขั้นตอนเตรียมวิเคราะห์</span>
        </div>
      </div>
    </div>
  );
}
