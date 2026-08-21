"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: ReactNode;
  name?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  disabled = false,
  icon,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={selectedOption ? selectedOption.label : placeholder}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between ${icon ? 'pl-10 pr-3' : 'px-3'} h-[42px] bg-white border ${
          isOpen ? 'border-[#5B58F2] ring-2 ring-[#5B58F2]/20' : 'border-slate-200 hover:border-slate-300'
        } rounded-[12px] shadow-none focus:outline-none focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
        }`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <span className={`text-[13px] ${selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-[12px] shadow-lg overflow-hidden flex flex-col"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-[13px] rounded-[8px] transition-colors shrink-0 ${
                    value === option.value
                      ? 'bg-[#5B58F2] text-white font-medium'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
