"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Smartphone, Globe, Calendar, Home, User, Search, Download, Printer, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlipModalButton from "@/components/SlipModalButton";
import DatePicker from "@/components/DatePicker";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import ConfirmModal from "@/components/ConfirmModal";
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

  // Modal State
  const [voidConfirmId, setVoidConfirmId] = useState<number | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

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

  const handleVoidClick = (id: number) => {
    setVoidConfirmId(id);
  };

  const executeVoid = async () => {
    if (!voidConfirmId) return;
    setIsVoiding(true);
    try {
      const res = await fetch(`/api/history/${voidConfirmId}/void`, { method: "POST" });
      if (res.ok) {
        setVoidConfirmId(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsVoiding(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-[#1F2E22] tracking-tight">ประวัติการรับชำระเงิน</h1>
          <p className="text-slate-500 mt-1 text-sm">ประวัติการรับชำระเงินทั้งหมดที่ได้รับการยืนยันแล้ว</p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">รายการ</div>
            <div className="text-lg font-bold text-slate-800">{totalCount.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-end">
            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">ยอดรวม</div>
            <div className="text-lg font-bold font-mono text-emerald-700">฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end w-full">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-none">
          <SearchAutocomplete
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => { setPage(1); setSearch(searchInput); }}
            placeholder="ค้นหาบ้านเลขที่, ชื่อเจ้าบ้าน..."
          />
        </form>

        {/* Date Pickers & Export */}
        <div className="flex flex-1 flex-wrap sm:flex-nowrap gap-3 items-end sm:justify-end">
          <div className="flex-1 min-w-[130px] sm:max-w-[180px]">
            <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">ตั้งแต่</label>
            <DatePicker
              value={startDate}
              onChange={(val) => { setStartDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
          <div className="flex-1 min-w-[130px] sm:max-w-[180px]">
            <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">ถึงวันที่</label>
            <DatePicker
              value={endDate}
              onChange={(val) => { setEndDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-[#1F2E22] hover:bg-slate-800 text-white px-4 h-[42px] rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap font-medium shadow-sm shrink-0"
          >
            <Download size={16} /> ส่งออก CSV
          </button>
        </div>
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
                  <button 
                    onClick={() => handleVoidClick(item.id)}
                    title="ยกเลิกการชำระเงิน"
                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    ยกเลิกรายการ
                  </button>
                </div>
              </div>

              {/* Body — mobile: stacked, md: 12-col grid */}
              <div className="px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start">
                
                {/* House Info - takes 3 cols */}
                <div className="md:col-span-3 flex md:flex-col justify-between md:justify-start items-start gap-2 md:gap-0">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                      <Home size={12} /> บ้านเลขที่
                    </div>
                    <div className="font-mono font-bold text-slate-800 text-lg leading-tight">{item.houseNumber}</div>
                    <div className="text-sm text-slate-600 font-medium line-clamp-1">{item.ownerName}</div>
                  </div>
                  {/* Amount shown inline on mobile only */}
                  <div className="md:hidden text-right">
                    <div className="text-xs text-slate-400 mb-0.5">ยอดเงิน</div>
                    <div className="text-lg font-bold font-mono text-emerald-600">
                      ฿{parseFloat(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
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

                {/* Amount & Date - takes 2 cols, hidden on mobile (shown above) */}
                <div className="hidden md:block md:col-span-2">
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
                <div className="md:col-span-2 flex flex-row md:flex-col justify-start md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  {item.slipImageUrl && item.slipImageUrl !== "pending" && (
                    <SlipModalButton imageUrl={item.slipImageUrl} buttonStyle="history" />
                  )}
                  <Link 
                    href={`/dashboard/history/${item.id}/receipt`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 text-xs bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium"
                  >
                    <Printer size={14} /> พิมพ์ใบเสร็จ
                  </Link>
                </div>
              </div>
              
              {/* Additional Info Row (if any) */}
              {(item.payerNote || item.slipRefId || item.verifiedBy) && (
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  {item.verifiedBy && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">ผู้อนุมัติ:</span>
                      <span className="text-slate-700">{item.verifiedBy === 'line_bot' ? 'LINE Bot (อัตโนมัติ)' : item.verifiedBy}</span>
                    </div>
                  )}
                  {item.slipRefId && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Ref:</span>
                      <span className="text-slate-700 font-mono">{item.slipRefId}</span>
                    </div>
                  )}
                  {item.payerNote && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">หมายเหตุ:</span>
                      <span className="text-slate-700 italic">{item.payerNote}</span>
                    </div>
                  )}
                </div>
              )}
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

      {/* Void Confirmation Modal */}
      <ConfirmModal
        isOpen={!!voidConfirmId}
        onClose={() => setVoidConfirmId(null)}
        onConfirm={executeVoid}
        isLoading={isVoiding}
        title="ยกเลิกรายการชำระเงิน"
        description={
          <>คุณแน่ใจหรือไม่ที่จะยกเลิกรายการ <span className="font-bold text-slate-900">รหัส {voidConfirmId}</span> ?</>
        }
        warningText="บิลทั้งหมดที่ผูกกับรายการนี้จะกลับไปเป็นสถานะ ค้างชำระ ทันที และรายการจะถูกย้ายออกจากประวัตินี้"
        confirmText="ยืนยันการยกเลิก"
      />
    </div>
  );
}
