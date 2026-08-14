"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function CountdownTimer({ initialTimeLeft, transactionId }: { initialTimeLeft: number, transactionId?: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft);
  const [isExpired, setIsExpired] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isRegeneratingRef = useRef(false);
  const [isVerified, setIsVerified] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Poll transaction status every 3 seconds
  useEffect(() => {
    if (!transactionId) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`);
        const data = await res.json();
        if (data.slipStatus === "verified") {
          setIsVerified(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
          // Small delay for the animation, then redirect
          setTimeout(() => {
            window.location.href = `/pay/${transactionId}/success`;
          }, 1500);
        }
      } catch (e) {
        // Ignore polling errors
      }
    };

    pollingRef.current = setInterval(pollStatus, 3000);
    pollStatus(); // Check immediately on mount

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [transactionId]);

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

  const handleExpiry = async () => {
    setIsExpired(true);
    if (!transactionId || isRegeneratingRef.current) return;
    
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/transactions/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (res.ok && data.transactionId) {
        window.location.href = `/pay/${data.transactionId}`;
      } else {
        console.error("Regenerate failed:", data.error);
        isRegeneratingRef.current = false;
        setIsRegenerating(false);
        setIsExpired(true);
      }
    } catch (e) {
      console.error(e);
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isDanger = timeLeft < 60;

  // Verified state
  if (isVerified) {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 py-3 px-6 rounded-xl border border-emerald-200 mt-4 mb-2 shadow-sm animate-pulse">
        <CheckCircle2 size={18} />
        <span className="font-semibold text-sm">ยืนยันการชำระเงินสำเร็จ! กำลังเปลี่ยนหน้า...</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 bg-amber-50 py-4 px-6 rounded-xl border border-amber-200 mt-4 mb-2 shadow-sm">
        {!isRegeneratingRef.current ? (
          <>
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle size={18} />
              <span className="font-semibold text-sm">หมดเวลาหรือเกิดข้อผิดพลาดในการสร้างใหม่</span>
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard/houses'} 
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              กลับไปเลือกบิลใหม่
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 animate-pulse">
            <RefreshCw size={18} className="animate-spin" />
            <span className="font-semibold text-sm">หมดเวลา! กำลังสร้าง QR Code ใหม่...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-1 py-3 px-5 rounded-xl border mt-4 mb-2 shadow-sm transition-colors duration-500 ${isDanger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
      <div className="flex items-center gap-2">
        <Clock size={16} className={isDanger ? "animate-pulse" : ""} />
        <span className="font-medium text-xs uppercase tracking-wide opacity-80">เวลาที่เหลือในการโอน</span>
      </div>
      <span className="font-mono text-2xl font-bold tracking-tight">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
