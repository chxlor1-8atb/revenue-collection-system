"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import SlipReviewForm from "./SlipReviewForm";
import { 
  FileSignature, 
  Loader2, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  LayoutGrid, 
  List, 
  User, 
  MapPin, 
  ExternalLink, 
  Calendar, 
  CheckSquare 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LottieIcon from "@/components/LottieIcon";
import LiveQrCountdown from "@/components/LiveQrCountdown";
import CurrencyDisplay from "@/components/CurrencyDisplay";

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default function ReviewClient() {
  const [activeTab, setActiveTab] = useState<"pending" | "waiting">("pending");
  const [viewMode, setViewModeState] = useState<"grid" | "detailed">("grid");

  // Load and save viewMode to localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("review_view_mode");
      if (savedMode === "grid" || savedMode === "detailed") {
        setViewModeState(savedMode);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const [isBulking, setIsBulking] = useState(false);

  const handleBulkApprove = async () => {
    if (!pending || pending.length === 0 || isBulking) return;
    
    // Only safely bulk approve slips where amountClaimedByPayer perfectly matches the invoice amount
    const safeToApprove = pending.filter((tx: any) => {
      const invTotal = tx.invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;
      return parseFloat(tx.amountClaimedByPayer || "0") === invTotal;
    });

    if (safeToApprove.length === 0) {
      alert("ไม่พบสลิปที่ยอดเงินตรงกับบิล 100% เลยครับ กรุณาตรวจสอบและอนุมัติรายรายการเพื่อป้องกันข้อผิดพลาดทางบัญชี");
      return;
    }

    if (!confirm(`ระบบตรวจพบสลิปที่ยอดเงินโอนตรงกับบิลพอดีจำนวน ${safeToApprove.length} รายการ คุณต้องการอนุมัติทั้งหมดพร้อมกันทันทีใช่หรือไม่?`)) {
      return;
    }

    setIsBulking(true);
    let successCount = 0;
    
    for (const tx of safeToApprove as any[]) {
      try {
        const res = await fetch("/api/transactions/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transactionId: tx.id, 
            status: 'verified',
            verifiedAmount: tx.amountClaimedByPayer
          })
        });
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Bulk approve failed for", tx.id);
      }
    }
    
    setIsBulking(false);
    mutate();
    alert(`อนุมัติสำเร็จ ${successCount} รายการ`);
  };

  const setViewMode = (mode: "grid" | "detailed") => {
    setViewModeState(mode);
    try {
      localStorage.setItem("review_view_mode", mode);
    } catch (e) {
      // ignore
    }
  };

  // Poll every 3 seconds
  const { data, error, isLoading, mutate, isValidating } = useSWR('/api/transactions/review', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const pending = data?.pending || [];
  const waiting = data?.waiting || [];

  return (
    <div className="font-sans pb-12">
      {/* Unified Master Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* 1. Header Section */}
        <div className="hidden sm:flex p-6 lg:p-7 border-b border-slate-100 flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <LottieIcon src="/icons/icons8-document.json" size={54} className="shrink-0" loop autoplay />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">รายการตรวจสอบสลิป</h1>
              <p className="text-slate-500 text-sm mt-0.5">ตรวจสอบและยืนยันยอดเงินที่ผู้ใช้งานโอนผ่าน QR Code</p>
            </div>
          </div>

          {activeTab === "pending" && pending.length > 1 && (
            <button
              onClick={handleBulkApprove}
              disabled={isBulking}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isBulking ? <Loader2 size={15} className="animate-spin" /> : <CheckSquare size={15} />}
              <span>อนุมัติสลิปที่ยอดตรงทั้งหมด ({pending.length})</span>
            </button>
          )}
        </div>

        {/* 2. Toolbar & Segmented Tabs Bar */}
        <div className="p-3 sm:px-6 lg:px-7 sm:py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tabs Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSignature size={14} className={activeTab === "pending" ? "text-[#5B58F2]" : "text-slate-400"} />
              <span>รอตรวจสอบสลิป</span>
              {pending.length > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                  {pending.length}
                </span>
              ) : (
                <span className="bg-slate-300 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  0
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("waiting")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "waiting"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <QrCode size={14} className={activeTab === "waiting" ? "text-amber-500" : "text-slate-400"} />
              <span>กำลังทำรายการ (QR Code)</span>
              {waiting.length > 0 ? (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                  {waiting.length}
                </span>
              ) : (
                <span className="bg-slate-300 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  0
                </span>
              )}
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("detailed")}
                aria-label="มุมมองละเอียด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "detailed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={14} /> ละเอียด
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="มุมมองการ์ด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={14} /> การ์ด
              </button>
            </div>
          </div>
        </div>

        {/* 3. Master Content Body */}
        <div className="p-6 lg:p-8 bg-slate-50/30">
          
          {/* Waiting View: Live Scanning Grid Cards or Table */}
          {activeTab === "waiting" && (
            <div>
              {isLoading ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : waiting.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-18 h-18 bg-amber-50 rounded-3xl flex items-center justify-center mb-4 border border-amber-100 text-amber-500 shadow-xs">
                    <QrCode size={34} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">ไม่มีผู้ใช้งานกำลังสแกนจ่ายในขณะนี้</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    เมื่อมีผู้ใช้เปิดหน้า QR Code ชำระเงิน รายการจะตรวจจับและปรากฏที่นี่แบบเรียลไทม์อัตโนมัติ
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50/90 rounded-2xl border border-amber-200/80 p-4 lg:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                        <QrCode size={20} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-amber-950">ผู้ใช้งานกำลังสแกนจ่าย QR Code ({waiting.length} รายการ)</h2>
                        <p className="text-xs text-amber-700 mt-0.5">ระบบจะตรวจจับและอัปเดตสลิปเข้ามาในระบบอัตโนมัติทันทีที่แนบ</p>
                      </div>
                    </div>
                  </div>

                  {viewMode === "grid" ? (
                    /* Grid Cards Mode */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {waiting.map((tx: any, index: number) => {
                        const firstInv = tx.invoices?.[0];
                        const totalInvoices = tx.invoices?.length || 0;
                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="bg-white rounded-2xl p-5 border border-amber-200/90 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

                            <div>
                              {/* Card Top: House Badge & Status */}
                              <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                    {firstInv ? `บ้าน ${firstInv.houseNumber}` : `#${tx.id}`}
                                  </span>
                                  {totalInvoices > 1 && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                                      +{totalInvoices - 1} บิล
                                    </span>
                                  )}
                                </div>

                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                  สแกนจ่าย
                                </span>
                              </div>

                              {/* Owner & Invoice Month */}
                              <div className="space-y-1 mb-4">
                                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 truncate">
                                  <User size={14} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{firstInv?.ownerName || "ผู้ชำระเงิน"}</span>
                                </div>
                                
                                {firstInv && (
                                  <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                                    <Calendar size={12} className="text-slate-400 shrink-0" />
                                    <span>งวด: {formatThaiMonth(firstInv.monthYear)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Bottom: Amount & Live QR Countdown */}
                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">ยอดเงิน</span>
                                <CurrencyDisplay amount={tx.amount} size="lg" variant="warning" />
                              </div>

                              {/* Bottom Status & Live Countdown */}
                              <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50/70 -mx-5 -mb-5 p-2.5 px-4 rounded-b-2xl border-t border-amber-100">
                                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                  <Loader2 size={12} className="animate-spin text-amber-500" />
                                  กำลังรอแนบสลิป
                                </span>
                                
                                {/* Live Countdown Badge */}
                                <LiveQrCountdown createdAt={tx.createdAt} durationSeconds={180} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Detailed Table Mode */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-5 py-3.5">รหัส</th>
                            <th className="px-5 py-3.5">บ้านเลขที่</th>
                            <th className="px-5 py-3.5">ชื่อผู้ชำระ</th>
                            <th className="px-5 py-3.5">งวดบิล</th>
                            <th className="px-5 py-3.5 text-right">ยอดเงิน</th>
                            <th className="px-5 py-3.5 text-center">สถานะ</th>
                            <th className="px-5 py-3.5 text-right">นับถอยหลัง QR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {waiting.map((tx: any) => {
                            const firstInv = tx.invoices?.[0];
                            const totalInvoices = tx.invoices?.length || 0;
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">#{tx.id}</td>
                                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                                  {firstInv ? `บ้าน ${firstInv.houseNumber}` : "-"}
                                  {totalInvoices > 1 && (
                                    <span className="ml-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                                      +{totalInvoices - 1}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 font-semibold text-slate-800">{firstInv?.ownerName || "ผู้ชำระเงิน"}</td>
                                <td className="px-5 py-3.5 text-slate-600 text-xs">{firstInv ? formatThaiMonth(firstInv.monthYear) : "-"}</td>
                                <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600">
                                  <CurrencyDisplay amount={tx.amount} size="sm" variant="warning" />
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Loader2 size={11} className="animate-spin text-amber-500" />
                                    กำลังรอแนบสลิป
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right text-xs font-mono text-slate-500">
                                  <div className="flex flex-col items-end gap-0.5">
                                    <LiveQrCountdown createdAt={tx.createdAt} durationSeconds={180} />
                                    <span className="text-[10px] text-slate-400">
                                      เริ่ม {new Date(tx.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pending Review View: Grid Cards or Detailed Cards */}
          {activeTab === "pending" && (
            <div>
              {isLoading ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-pulse space-y-3">
                      <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
                      <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : pending.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 text-center py-16 px-6 flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100 shadow-xs">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mb-1">ไม่มีรายการสลิปค้างตรวจสอบ</h2>
                  <p className="text-slate-500 text-xs max-w-sm">
                    ยอดเยี่ยมมาก! คุณได้ตรวจสอบสลิปการโอนเงินที่แจ้งเข้ามาครบถ้วนหมดแล้ว
                  </p>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-6"}>
                  {pending.map((tx: any, index: number) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <SlipReviewForm 
                        transaction={tx} 
                        layout={viewMode}
                        onReviewed={() => mutate()} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
