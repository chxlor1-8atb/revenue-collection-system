"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Smartphone, Globe, Calendar, Home, User, Search, Download, Printer, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlipModalButton from "@/components/SlipModalButton";
import DatePicker from "@/components/DatePicker";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";
import TablePagination from "@/components/TablePagination";
import CustomSelect from "@/components/CustomSelect";
import MonthPicker from "@/components/MonthPicker";

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
  
  // New Filters
  const [status, setStatus] = useState("verified");
  const [channel, setChannel] = useState("all");
  const [monthYear, setMonthYear] = useState("");

  const limit = 20;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        startDate,
        endDate,
        status,
        channel,
        monthYear
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
  }, [page, search, startDate, endDate, status, channel, monthYear]);

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
      endDate,
      status,
      channel,
      monthYear
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
    <div className="pb-12 space-y-8">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-slate-800 tracking-tight">ประวัติการรับชำระเงิน</h1>
          <p className="text-slate-500 mt-1 text-[length:13px]">รายการรับชำระเงินที่ตรวจสอบแล้ว</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-end">
            <div className="text-[length:11px] text-slate-400 font-semibold uppercase tracking-wider">จำนวนรายการ</div>
            <div className="text-lg font-bold text-slate-800 tracking-tight">{totalCount.toLocaleString()}</div>
          </div>
          <div className="bg-[#EEF0FF] px-4 py-2.5 rounded-2xl border border-transparent flex flex-col items-end">
            <div className="text-[length:11px] text-[#5B58F2] font-semibold uppercase tracking-wider">ยอดเงินรวม</div>
            <div className="text-lg font-bold font-mono text-[#5B58F2] tracking-tight">฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end w-full">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-none sm:flex-1 max-w-2xl">
          <SearchAutocomplete
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => { setPage(1); setSearch(searchInput); }}
            placeholder="ค้นหาบ้านหรือชื่อเจ้าของ..."
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-[12px] focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 shadow-none cursor-text"
          />
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 items-end w-full sm:w-auto">
          <div className="flex-1 min-w-[110px]">
            <label className="block text-[length:10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">สถานะ</label>
            <CustomSelect
              value={status}
              onChange={(val) => { setStatus(val); setPage(1); }}
              options={[
                { value: "verified", label: "สำเร็จ" },
                { value: "all", label: "ทั้งหมด" },
                { value: "voided", label: "ยกเลิกแล้ว" },
              ]}
            />
          </div>

          <div className="flex-1 min-w-[110px]">
            <label className="block text-[length:10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">ช่องทาง</label>
            <CustomSelect
              value={channel}
              onChange={(val) => { setChannel(val); setPage(1); }}
              options={[
                { value: "all", label: "ทั้งหมด" },
                { value: "line", label: "LINE" },
                { value: "web", label: "เว็บไซต์" },
              ]}
            />
          </div>

          <div className="flex-1 min-w-[130px]">
            <label className="block text-[length:10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">เดือนที่ชำระ</label>
            <MonthPicker
              value={monthYear}
              onChange={(val) => { setMonthYear(val); setPage(1); }}
              colorTheme="blue"
              buttonClassName="w-full flex items-center justify-between px-3 h-[42px] bg-white border border-slate-200 hover:border-slate-300 rounded-[12px] shadow-none focus:outline-none focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 transition-all cursor-pointer"
            />
          </div>
        </div>
        
        {/* Date Pickers & Export */}
        <div className="flex flex-1 sm:flex-none flex-wrap sm:flex-nowrap gap-2 items-end sm:justify-end shrink-0">
          <div className="flex-1 min-w-[130px] sm:w-[150px] md:w-[150px]">
            <label className="block text-[length:10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">จากวันที่</label>
            <DatePicker
              value={startDate}
              onChange={(val) => { setStartDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
          <div className="flex-1 min-w-[130px] sm:w-[150px] md:w-[150px]">
            <label className="block text-[length:10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">ถึงวันที่</label>
            <DatePicker
              value={endDate}
              onChange={(val) => { setEndDate(val); setPage(1); }}
              placeholder="เลือกวันที่"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-5 sm:px-6 h-[42px] rounded-[12px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap font-semibold shadow-sm shrink-0"
          >
            <Download size={16} /> ส่งออก CSV
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm animate-pulse">
              <div className="h-12 bg-slate-50 border-b border-slate-100 px-6 py-3"></div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  <div className="h-5 w-32 bg-slate-200 rounded-full"></div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="hidden md:block md:col-span-2 space-y-2">
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-6 w-20 bg-slate-200 rounded"></div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-20 flex flex-col items-center justify-center">
          <CheckCircle2 size={52} strokeWidth={1} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">ไม่พบประวัติการชำระเงินที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all animate-in slide-in-from-bottom-6 fade-in duration-700" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
              {/* Header strip */}
              <div className={`flex items-center justify-between px-6 py-3 border-b ${
                item.slipStatus === 'voided' 
                  ? 'bg-slate-50 border-slate-100' 
                  : 'bg-emerald-50/30 border-slate-100'
              }`}>
                <div className={`flex items-center gap-2 ${item.slipStatus === 'voided' ? 'text-slate-400' : 'text-emerald-700'}`}>
                  {item.slipStatus === 'voided' ? (
                    <X size={16} className="opacity-50" />
                  ) : (
                    <CheckCircle2 size={16} className="fill-emerald-100" />
                  )}
                  <span className="text-[length:13px] font-semibold">
                    {item.slipStatus === 'voided' ? 'ยกเลิกรายการ' : 'ตรวจสอบสำเร็จ'} • รหัส {item.id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[length:11px] text-slate-500 font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                    {item.paidVia === "LINE Bot" ? (
                      <><Smartphone size={12} className="text-[#5B58F2]" /> LINE Bot</>
                    ) : (
                      <><Globe size={12} className="text-slate-400" /> Web Admin</>
                    )}
                  </div>
                  {item.slipStatus !== 'voided' && (
                    <button 
                      onClick={() => handleVoidClick(item.id)}
                      title="ยกเลิกการชำระเงิน"
                      className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      ยกเลิกรายการ
                    </button>
                  )}
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
                      <span key={m} className="text-[length:11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
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
                  <div className="text-[length:11px] text-slate-400 mt-0.5 font-medium">
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
                  {item.slipStatus !== 'voided' && (
                    <Link 
                      href={`/dashboard/history/${item.id}/receipt`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1.5 text-xs bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium shadow-sm"
                    >
                      <Printer size={14} /> พิมพ์ใบเสร็จ
                    </Link>
                  )}
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
      {!isLoading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={setPage}
        />
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
