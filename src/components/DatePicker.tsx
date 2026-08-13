"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function DatePicker({
  value, // format "YYYY-MM-DD"
  onChange,
  disabled = false,
  placeholder = "เลือกวันที่"
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse incoming value or default to today
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewMonth, setViewMonth] = useState(parsedDate ? parsedDate.getMonth() : new Date().getMonth());
  const [viewYear, setViewYear] = useState(parsedDate ? parsedDate.getFullYear() : new Date().getFullYear());

  const thaiMonthsFull = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const thaiDaysMin = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const displayValue = parsedDate 
    ? `${parsedDate.getDate()} ${thaiMonthsFull[parsedDate.getMonth()]} ${parsedDate.getFullYear() + 543}` 
    : placeholder;

  // Calendar logic
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null); // empty slots
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };

  const isSelected = (day: number) => {
    return parsedDate?.getDate() === day && parsedDate?.getMonth() === viewMonth && parsedDate?.getFullYear() === viewYear;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-400'}`}
        >
          <span className={`text-sm ${parsedDate ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{displayValue}</span>
          <CalendarIcon size={14} className="text-slate-400" />
        </button>
        {value && !disabled && (
          <button 
            type="button" 
            onClick={() => onChange("")}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors absolute right-10"
            style={{ zIndex: 10 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden right-0 md:left-0 md:right-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="font-bold text-slate-800 text-sm">
                {thaiMonthsFull[viewMonth]} {viewYear + 543}
              </div>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {thaiDaysMin.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8"></div>;
                  }
                  
                  const selected = isSelected(day);
                  const today = isToday(day);
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      className={`h-8 w-full flex items-center justify-center rounded-md text-sm transition-colors ${
                        selected 
                          ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                          : today 
                            ? 'bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
