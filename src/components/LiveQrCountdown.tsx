"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface LiveQrCountdownProps {
  createdAt: string | Date;
  durationSeconds?: number;
  showIcon?: boolean;
  className?: string;
  onExpire?: () => void;
}

export default function LiveQrCountdown({
  createdAt,
  durationSeconds = 180, // Default 3 minutes (180 seconds)
  showIcon = true,
  className = "",
  onExpire,
}: LiveQrCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return 0;
    const now = Date.now();
    const elapsed = Math.floor((now - createdTime) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });

  useEffect(() => {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - createdTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, durationSeconds, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isCritical = timeLeft <= 60 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  if (isExpired) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md ${className}`}>
        {showIcon && <Clock size={11} className="text-slate-400" />}
        <span>หมดเวลา QR</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md transition-all ${
        isCritical
          ? "text-red-700 bg-red-100/90 border border-red-200 animate-pulse"
          : "text-amber-800 bg-amber-100/90 border border-amber-200/80"
      } ${className}`}
      title={`เวลาสร้าง: ${new Date(createdAt).toLocaleTimeString("th-TH")}`}
    >
      {showIcon && (
        <Clock
          size={11}
          className={`${isCritical ? "text-red-600 animate-spin" : "text-amber-600"}`}
        />
      )}
      <span>เหลือ {formattedTime}</span>
    </span>
  );
}
