import { Loader2 } from "lucide-react";

export default function BlobLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-[#5B58F2] rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Loader2 size={44} className="animate-spin text-[#5B58F2] relative z-10" strokeWidth={2} />
      </div>
      <p className="mt-4 text-slate-700 font-bold text-base tracking-tight animate-pulse">
        กำลังโหลดข้อมูลพื้นที่จัดเก็บ (Blob)...
      </p>
      <p className="text-slate-400 text-xs mt-1 font-sans">
        กำลังเชื่อมต่อกับ Vercel Blob Storage
      </p>
    </div>
  );
}
