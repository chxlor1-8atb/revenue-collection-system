"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Smartphone, Globe, Calendar, Home, User, Search, Download, Printer, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";
import DatePicker from "@/components/DatePicker";
import Link from "next/link";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default function HistoryClient() {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For the input field before hitting enter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 20;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        startDate,
        endDate
      });
      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setTotalCount(json.totalCount);
        setTotalAmount(json.totalAmount);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    setSearch(searchInput);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      export: "csv",
      search,
      startDate,
      endDate
    });
    window.location.href = `/api/history?${params.toString()}`;
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl text-[#1F2E22] tracking-tight">ประวัติการรับชำระเงิน</h1>
          <p className="text-slate-500 mt-1">ประวัติการรับชำระเงินทั้งหมดที่ได้รับการยืนยันแล้ว</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">จำนวนรายการ</div>
            <div className="text-xl font-bold text-slate-800">{totalCount.toLocaleString()} <span className="text-sm font-normal text-slate-500">รายการ</span></div>
          </div>
          <div className="bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-end">
            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">ยอดเงินรวม</div>
            <div className="text-xl font-bold font-mono text-emerald-700">฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">ค้นหา</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="บ้านเลขที่ หรือ ชื่อเจ้าบ้าน..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
            />
          </div>
        </form>

        <div className="flex gap-4 w-full md:w-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">ตั้งแต่</label>
            <DatePicker
              value={startDate}
              onChange={(val) => { setStartDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">ถึงวันที่</label>
            <DatePicker
              value={endDate}
              onChange={(val) => { setEndDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap h-[42px] font-medium"
        >
          <Download size={16} /> ส่งออก CSV
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-20 flex flex-col items-center justify-center">
          <CheckCircle2 size={52} strokeWidth={1} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">ไม่พบประวัติการชำระเงินที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header strip */}
              <div className="flex items-center justify-between px-6 py-3 bg-emerald-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={16} className="fill-emerald-100" />
                  <span className="text-sm font-semibold">ชำระแล้ว • รหัส {item.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {item.paidVia === "LINE Bot" ? (
                      <><Smartphone size={12} className="text-emerald-500" /> LINE Bot</>
                    ) : (
                      <><Globe size={12} className="text-blue-500" /> เว็บไซต์</>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-12 gap-4 items-center">
                
                {/* House Info - takes 3 cols */}
                <div className="md:col-span-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                    <Home size={12} /> บ้านเลขที่
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-lg">{item.houseNumber}</div>
                  <div className="text-sm text-slate-600 font-medium line-clamp-1">{item.ownerName}</div>
                </div>

                {/* Months - takes 3 cols */}
                <div className="md:col-span-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1.5">
                    <Calendar size={12} /> รายการบิลที่จ่าย
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.months.length > 0 ? item.months.map((m: string) => (
                      <span key={m} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
                        {formatThaiMonth(m)}
                      </span>
                    )) : <span className="text-xs text-slate-400">-</span>}
                  </div>
                </div>

                {/* Sender - takes 2 cols */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                    <User size={12} /> ผู้โอนเงิน
                  </div>
                  <div className="text-sm font-medium text-slate-700 line-clamp-1">{item.senderName || "-"}</div>
                </div>

                {/* Amount & Date - takes 2 cols */}
                <div className="md:col-span-2 text-right md:text-left">
                  <div className="text-xs text-slate-400 mb-0.5">ยอดเงินรวม</div>
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    ฿{parseFloat(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {item.paidAt ? new Date(item.paidAt).toLocaleDateString("th-TH", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    }) : "-"}
                  </div>
                </div>

                {/* Actions - takes 2 cols */}
                <div className="col-span-2 md:col-span-2 flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  {item.slipImageUrl && item.slipImageUrl !== "pending" && (
                    <SlipModalButton imageUrl={item.slipImageUrl} buttonStyle="history" />
                  )}
                  <Link 
                    href={`/dashboard/history/${item.id}/receipt`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 text-xs bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium w-full"
                  >
                    <Printer size={14} /> พิมพ์ใบเสร็จ
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-sm text-slate-500">
            แสดงหน้า <span className="font-medium text-slate-800">{page}</span> จาก <span className="font-medium text-slate-800">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
