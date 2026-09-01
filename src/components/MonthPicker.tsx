"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function MonthPicker({
  value, // format "YYYY-MM"
  onChange,
  disabled = false,
  placement = "bottom",
  colorTheme = "emerald",
  buttonClassName,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placement?: "top" | "bottom";
  colorTheme?: "emerald" | "blue";
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentYear = value ? parseInt(value.split("-")[0], 10) : new Date().getFullYear();
  const currentMonth = value ? parseInt(value.split("-")[1], 10) : new Date().getMonth() + 1;
  
  const [viewYear, setViewYear] = useState(currentYear);

  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const fullThaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (monthIndex: number) => {
    const mm = (monthIndex + 1).toString().padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setIsOpen(false);
  };

  const displayValue = value ? `${fullThaiMonths[currentMonth - 1]} ${currentYear + 543}` : "เลือกเดือน/ปี";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={`เลือกเดือนและปี (${displayValue})`}
        aria-expanded={isOpen}
        className={buttonClassName || `w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 ${colorTheme === 'blue' ? 'focus:ring-[blue-600] focus:border-[blue-600]' : 'focus:ring-emerald-500 focus:border-emerald-500'} ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-400'}`}
      >
        <span className="text-[13px] text-slate-700">{displayValue}</span>
        <CalendarIcon size={16} className="text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === "top" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: placement === "top" ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden right-0 md:left-0 md:right-auto ${
              placement === "top" ? "bottom-full mb-2" : "mt-2"
            }`}
          >
            {/* Header / Year Selector */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <button 
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                aria-label="ปีก่อนหน้า"
                className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="font-bold text-slate-800">
                พ.ศ. {viewYear + 543}
              </div>
              <button 
                type="button"
                onClick={() => setViewYear(y => y + 1)}
                aria-label="ปีถัดไป"
                className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {thaiMonths.map((m, idx) => {
                const isSelected = viewYear === currentYear && (idx + 1) === currentMonth;
                const selectedBg = colorTheme === 'blue' ? 'bg-[blue-600]' : 'bg-emerald-600';
                const hoverTextBg = colorTheme === 'blue' ? 'hover:bg-[blue-50] hover:text-[blue-600]' : 'hover:bg-emerald-50 hover:text-emerald-700';
                
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`py-2 rounded-lg text-sm transition-colors ${
                      isSelected 
                        ? `${selectedBg} text-white shadow-sm font-medium` 
                        : `text-slate-700 ${hoverTextBg}`
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
