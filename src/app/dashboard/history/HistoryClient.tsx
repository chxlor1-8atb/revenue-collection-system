"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Smartphone, Globe, Calendar, Home, User, Search, Download, 
  Printer, Loader2, AlertTriangle, X, History, LayoutGrid, List, Eye,
  RotateCcw, Tag, Hash, FileText, Ban, ArrowUpDown, ArrowUp, ArrowDown,
  CheckSquare, Square, FileSpreadsheet, Shield, UserCheck, Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlipModalButton from "@/components/SlipModalButton";
import DatePicker from "@/components/DatePicker";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";
import TablePagination from "@/components/TablePagination";
import CustomSelect from "@/components/CustomSelect";
import MonthPicker from "@/components/MonthPicker";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default function HistoryClient() {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: grid or detailed
  const [viewMode, setViewModeState] = useState<"grid" | "detailed">("detailed");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("history_view_mode");
      if (saved === "grid" || saved === "detailed") {
        setViewModeState(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const setViewMode = (mode: "grid" | "detailed") => {
    setViewModeState(mode);
    try {
      localStorage.setItem("history_view_mode", mode);
    } catch (e) {
      // ignore
    }
  };

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<"paidAt" | "houseNumber" | "amount" | "id">("paidAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ZIP Download State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0, text: "" });

  // Modal State
  const [voidConfirmId, setVoidConfirmId] = useState<number | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Status, Channel, Month
  const [status, setStatus] = useState("verified");
  const [channel, setChannel] = useState("all");
  const [monthYear, setMonthYear] = useState("");
  const [limit, setLimit] = useState(10);

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
        monthYear,
        sortBy,
        sortOrder
      });
      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setTotalCount(json.totalCount || 0);
        setTotalAmount(json.totalAmount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, startDate, endDate, status, channel, monthYear, limit, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
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
      monthYear,
      sortBy,
      sortOrder
    });
    window.location.href = `/api/history?${params.toString()}`;
  };

  // Sorting handler
  const toggleSort = (field: "paidAt" | "houseNumber" | "amount" | "id") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const currentValidIds = data.filter(d => d.slipStatus !== "voided").map(d => d.id);
    const allSelected = currentValidIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentValidIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...currentValidIds]));
      setSelectedIds(merged);
    }
  };

  // Bulk ZIP Download
  const handleDownloadSlipsZip = async (targetItems?: any[]) => {
    const itemsToDownload = targetItems || (selectedIds.length > 0 
      ? data.filter(d => selectedIds.includes(d.id))
      : data
    );

    const validSlips = itemsToDownload.filter(
      item => item.slipImageUrl && item.slipImageUrl !== "pending" && !item.slipImageUrl.includes("placeholder")
    );

    if (validSlips.length === 0) {
      alert("ไม่พบรูปสลิปหลักฐานในรายการที่เลือก");
      return;
    }

    setIsZipping(true);
    setZipProgress({ current: 0, total: validSlips.length, text: "กำลังเตรียมดาวน์โหลดรูปภาพ..." });

    try {
      const zip = new JSZip();
      const folder = zip.folder("slips") || zip;

      for (let i = 0; i < validSlips.length; i++) {
        const item = validSlips[i];
        setZipProgress({ 
          current: i + 1, 
          total: validSlips.length, 
          text: `กำลังดาวน์โหลดรูปสลิป ${i + 1}/${validSlips.length} (บ้าน ${item.houseNumber})` 
        });

        try {
          const response = await fetch(item.slipImageUrl);
          const blob = await response.blob();
          const ext = item.slipImageUrl.split(".").pop()?.split("?")[0] || "jpg";
          const dateStr = item.paidAt ? new Date(item.paidAt).toISOString().split("T")[0] : "nodate";
          const safeHouse = String(item.houseNumber).replace(/[/\\?%*:|"<>]/g, "-");
          const fileName = `slip_TX#${item.id}_บ้าน${safeHouse}_${dateStr}.${ext}`;
          
          folder.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to download image for tx #${item.id}`, err);
        }
      }

      setZipProgress({ current: validSlips.length, total: validSlips.length, text: "กำลังบีบอัดไฟล์ ZIP..." });
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const nowStr = new Date().toISOString().split("T")[0];
      saveAs(zipBlob, `slips_export_${nowStr}.zip`);
      
    } catch (error) {
      console.error("ZIP creation error:", error);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ ZIP");
    } finally {
      setIsZipping(false);
    }
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
        setSelectedIds(prev => prev.filter(id => id !== voidConfirmId));
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

  const hasActiveFilters = Boolean(search || startDate || endDate || monthYear || channel !== "all" || status !== "verified");

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setStatus("verified");
    setChannel("all");
    setMonthYear("");
    setSortBy("paidAt");
    setSortOrder("desc");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const selectedValidCount = selectedIds.length;
  const selectedTotalAmount = data
    .filter(d => selectedIds.includes(d.id))
    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

  const isAllCurrentPageSelected = data.length > 0 && data.filter(d => d.slipStatus !== "voided").every(d => selectedIds.includes(d.id));

  // Summary Report URL generator
  const summaryReportUrl = `/dashboard/history/summary-report?${new URLSearchParams({
    startDate,
    endDate,
    status,
    channel,
    monthYear,
    search
  }).toString()}`;

  return (
    <div className="font-sans pb-24 relative">
      {/* Unified Master Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* 1. Header Section */}
        <div className="p-6 lg:p-7 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B58F2] to-[#7E7BFF] flex items-center justify-center text-white shadow-md shadow-[#5B58F2]/25 shrink-0">
              <History size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-bold text-2xl text-slate-900 tracking-tight">ประวัติการรับชำระเงิน</h1>
                <span className="bg-[#EEF0FF] text-[#5B58F2] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D5D9FF]">
                  {totalCount.toLocaleString()} รายการ
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">ตรวจสอบบันทึกการชำระเงินย้อนหลัง ใบเสร็จรับเงิน และประวัติการโอน</p>
            </div>
          </div>

          {/* Header Controls: Actions, Report, View Switcher & Export */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("detailed")}
                aria-label="มุมมองละเอียด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "detailed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={14} /> ละเอียด
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="มุมมองการ์ด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={14} /> การ์ด
              </button>
            </div>

            {/* Print Summary Report */}
            <Link
              href={summaryReportUrl}
              target="_blank"
              className="h-10 px-3.5 flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="พิมพ์รายงานสรุปยอดนำส่งเงินประจำวัน / งวด"
            >
              <FileSpreadsheet size={15} className="text-indigo-600" />
              <span className="hidden sm:inline">สรุปยอดรายงาน</span>
            </Link>

            {/* Bulk Slips ZIP Download */}
            <button
              onClick={() => handleDownloadSlipsZip()}
              disabled={isZipping || data.length === 0}
              className="h-10 px-3.5 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="ดาวน์โหลดรูปสลิปทั้งหมดเป็น ZIP"
            >
              <Archive size={15} className="text-slate-500" />
              <span className="hidden sm:inline">สลิปทั้งหมด (ZIP)</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              aria-label="ส่งออก CSV"
              className="h-10 px-3.5 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Download size={15} className="text-slate-500" />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Toolbar Filters Bar */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/60 relative z-20">
          <div className="flex flex-col lg:flex-row flex-wrap gap-3 items-stretch lg:items-center justify-between">
            
            {/* Search autocomplete */}
            <div className="relative w-full lg:w-80">
              <SearchAutocomplete
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={() => { setPage(1); setSearch(searchInput); }}
                placeholder="ค้นหาบ้านเลขที่, ชื่อ, Ref Code..."
                className="w-full lg:w-80 focus:w-full lg:focus:w-80 !bg-white hover:!bg-slate-50 border-slate-200 focus:!bg-white focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 shadow-none text-sm rounded-xl transition-all"
              />
            </div>

            {/* Dropdown Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-start lg:justify-end">
              <div className="w-32">
                <CustomSelect
                  value={status}
                  onChange={(val) => { setStatus(val); setPage(1); }}
                  placeholder="สถานะ"
                  options={[
                    { value: "verified", label: "สำเร็จ" },
                    { value: "all", label: "ทุกสถานะ" },
                    { value: "voided", label: "ยกเลิกแล้ว" },
                  ]}
                />
              </div>

              <div className="w-32">
                <CustomSelect
                  value={channel}
                  onChange={(val) => { setChannel(val); setPage(1); }}
                  placeholder="ช่องทาง"
                  options={[
                    { value: "all", label: "ทุกช่องทาง" },
                    { value: "line", label: "LINE Bot" },
                    { value: "web", label: "เว็บไซต์" },
                  ]}
                />
              </div>

              <div className="w-36">
                <MonthPicker
                  value={monthYear}
                  onChange={(val) => { setMonthYear(val); setPage(1); }}
                  colorTheme="blue"
                  buttonClassName="w-full flex items-center justify-between px-3 h-10 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold shadow-none focus:outline-none focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 transition-all cursor-pointer text-slate-700"
                />
              </div>

              <div className="w-32">
                <DatePicker
                  value={startDate}
                  onChange={(val) => { setStartDate(val); setPage(1); }}
                  placeholder="จากวันที่"
                />
              </div>

              <div className="w-32">
                <DatePicker
                  value={endDate}
                  onChange={(val) => { setEndDate(val); setPage(1); }}
                  placeholder="ถึงวันที่"
                />
              </div>

              {/* Sort Order Selector (for Grid View or Mobile) */}
              <div className="w-40">
                <CustomSelect
                  value={`${sortBy}_${sortOrder}`}
                  onChange={(val) => {
                    const [field, order] = val.split("_") as [any, any];
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                  }}
                  placeholder="การเรียงลำดับ"
                  options={[
                    { value: "paidAt_desc", label: "วันที่ (ล่าสุดก่อน)" },
                    { value: "paidAt_asc", label: "วันที่ (เก่าสุดก่อน)" },
                    { value: "houseNumber_asc", label: "บ้านเลขที่ (น้อยไปมาก)" },
                    { value: "houseNumber_desc", label: "บ้านเลขที่ (มากไปน้อย)" },
                    { value: "amount_desc", label: "ยอดเงิน (มากไปน้อย)" },
                    { value: "amount_asc", label: "ยอดเงิน (น้อยไปมาก)" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-medium">ตัวกรองที่เปิดใช้:</span>
              
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs">
                  ค้นหา: &ldquo;{search}&rdquo;
                  <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}

              {status !== "verified" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs">
                  สถานะ: {status === "all" ? "ทั้งหมด" : "ยกเลิกแล้ว"}
                  <button onClick={() => { setStatus("verified"); setPage(1); }} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}

              {channel !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs">
                  ช่องทาง: {channel === "line" ? "LINE Bot" : "เว็บไซต์"}
                  <button onClick={() => { setChannel("all"); setPage(1); }} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}

              {monthYear && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs">
                  งวด: {formatThaiMonth(monthYear)}
                  <button onClick={() => { setMonthYear(""); setPage(1); }} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}

              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs">
                  ช่วงวันที่: {startDate || "เริ่มต้น"} ถึง {endDate || "ปัจจุบัน"}
                  <button onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-[#5B58F2] hover:underline font-semibold ml-1 cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* 3. Master Content Body */}
        <div className="p-6 lg:p-8 bg-slate-50/30">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 text-center py-16 px-6 flex flex-col items-center justify-center shadow-2xs">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">ไม่พบประวัติการชำระเงิน</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                ไม่พบข้อมูลรายการชำระเงินที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid Cards Mode */
            <div>
              {/* Compact Select All in Grid View */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleSelectAllCurrentPage}
                    className="w-4 h-4 rounded text-[#5B58F2] focus:ring-[#5B58F2] border-slate-300 cursor-pointer"
                  />
                  <span>เลือกทั้งหมด ({data.filter(d => d.slipStatus !== "voided").length})</span>
                </label>

                {selectedIds.length > 0 && (
                  <span className="text-xs font-semibold text-[#5B58F2] bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    เลือกแล้ว {selectedIds.length} รายการ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.map((item, index) => {
                  const isVoided = item.slipStatus === "voided";
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className={`bg-white rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                        isSelected 
                          ? "border-[#5B58F2] ring-2 ring-[#5B58F2]/20 bg-indigo-50/10" 
                          : isVoided 
                          ? "border-slate-200 bg-slate-50/50 opacity-80" 
                          : "border-slate-200/90 hover:border-[#5B58F2]/40"
                      }`}
                    >
                      <div>
                        {/* Card Top: Checkbox, House & Channel */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {!isVoided && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                                className="w-4 h-4 rounded text-[#5B58F2] focus:ring-[#5B58F2] border-slate-300 cursor-pointer"
                              />
                            )}
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                              บ้าน {item.houseNumber}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-slate-400">
                              #{item.id}
                            </span>
                          </div>

                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            isVoided 
                              ? "bg-slate-100 text-slate-500 border-slate-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {isVoided ? <Ban size={11} /> : <CheckCircle2 size={11} />}
                            {isVoided ? "ยกเลิกแล้ว" : "สำเร็จ"}
                          </span>
                        </div>

                        {/* Owner & Sender */}
                        <div className="space-y-1.5 mb-3">
                          <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                            <User size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{item.ownerName || "ไม่ระบุชื่อ"}</span>
                          </div>

                          {item.senderName && item.senderName !== item.ownerName && (
                            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">ผู้โอน:</span>
                              <span className="truncate">{item.senderName}</span>
                            </div>
                          )}

                          {/* Months Tag */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.months && item.months.length > 0 ? (
                              item.months.map((m: string) => (
                                <span key={m} className="text-[10px] font-bold bg-[#EEF0FF] text-[#5B58F2] px-2 py-0.5 rounded-md">
                                  {formatThaiMonth(m)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </div>

                        {/* Slip Thumbnail (if available) */}
                        {item.slipImageUrl && item.slipImageUrl !== "pending" && (
                          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-50 mb-3 group/img">
                            <img 
                              src={item.slipImageUrl} 
                              alt={`Slip #${item.id}`} 
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <SlipModalButton imageUrl={item.slipImageUrl}>
                                <span className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                                  <Eye size={12} /> ขยายดู
                                </span>
                              </SlipModalButton>
                            </div>
                          </div>
                        )}

                        {/* Audit Trail Info (Verified By) */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 pt-1">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Shield size={11} /> ผู้ตรวจ:
                          </span>
                          <span className={`font-medium px-2 py-0.5 rounded-md ${
                            item.verifiedBy === "line_bot"
                              ? "bg-purple-50 text-purple-700"
                              : item.verifiedBy === "admin_cash"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {item.verifiedBy === "line_bot" ? "🤖 อัตโนมัติ (LINE)" : item.verifiedBy || "เจ้าหน้าที่"}
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom: Amount, Date & Actions */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[11px] text-slate-400 font-medium">
                            {item.paidAt ? new Date(item.paidAt).toLocaleDateString("th-TH", {
                              day: "numeric", month: "short", year: "2-digit"
                            }) : "-"}
                          </div>
                          <span className={`font-mono font-bold text-base ${isVoided ? "text-slate-400 line-through" : "text-emerald-700"}`}>
                            ฿{parseFloat(item.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isVoided && (
                            <Link
                              href={`/dashboard/history/${item.id}/receipt`}
                              target="_blank"
                              className="flex-1 h-8.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                            >
                              <Printer size={13} /> พิมพ์ใบเสร็จ
                            </Link>
                          )}
                          {!isVoided && (
                            <button
                              onClick={() => handleVoidClick(item.id)}
                              className="h-8.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                              title="ยกเลิกรายการ"
                            >
                              ยกเลิก
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Detailed Table Mode */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {/* Checkbox Column */}
                      <th className="px-4 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllCurrentPageSelected}
                          onChange={handleSelectAllCurrentPage}
                          className="w-4 h-4 rounded text-[#5B58F2] focus:ring-[#5B58F2] border-slate-300 cursor-pointer"
                        />
                      </th>

                      {/* ID / Slip */}
                      <th 
                        onClick={() => toggleSort("id")}
                        className="px-4 py-3.5 cursor-pointer hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>รหัส / สลิป</span>
                          {sortBy === "id" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-[#5B58F2]" /> : <ArrowDown size={12} className="text-[#5B58F2]" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-300" />
                          )}
                        </div>
                      </th>

                      {/* House Number */}
                      <th 
                        onClick={() => toggleSort("houseNumber")}
                        className="px-4 py-3.5 cursor-pointer hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>บ้านเลขที่</span>
                          {sortBy === "houseNumber" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-[#5B58F2]" /> : <ArrowDown size={12} className="text-[#5B58F2]" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-300" />
                          )}
                        </div>
                      </th>

                      <th className="px-4 py-3.5">เจ้าบ้าน / ผู้โอน</th>
                      <th className="px-4 py-3.5">งวดที่ชำระ</th>
                      <th className="px-4 py-3.5">ช่องทาง</th>

                      {/* Paid Date */}
                      <th 
                        onClick={() => toggleSort("paidAt")}
                        className="px-4 py-3.5 cursor-pointer hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>วันที่ชำระ</span>
                          {sortBy === "paidAt" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-[#5B58F2]" /> : <ArrowDown size={12} className="text-[#5B58F2]" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-300" />
                          )}
                        </div>
                      </th>

                      {/* Amount */}
                      <th 
                        onClick={() => toggleSort("amount")}
                        className="px-4 py-3.5 text-right cursor-pointer hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>ยอดเงิน</span>
                          {sortBy === "amount" ? (
                            sortOrder === "asc" ? <ArrowUp size={12} className="text-[#5B58F2]" /> : <ArrowDown size={12} className="text-[#5B58F2]" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-300" />
                          )}
                        </div>
                      </th>

                      <th className="px-4 py-3.5 text-center">ผู้ตรวจสอบ</th>
                      <th className="px-4 py-3.5 text-center">สถานะ</th>
                      <th className="px-4 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.map((item) => {
                      const isVoided = item.slipStatus === "voided";
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? "bg-indigo-50/30" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3.5 text-center">
                            {!isVoided && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                                className="w-4 h-4 rounded text-[#5B58F2] focus:ring-[#5B58F2] border-slate-300 cursor-pointer"
                              />
                            )}
                          </td>

                          {/* ID & Slip */}
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-2">
                              <span>#{item.id}</span>
                              {item.slipImageUrl && item.slipImageUrl !== "pending" && (
                                <SlipModalButton imageUrl={item.slipImageUrl} buttonStyle="history" />
                              )}
                            </div>
                          </td>

                          {/* House Number */}
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            บ้าน {item.houseNumber}
                          </td>

                          {/* Owner & Sender */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 truncate max-w-[160px]">
                              {item.ownerName || "ไม่ระบุชื่อ"}
                            </div>
                            {item.senderName && item.senderName !== item.ownerName && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                โอนโดย: {item.senderName}
                              </div>
                            )}
                          </td>

                          {/* Months */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {item.months && item.months.length > 0 ? (
                                item.months.map((m: string) => (
                                  <span key={m} className="text-[10px] font-bold bg-[#EEF0FF] text-[#5B58F2] px-2 py-0.5 rounded-md">
                                    {formatThaiMonth(m)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </div>
                          </td>

                          {/* Channel */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {item.paidVia === "LINE Bot" ? (
                                <><Smartphone size={12} className="text-[#5B58F2]" /> LINE Bot</>
                              ) : (
                                <><Globe size={12} className="text-slate-400" /> Web</>
                              )}
                            </span>
                          </td>

                          {/* Paid At */}
                          <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                            {item.paidAt ? new Date(item.paidAt).toLocaleDateString("th-TH", {
                              day: "numeric", month: "short", year: "2-digit",
                              hour: "2-digit", minute: "2-digit"
                            }) : "-"}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                            <span className={isVoided ? "text-slate-400 line-through" : "text-emerald-700"}>
                              ฿{parseFloat(item.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Verified By (Audit Trail) */}
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                              item.verifiedBy === "line_bot"
                                ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                : item.verifiedBy === "admin_cash"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {item.verifiedBy === "line_bot" ? "🤖 อัตโนมัติ" : item.verifiedBy || "เจ้าหน้าที่"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              isVoided 
                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {isVoided ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                              {isVoided ? "ยกเลิก" : "สำเร็จ"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isVoided && (
                                <Link
                                  href={`/dashboard/history/${item.id}/receipt`}
                                  target="_blank"
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                  title="พิมพ์ใบเสร็จ"
                                >
                                  <Printer size={15} />
                                </Link>
                              )}
                              {!isVoided && (
                                <button
                                  onClick={() => handleVoidClick(item.id)}
                                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="ยกเลิกการชำระเงิน"
                                >
                                  ยกเลิก
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 4. Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 lg:p-5 border-t border-slate-100 bg-white">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* 5. Floating Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedValidCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex flex-wrap items-center gap-4 border border-slate-700/80 backdrop-blur-lg"
          >
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <div className="w-6 h-6 rounded-full bg-[#5B58F2] flex items-center justify-center text-white text-xs font-bold font-mono">
                {selectedValidCount}
              </div>
              <span className="text-xs font-medium text-slate-300">
                เลือกแล้ว (฿{selectedTotalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })})
              </span>
            </div>

            {/* Bulk Print Receipts */}
            <Link
              href={`/dashboard/history/bulk-receipt?ids=${selectedIds.join(",")}`}
              target="_blank"
              className="flex items-center gap-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5B58F2]/30"
            >
              <Printer size={14} /> พิมพ์ใบเสร็จที่เลือก ({selectedValidCount})
            </Link>

            {/* Download Selected Slips as ZIP */}
            <button
              onClick={() => handleDownloadSlipsZip()}
              disabled={isZipping}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-slate-600 cursor-pointer disabled:opacity-50"
            >
              <Archive size={14} /> ดาวน์โหลดสลิป ZIP ({selectedValidCount})
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZIP Progress Modal */}
      {isZipping && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B58F2] flex items-center justify-center mx-auto mb-4">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">กำลังรวบรวมรูปสลิป...</h3>
            <p className="text-xs text-slate-500 mb-4">{zipProgress.text}</p>
            
            {/* Progress Bar */}
            {zipProgress.total > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                <div 
                  className="bg-[#5B58F2] h-full transition-all duration-300"
                  style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}
                />
              </div>
            )}
            <div className="text-[11px] font-mono text-slate-400">
              {zipProgress.current} / {zipProgress.total} รูปภาพ
            </div>
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
