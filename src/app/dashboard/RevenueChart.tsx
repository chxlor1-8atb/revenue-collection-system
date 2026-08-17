"use client";

import { useState, useMemo } from "react";
import { ChevronDown, BarChart3 } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

type Transaction = {
  amount: string | null;
  date: string | null;
};

export default function RevenueChart({ transactions }: { transactions: Transaction[] }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  // Get available years from data, ensuring at least currentYear is there
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    transactions.forEach(tx => {
      if (tx.date) years.add(new Date(tx.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Aggregate data based on selection
  const chartData = useMemo(() => {
    if (selectedMonth === "all") {
      // Monthly data for the selected year (12 bars)
      const monthlyTotals = Array(12).fill(0);
      transactions.forEach(tx => {
        if (tx.date) {
          const d = new Date(tx.date);
          if (d.getFullYear() === selectedYear) {
            monthlyTotals[d.getMonth()] += parseFloat(tx.amount || "0");
          }
        }
      });
      const maxVal = Math.max(...monthlyTotals, 1);
      return monthlyTotals.map((total, index) => ({
        label: thaiMonths[index].slice(0, 3), // e.g. ม.ค.
        fullLabel: thaiMonths[index],
        value: total,
        percent: (total / maxVal) * 100
      }));
    } else {
      // Daily data for the selected month/year
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const dailyTotals = Array(daysInMonth).fill(0);
      transactions.forEach(tx => {
        if (tx.date) {
          const d = new Date(tx.date);
          if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
            dailyTotals[d.getDate() - 1] += parseFloat(tx.amount || "0");
          }
        }
      });
      const maxVal = Math.max(...dailyTotals, 1);
      return dailyTotals.map((total, index) => ({
        label: `${index + 1}`,
        fullLabel: `${index + 1} ${thaiMonths[selectedMonth]}`,
        value: total,
        percent: (total / maxVal) * 100
      }));
    }
  }, [transactions, selectedYear, selectedMonth]);

  const totalSelectedRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="xl:col-span-2 bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col h-full transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-[#5B58F2]" size={20} />
            สถิติรายได้ชำระค่าขยะ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ยอดรวม: <span className="font-bold text-emerald-600">฿{totalSelectedRevenue.toLocaleString("th-TH")}</span>
          </p>
        </div>
        
        {/* Selectors */}
        <div className="flex items-center gap-3">
          <div className="w-[120px] sm:w-[140px] z-50">
            <CustomSelect
              options={[
                { value: "all", label: "ดูทั้งปี" },
                ...thaiMonths.map((m, i) => ({ value: String(i), label: m }))
              ]}
              value={String(selectedMonth)}
              onChange={(val) => setSelectedMonth(val === "all" ? "all" : parseInt(val))}
            />
          </div>

          <div className="w-[100px] sm:w-[110px] z-40">
            <CustomSelect
              options={availableYears.map(y => ({ value: String(y), label: `ปี ${y + 543}` }))}
              value={String(selectedYear)}
              onChange={(val) => setSelectedYear(parseInt(val))}
            />
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="flex-1 min-h-[300px] border border-slate-100 rounded-2xl bg-slate-50/50 relative overflow-hidden flex flex-col justify-end p-4 sm:p-6 mt-auto">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pb-12 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full border-b border-slate-200/60 h-0"></div>
          ))}
        </div>
        
        {/* Mock Bars -> Now Real Bars! */}
        <div className="relative flex items-end justify-between gap-1 sm:gap-2 h-48 w-full z-10 px-1 sm:px-2">
          {chartData.map((data, i) => (
            <div key={i} className="w-full h-full bg-[#5B58F2]/10 hover:bg-[#5B58F2]/20 transition-colors rounded-t-sm sm:rounded-t-md relative group flex flex-col justify-end items-center">
               
               {/* Tooltip */}
               <div className="absolute bottom-[calc(100%+8px)] opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-30 shadow-lg">
                 <div className="font-semibold">{data.fullLabel}</div>
                 <div className="text-emerald-400 font-bold">฿{data.value.toLocaleString("th-TH")}</div>
               </div>

               {/* Bar Fill */}
               <div 
                 className={`w-full rounded-t-sm sm:rounded-t-md transition-all duration-700 ease-out ${data.value > 0 ? 'bg-[#5B58F2]/60 group-hover:bg-[#5B58F2]' : 'bg-transparent'}`} 
                 style={{ height: `${data.percent}%` }}
               ></div>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="relative flex justify-between gap-1 sm:gap-2 w-full mt-4 px-1 sm:px-2 text-[9px] sm:text-[10px] text-slate-400 font-semibold z-10">
          {chartData.map((data, i) => (
            <div key={i} className="w-full text-center truncate select-none">{data.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
