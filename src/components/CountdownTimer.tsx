"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function CountdownTimer({ initialTimeLeft, transactionId, houseId }: { initialTimeLeft: number, transactionId?: number, houseId?: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft);
  const [isAutoRenewing, setIsAutoRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const isRenewingRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const handleSuccessfulVerification = useCallback(() => {
    setIsVerified(true);
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTimeout(() => {
      window.location.href = `/pay/${transactionId}/success`;
    }, 1200);
  }, [transactionId]);

  const handleRejection = useCallback(() => {
    setIsRejected(true);
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  // Pusher Real-time Subscriptions + Fallback Polling
  useEffect(() => {
    if (!transactionId || isVerified || isRejected) return;

    let pusherClient: any = null;
    let channel: any = null;

    const setupPusher = async () => {
      try {
        const { getPusherClient } = await import("@/lib/pusher");
        pusherClient = await getPusherClient();
      } catch (e) {
        console.warn("Pusher client failed to initialize", e);
      }

      if (pusherClient && houseId) {
        // Listen to the HOUSE channel so that if they pay an older QR, it still succeeds here!
        channel = pusherClient.subscribe(`house-${houseId}`);
        channel.bind('payment-verified', (data: any) => {
          if (data.status === 'verified') {
            handleSuccessfulVerification();
          } else if (data.status === 'rejected') {
            handleRejection();
          }
        });
      } else if (pusherClient && !houseId) {
        // Fallback to transaction specific channel if no houseId
        channel = pusherClient.subscribe(`transaction-${transactionId}`);
        channel.bind('payment-verified', (data: any) => {
          if (data.status === 'verified') {
            handleSuccessfulVerification();
          } else if (data.status === 'rejected') {
            handleRejection();
          }
        });
      }
    };
    setupPusher();

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`);
        const data = await res.json();
        if (data.slipStatus === "verified") {
          handleSuccessfulVerification();
        } else if (data.slipStatus === "rejected") {
          handleRejection();
        }
      } catch (e) {
        // Ignore polling errors
      }
    };

    // If Pusher is configured, we can poll less frequently (e.g. 10s fallback)
    // If not, we keep the fast 2.5s poll
    const pollInterval = pusherClient ? 10000 : 2500;
    pollingRef.current = setInterval(pollStatus, pollInterval);
    pollStatus(); // Initial poll

    const handleVisibility = () => {
      // Force aggressive polling when user switches back from banking app
      if (document.visibilityState === "visible") pollStatus();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (pusherClient) {
        if (houseId) pusherClient.unsubscribe(`house-${houseId}`);
        else pusherClient.unsubscribe(`transaction-${transactionId}`);
      }
    };
  }, [transactionId, houseId, isVerified, isRejected, handleSuccessfulVerification, handleRejection]);

  // Automatic Background Renewal Function
  const autoRenewQrCode = useCallback(async () => {
    if (!transactionId || isRenewingRef.current || isVerified) return;

    isRenewingRef.current = true;
    setIsAutoRenewing(true);
    setRenewError(null);

    try {
      const res = await fetch(`/api/transactions/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (res.ok && data.transactionId) {
        // Smoothly replace URL with new transaction ID without reload flash
        window.location.replace(`/pay/${data.transactionId}`);
      } else if (data.isVerified) {
        handleSuccessfulVerification();
      } else {
        setRenewError(data.error || "ไม่สามารถต่อเวลาอัตโนมัติได้");
        setIsAutoRenewing(false);
        isRenewingRef.current = false;
      }
    } catch (e) {
      console.error("Auto renew failed:", e);
      setRenewError("การเชื่อมต่อขัดข้อง กรุณากดลองใหม่");
      setIsAutoRenewing(false);
      isRenewingRef.current = false;
    }
  }, [transactionId, isVerified, handleSuccessfulVerification]);

  // Live Second-by-Second Countdown
  useEffect(() => {
    if (initialTimeLeft <= 0) {
      // If already expired on page load -> auto-renew immediately!
      autoRenewQrCode();
      return;
    }

    const mountTime = performance.now();

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((performance.now() - mountTime) / 1000);
      const remaining = initialTimeLeft - elapsedSeconds;
      
      setTimeLeft(remaining > 0 ? remaining : 0);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Time is up -> seamlessly auto-renew in the background!
        autoRenewQrCode();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [initialTimeLeft, autoRenewQrCode]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // 1. Success / Verified View
  if (isVerified) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-800 animate-in zoom-in-95 duration-200">
        <CheckCircle2 size={24} className="text-emerald-600 animate-bounce" />
        <span className="font-sans font-bold text-sm">ยืนยันการชำระเงินเรียบร้อยแล้ว กำลังพาไปยังใบเสร็จ...</span>
      </div>
    );
  }

  // 1.5 Rejected View
  if (isRejected) {
    return (
      <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-rose-800 animate-in zoom-in-95 duration-200 mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} className="text-rose-600" />
          <span className="font-sans font-bold text-sm">สลิปของคุณถูกปฏิเสธ กรุณาอัปโหลดใหม่</span>
        </div>
        <button
          type="button"
          onClick={() => window.location.href = "/"}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-colors"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  // 2. Auto-Renewing State View (Smooth & Seamless)
  if (isAutoRenewing) {
    return (
      <div className="w-full bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 px-4 py-3 rounded-2xl text-xs font-sans font-semibold flex items-center justify-center gap-2.5 mb-6 animate-pulse">
        <RefreshCw size={15} className="animate-spin text-[#5B58F2]" />
        <span>ระบบกำลังต่ออายุ QR Code ให้อัตโนมัติ...</span>
      </div>
    );
  }

  // 3. Fallback Error State (If network dropped during auto-renew)
  if (renewError) {
    return (
      <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-rose-800 mb-6">
        <div className="flex items-center gap-2 font-sans font-bold text-sm">
          <AlertCircle size={18} className="text-rose-600" />
          <span>{renewError}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            isRenewingRef.current = false;
            autoRenewQrCode();
          }}
          className="mt-1 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-sans font-bold py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>กดเพื่อสร้าง QR Code ใหม่</span>
        </button>
      </div>
    );
  }

  // 4. Normal Live Countdown View
  const isUrgent = timeLeft <= 60 && timeLeft > 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans font-medium mb-6 transition-all border text-center ${
      isUrgent 
        ? "bg-red-50 border-red-200 text-red-900 animate-pulse" 
        : "bg-amber-50 border-amber-200/80 text-amber-900"
    }`}>
      <div className="flex items-center gap-2 shrink-0">
        <Clock size={16} className={isUrgent ? "text-red-600 animate-spin" : "text-amber-600 animate-pulse"} />
        <span className="whitespace-nowrap">{isUrgent ? "เหลือเวลาสแกนอีก" : "กรุณาชำระเงินภายใน"}</span>
        <span className={`font-mono font-bold px-2.5 py-1 rounded-xl text-sm ${
          isUrgent ? "text-red-700 bg-red-100/90" : "text-amber-700 bg-amber-100/90"
        }`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
