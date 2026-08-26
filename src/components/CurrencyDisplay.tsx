"use client";

import { useMemo } from "react";
import { formatBaht } from "@/lib/formatters";

export interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  variant?: "default" | "primary" | "success" | "danger" | "warning" | "badge-emerald" | "badge-rose" | "badge-indigo" | "badge-amber" | "badge-slate";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showSymbol?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  tabular?: boolean;
  compactMobile?: boolean;
  className?: string;
}

export default function CurrencyDisplay({
  amount,
  variant = "default",
  size = "md",
  showSymbol = true,
  decimals = 2,
  prefix = "",
  suffix = "",
  tabular = true,
  compactMobile = false,
  className = "",
}: CurrencyDisplayProps) {
  const numValue = useMemo(() => {
    if (amount === null || amount === undefined || amount === "") return 0;
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    return isNaN(n) ? 0 : n;
  }, [amount]);

  const formattedFull = useMemo(() => {
    return formatBaht(numValue, { showSymbol: false, decimals });
  }, [numValue, decimals]);

  // Size configurations
  const sizeClasses = {
    xs: "text-[11px]",
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
    xl: "text-lg sm:text-xl font-bold",
    "2xl": "text-xl sm:text-2xl lg:text-3xl font-black tracking-tight",
    "3xl": "text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight",
    "4xl": "text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight",
  }[size];

  // Variant color & badge configurations
  const variantClasses = {
    default: "text-slate-900",
    primary: "text-[#5B58F2]",
    success: "text-emerald-700",
    danger: "text-rose-600",
    warning: "text-amber-700",
    "badge-emerald": "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold",
    "badge-rose": "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 font-bold",
    "badge-indigo": "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-bold",
    "badge-amber": "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 font-bold",
    "badge-slate": "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 font-bold",
  }[variant];

  const symbolSizeClass = {
    xs: "text-[10px]",
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg sm:text-xl font-bold mr-0.5 opacity-90",
    "3xl": "text-xl sm:text-2xl font-bold mr-1 opacity-90",
    "4xl": "text-2xl sm:text-3xl font-bold mr-1 opacity-90",
  }[size];

  return (
    <span
      className={`inline-flex items-baseline ${tabular ? "font-mono tabular-nums" : ""} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {prefix && <span className="mr-0.5 select-none">{prefix}</span>}
      {showSymbol && (
        <span className={`select-none ${symbolSizeClass}`}>฿</span>
      )}
      <span>{formattedFull}</span>
      {suffix && <span className="ml-1 text-[11px] font-sans font-normal opacity-80 select-none">{suffix}</span>}
    </span>
  );
}
