"use client";

import { useEffect, useState } from "react";
import { Printer, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintTrigger() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Automatically open print dialog after a short delay to allow images/fonts to load
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-lg">
      <Link
        href="/dashboard/history"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
      >
        <ArrowLeft size={14} />
        <span>ย้อนกลับ</span>
      </Link>
      
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
      >
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        <span>{copied ? "คัดลอกลิงก์แล้ว!" : "คัดลอกลิงก์"}</span>
      </button>

      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#5B58F2] hover:bg-[#4A47D1] rounded-xl shadow-xs transition-all cursor-pointer"
      >
        <Printer size={14} />
        <span>พิมพ์ใบเสร็จ</span>
      </button>
    </div>
  );
}
