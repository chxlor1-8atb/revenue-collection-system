"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, User, Loader2 } from "lucide-react";

interface House {
  id: number;
  houseNumber: string;
  ownerName: string;
  zone: string | null;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (house: House) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export default function SearchAutocomplete({ value, onChange, onSelect, onSubmit, placeholder = "ค้นหา...", className, isLoading }: SearchAutocompleteProps) {
  const [predictions, setPredictions] = useState<House[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (value.trim().length >= 2) {
        fetchPredictions(value);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  const fetchPredictions = async (query: string) => {
    try {
      const res = await fetch(`/api/houses/predict?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
        setIsOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelect = (house: House) => {
    onChange(house.houseNumber);
    setIsOpen(false);
    if (onSelect) onSelect(house);
    if (onSubmit) onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsOpen(false);
      if (onSubmit) onSubmit();
    }
  };

  return (
    <div className="relative group w-full" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors z-10">
        {isLoading ? (
          <Loader2 size={18} className="text-[#5B58F2] animate-spin" />
        ) : (
          <Search size={18} className="text-slate-400 group-focus-within:text-[#5B58F2]" />
        )}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (predictions.length > 0) setIsOpen(true); }}
        className={
          className
            // When custom className is provided, use it for all visual styling
            ? `h-[42px] pl-[38px] pr-4 text-slate-900 text-sm focus:outline-none transition-all duration-200 placeholder:text-transparent sm:placeholder:text-slate-400 focus:placeholder:text-slate-400 relative z-0 ${className}`
            // Default pill style for other pages (e.g. top nav search)
            : `h-[42px] pl-[38px] pr-4 bg-white border-0 shadow-[0_4px_14px_rgba(0,0,0,0.05)] text-slate-900 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 placeholder:text-transparent sm:placeholder:text-slate-400 focus:placeholder:text-slate-400 cursor-pointer sm:cursor-text focus:cursor-text relative z-0 w-11 focus:w-[280px] sm:w-72 sm:focus:w-[420px]`
        }
      />
      
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-[400px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-[100]">
          <ul className="max-h-72 overflow-y-auto py-1">
            {predictions.map(house => (
              <li 
                key={house.id}
                onClick={() => handleSelect(house)}
                className="px-4 py-3 hover:bg-emerald-50/50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
              >
                <div className="bg-emerald-100/50 p-2 rounded-lg text-emerald-600 shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 flex justify-between items-baseline">
                    <span className="truncate">{house.houseNumber}</span>
                    {house.zone && <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{house.zone}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{house.ownerName}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
