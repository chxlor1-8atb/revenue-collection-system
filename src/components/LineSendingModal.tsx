"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Phase = "sending" | "success" | "error";

interface LineSendingModalProps {
  isOpen: boolean;
  phase: Phase;
  houseNumber?: string;
  errorMsg?: string;
  onClose: () => void;
}

export default function LineSendingModal({
  isOpen,
  phase,
  houseNumber,
  errorMsg,
  onClose,
}: LineSendingModalProps) {
  const [dotCount, setDotCount] = useState(1);

  // Animate dots
  useEffect(() => {
    if (phase !== "sending") return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-close after success
  useEffect(() => {
    if (phase === "success") {
      const timer = setTimeout(onClose, 2200);
      return () => clearTimeout(timer);
    }
  }, [phase, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center">

        {/* LINE Icon */}
        <div className="mb-6 relative">
          <img
            src="https://vos.line-scdn.net/line-api-web-cms/messaging___1.png"
            alt="LINE Messaging API"
            className="w-20 h-20 object-contain"
          />
          {phase === "sending" && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00B900] rounded-full flex items-center justify-center">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {phase === "success" && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* Sending Phase */}
        {phase === "sending" && (
          <>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              กำลังส่งแจ้งเตือน{".".repeat(dotCount)}
            </h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              ส่งข้อความแจ้งเตือนบิลค้างชำระพร้อม QR Code<br/>
              ไปยัง LINE ของบ้านเลขที่ <strong className="text-slate-700">{houseNumber}</strong>
            </p>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#00B900] rounded-full animate-pulse" style={{ width: "75%" }} />
            </div>
          </>
        )}

        {/* Success Phase */}
        {phase === "success" && (
          <>
            <h3 className="text-lg font-bold text-emerald-600 mb-2 animate-in fade-in duration-300">
              ส่งแจ้งเตือนสำเร็จ!
            </h3>
            <p className="text-slate-500 text-sm text-center mb-4">
              ข้อความแจ้งเตือนถูกส่งไปยัง LINE ของบ้านเลขที่ <strong className="text-slate-700">{houseNumber}</strong> เรียบร้อยแล้ว
            </p>
            {/* Success checkmark animation */}
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
          </>
        )}

        {/* Error Phase */}
        {phase === "error" && (
          <>
            <h3 className="text-lg font-bold text-red-600 mb-2">
              ส่งแจ้งเตือนไม่สำเร็จ
            </h3>
            <p className="text-slate-500 text-sm text-center mb-4">
              {errorMsg || "เกิดข้อผิดพลาดในการส่งแจ้งเตือน"}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors text-sm"
            >
              ปิดหน้าต่าง
            </button>
          </>
        )}
      </div>
    </div>
  );
}
