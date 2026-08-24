"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200/80 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบพบปัญหาชั่วคราวในการเชื่อมต่อ กรุณากดปุ่มลองใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#5B58F2] hover:bg-[#4A47D1] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>ลองใหม่อีกครั้ง</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Home size={14} />
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
