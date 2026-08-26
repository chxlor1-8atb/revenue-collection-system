"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function CountdownTimer({ initialTimeLeft, transactionId }: { initialTimeLeft: number, transactionId?: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft);
  const [isExpired, setIsExpired] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isRegeneratingRef = useRef(false);
  const [isVerified, setIsVerified] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const handleSuccessfulVerification = useCallback(() => {
    setIsVerified(true);
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTimeout(() => {
      window.location.href = `/pay/${transactionId}/success`;
    }, 1200);
  }, [transactionId]);

  // 1. Real-Time SSE Stream Listener (Zero Latency < 50ms)
  useRealtimeEvents({
    "transaction:verified": (data) => {
      if (transactionId && data.transactionId === transactionId) {
        handleSuccessfulVerification();
      }
    }
  }, Boolean(transactionId && !isVerified));

  // 2. Fallback Polling (every 3 seconds)
  useEffect(() => {
    if (!transactionId || isVerified) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`);
        const data = await res.json();
        if (data.slipStatus === "verified") {
          handleSuccessfulVerification();
        }
      } catch (e) {
        // Ignore polling errors
      }
    };

    pollingRef.current = setInterval(pollStatus, 3000);
    pollStatus();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [transactionId, isVerified, handleSuccessfulVerification]);

  useEffect(() => {
    if (initialTimeLeft <= 0) {
      handleExpiry();
      return;
    }

    const mountTime = performance.now();

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((performance.now() - mountTime) / 1000);
      const remaining = initialTimeLeft - elapsedSeconds;
      
      setTimeLeft(remaining > 0 ? remaining : 0);
      
      if (remaining <= 0) {
        clearInterval(timer);
        handleExpiry();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [initialTimeLeft]);

  const handleExpiry = () => {
    setIsExpired(true);
  };

  const handleRegenerate = async () => {
    if (!transactionId || isRegeneratingRef.current) return;
    
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/transactions/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาดในการต่อเวลา กรุณาลองใหม่อีกครั้ง");
        isRegeneratingRef.current = false;
        setIsRegenerating(false);
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isVerified) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-800 animate-in zoom-in-95 duration-200">
        <CheckCircle2 size={24} className="text-emerald-600 animate-bounce" />
        <span className="font-sans font-bold text-sm">ยืนยันการชำระเงินเรียบร้อยแล้ว กำลังพาไปยังใบเสร็จ...</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-rose-800">
        <div className="flex items-center gap-2 font-sans font-bold text-sm">
          <AlertCircle size={18} className="text-rose-600" />
          <span>QR Code หมดอายุแล้ว</span>
        </div>
        <p className="text-xs text-rose-600 text-center font-sans">
          กรุณากดปุ่มด้านล่างเพื่อสร้าง QR Code ใหม่สำหรับชำระเงิน
        </p>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="mt-2 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-sans font-bold py-2 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
          <span>{isRegenerating ? "กำลังสร้าง QR Code ใหม่..." : "สร้าง QR Code ใหม่"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2 rounded-xl text-sm font-sans font-medium mb-6">
      <Clock size={16} className="text-amber-600 animate-pulse" />
      <span>กรุณาชำระเงินภายใน:</span>
      <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-base">
        {formattedTime}
      </span>
    </div>
  );
}
