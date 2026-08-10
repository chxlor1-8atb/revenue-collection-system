"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer({ createdAt }: { createdAt: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(3 * 60); // Default to 3 mins
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryTime = new Date(createdAt.getTime() + 3 * 60000);
      const now = new Date();
      const difference = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
      return difference > 0 ? difference : 0;
    };

    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    
    if (initialTimeLeft === 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Danger state if under 1 minute
  const isDanger = timeLeft < 60;

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2.5 px-4 rounded-xl border border-red-200 mt-4 mb-2 shadow-sm">
        <Clock size={16} />
        <span className="font-semibold text-sm">QR Code หมดอายุแล้ว กรุณาสร้างใหม่</span>
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
