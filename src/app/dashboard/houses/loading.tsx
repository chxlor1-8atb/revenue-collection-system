import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-[#C9A227] rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Loader2 size={48} className="animate-spin text-[#1F2E22] relative z-10" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-[#1F2E22] font-semibold text-lg tracking-wide animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
      <p className="text-slate-400 text-sm mt-1 font-sans">
        กรุณารอสักครู่
      </p>
    </div>
  );
}
