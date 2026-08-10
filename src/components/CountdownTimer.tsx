"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer({ createdAt }: { createdAt: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // Default to 15 mins
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryTime = new Date(createdAt.getTime() + 15 * 60000);
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

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2 px-4 rounded-full border border-red-200 mt-4 mb-2">
        <Clock size={16} />
        <span className="font-semibold text-sm">QR Code หมดอายุแล้ว กรุณาสร้างใหม่</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-50 py-2 px-4 rounded-full border border-amber-200 mt-4 mb-2">
      <Clock size={16} className="animate-pulse" />
      <span className="font-medium text-sm">
        QR Code หมดอายุใน {minutes}:{seconds.toString().padStart(2, '0')} นาที
      </span>
    </div>
  );
}
