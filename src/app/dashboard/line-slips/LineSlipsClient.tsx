"use client";

import { useState, useTransition, useEffect } from "react";
import { searchHouseByNumber, getUnpaidInvoicesForHouse, approveLineSlip, rejectLineSlip } from "./actions";
import { CheckCircle2, Clock, Search, List, LayoutGrid, Smartphone, AlertCircle, Sparkles, X, Ban, Eye, FileText, User, Link2, Trash2 } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";
import ConfirmModal from "@/components/ConfirmModal";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TablePagination from "@/components/TablePagination";

interface LineSlipsClientProps {
  slips: any[];
  activeTab: "pending" | "verified";
  currentPage: number;
  totalPages: number;
  pendingCount: number;
  verifiedCount: number;
  limit?: number;
}

export default function LineSlipsClient({ 
  slips, 
  activeTab, 
  currentPage, 
  totalPages, 
  pendingCount, 
  verifiedCount,
  limit = 10
}: LineSlipsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"detailed" | "grid">("grid");
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [searchHouseNumber, setSearchHouseNumber] = useState("");
  const [foundHouse, setFoundHouse] = useState<any | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("line_slips_view_mode");
    if (saved === "detailed" || saved === "grid") setViewMode(saved);
  }, []);

  const toggleViewMode = (mode: "detailed" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("line_slips_view_mode", mode);
  };

  const handleTabChange = (tab: "pending" | "verified") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('page'); // Reset to page 1 when changing tabs
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const updateUrlParams = (page: number, newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');

    if (newLimit !== 10) params.set('limit', newLimit.toString());
    else params.delete('limit');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams(page, limit);
  };

  const openMatchModal = async (slip: any) => {
    setSelectedSlip(slip);
    setSearchHouseNumber(slip.houseNumber || "");
    setFoundHouse(null);
    setUnpaidInvoices([]);
    setSelectedInvoices([]);
    setErrorMsg("");

    // If houseNumber already exists from LINE text, search immediately
    if (slip.houseNumber) {
      await handleSearchHouseForSlip(slip.houseNumber, parseFloat(slip.amount || "0"));
    }
  };

  const handleSearchHouseForSlip = async (houseNumber: string, slipAmt: number) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const house = await searchHouseByNumber(houseNumber);
      if (house) {
        setFoundHouse(house);
        const invoices = await getUnpaidInvoicesForHouse(house.id);
        setUnpaidInvoices(invoices);
        const totalDebt = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0);
        if (totalDebt > 0 && slipAmt === totalDebt) {
          setSelectedInvoices(invoices.map((i: any) => i.id));
        }
      } else {
        setFoundHouse(null);
        setUnpaidInvoices([]);
        setErrorMsg("ไม่พบบ้านเลขที่นี้ในระบบ");
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาดในการค้นหาบ้าน");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInvoice = (id: number) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(i => i !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  const handleApprove = async () => {
    if (!foundHouse) return;
    setIsLoading(true);
    setErrorMsg("");

    const res = await approveLineSlip(
      selectedSlip.id,
      foundHouse.id,
      selectedInvoices,
      parseFloat(selectedSlip.amount || "0"),
      selectedSlip.imageUrl || ""
    );

    setIsLoading(false);
    if (res.success) {
      setSelectedSlip(null);
      router.refresh();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleRejectClick = (slipId: number) => {
    setRejectConfirmId(slipId);
  };

  const executeReject = async () => {
    if (!rejectConfirmId) return;
    setIsLoading(true);
    try {
      const res = await rejectLineSlip(rejectConfirmId);
      if (res.success) {
        setRejectConfirmId(null);
        router.refresh();
      } else {
        alert(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchHouse = (houseNumber: string) => {
    handleSearchHouseForSlip(houseNumber, slipAmount);
  };
  
  const slipAmount = parseFloat(selectedSlip?.amount || "0");
  const selectedTotal = unpaidInvoices
    .filter(i => selectedInvoices.includes(i.id))
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div className="font-sans space-y-6">
      {/* Master Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col font-sans mb-8">
        
        {/* Header & Tabs */}
        <div className="p-6 lg:p-7 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B58F2] to-[#7E7BFF] flex items-center justify-center text-white shadow-md shadow-[#5B58F2]/25 shrink-0">
              <Smartphone size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-2xl text-slate-900 tracking-tight">สลิปจาก LINE</h1>
                <span className="bg-[#EEF0FF] text-[#5B58F2] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D5D9FF]">
                  {pendingCount + verifiedCount} สลิปทั้งหมด
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">จัดการสลิปการโอนเงินที่แจ้งผ่าน LINE Bot และจับคู่ใบแจ้งหนี้เพื่อออกใบเสร็จ</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Tab Switcher Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => handleTabChange("pending")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "pending" 
                    ? "bg-white text-[#5B58F2] shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock size={13} />
                <span>รอดำเนินการ</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-200/60">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange("verified")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "verified" 
                    ? "bg-white text-emerald-700 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles size={13} />
                <span>สำเร็จแล้ว</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                  {verifiedCount}
                </span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => toggleViewMode("detailed")}
                aria-label="มุมมองละเอียด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "detailed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={14} /> ละเอียด
              </button>
              <button
                onClick={() => toggleViewMode("grid")}
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

        {/* Content Body */}
        {viewMode === "grid" ? (
          <div className="p-6 lg:p-8 bg-slate-50/30 min-h-[400px]">
            {slips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-slate-800 font-bold mb-1">
                  {activeTab === "pending" ? "ไม่มีสลิปจาก LINE ที่รอดำเนินการ 🎉" : "ยังไม่มีประวัติสลิปที่สำเร็จ"}
                </h3>
                <p className="text-slate-500 text-xs">
                  {activeTab === "pending" ? "สลิปที่ผู้ใช้อัปโหลดผ่าน LINE Bot จะปรากฏที่นี่" : "สลิปที่ตรวจและอนุมัติแล้วจะถูกบันทึกลงระบบ"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {slips.map((slip) => (
                  <div 
                    key={slip.id} 
                    className="bg-white border border-slate-200/90 hover:border-[#5B58F2]/40 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
                  >
                    {/* Top: Large Slip Visual Showcase / Cover */}
                    <div className="relative h-48 sm:h-52 bg-slate-900 overflow-hidden group/img">
                      {slip.imageUrl ? (
                        <>
                          {/* Blurred background fill */}
                          <img 
                            src={slip.imageUrl} 
                            alt="Slip background" 
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40" 
                          />
                          {/* Sharp full slip image */}
                          <img 
                            src={slip.imageUrl} 
                            alt="Slip" 
                            className="relative w-full h-full object-contain p-2 group-hover/img:scale-105 transition-transform duration-300" 
                          />
                          {/* Hover zoom overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <SlipModalButton imageUrl={slip.imageUrl}>
                              <span className="px-3.5 py-1.5 bg-white/95 text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform backdrop-blur-sm">
                                <Eye size={14} /> ขยายดูสลิป
                              </span>
                            </SlipModalButton>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-slate-100">
                          <FileText size={28} />
                          <span className="text-xs">ไม่มีรูปสลิป</span>
                        </div>
                      )}

                      {/* Floating Badges on Image */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-2xs border border-white/60">
                          {slip.createdAt ? new Date(slip.createdAt).toLocaleString("th-TH", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          }) : "-"}
                        </span>

                        {activeTab === "verified" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md">
                            <CheckCircle2 size={11} /> ยืนยันสำเร็จ
                          </span>
                        ) : slip.isVerified ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md">
                            <CheckCircle2 size={11} /> สลิปแท้
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md">
                            <Clock size={11} /> รอตรวจสอบ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Details & Action */}
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 bg-white space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
                            ฿{parseFloat(slip.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </span>
                          
                          {slip.houseNumber ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 text-slate-900 text-xs shadow-2xs">
                              <span className="font-sans text-[11px] text-slate-500 font-medium">บ้าน</span>
                              <span className="font-mono font-bold">{slip.houseNumber}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                              <AlertCircle size={12} /> ยังไม่ระบุบ้าน
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate pt-0.5">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{slip.senderName || "ไม่ระบุชื่อผู้โอน"}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {activeTab === "pending" && (
                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => openMatchModal(slip)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5B58F2]/20 cursor-pointer"
                          >
                            <Link2 size={14} /> จับคู่ / อนุมัติ
                          </button>
                          <button
                            onClick={() => handleRejectClick(slip.id)}
                            className="flex items-center justify-center px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            title="ปฏิเสธสลิป"
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 lg:p-8 pt-0 overflow-x-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">เวลาแจ้ง</th>
                    <th className="px-5 py-3.5 w-16 text-center">สลิป</th>
                    <th className="px-5 py-3.5">ยอดเงิน</th>
                    <th className="px-5 py-3.5">ผู้โอนเงิน</th>
                    <th className="px-5 py-3.5">บ้านเลขที่</th>
                    <th className="px-5 py-3.5 text-center">สถานะ</th>
                    {activeTab === "pending" && (
                      <th className="px-5 py-3.5 text-right">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {slips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-slate-500 font-medium">
                        {activeTab === "pending" ? "ไม่มีสลิปจาก LINE ที่รอดำเนินการ" : "ยังไม่มีสลิปที่สำเร็จ"}
                      </td>
                    </tr>
                  ) : (
                    slips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {slip.createdAt ? new Date(slip.createdAt).toLocaleString("th-TH", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          }) : "-"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {slip.imageUrl ? (
                            <SlipModalButton imageUrl={slip.imageUrl}>
                              <img 
                                src={slip.imageUrl} 
                                alt="Slip" 
                                className="w-9 h-9 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-transform cursor-pointer shadow-2xs mx-auto" 
                              />
                            </SlipModalButton>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 text-sm">
                          ฿{parseFloat(slip.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {slip.senderName || "ไม่ระบุชื่อ"}
                        </td>
                        <td className="px-5 py-4">
                          {slip.houseNumber ? (
                            <div className="flex items-center gap-1 text-slate-900">
                              <span className="font-sans text-xs text-slate-400 font-medium">บ้าน</span>
                              <span className="font-mono font-bold text-sm">{slip.houseNumber}</span>
                            </div>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium">ยังไม่ระบุ</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {activeTab === "verified" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> ยืนยันสำเร็จ
                            </span>
                          ) : slip.isVerified ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> สลิปแท้
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <Clock size={12} /> รอตรวจสอบ
                            </span>
                          )}
                        </td>
                        {activeTab === "pending" && (
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openMatchModal(slip)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <Link2 size={12} /> จับคู่
                              </button>
                              <button
                                onClick={() => handleRejectClick(slip.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title="ปฏิเสธ"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={activeTab === 'pending' ? pendingCount : verifiedCount}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={(newLimit) => updateUrlParams(1, newLimit)}
        />
      </div>

      {/* Matching & Approval Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5B58F2] flex items-center justify-center shadow-2xs">
                  <Link2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">จับคู่บ้านและอนุมัติสลิป</h2>
                  <p className="text-xs text-slate-500">เลือกบ้านเลขที่และบิลที่ต้องการตัดชำระเงิน</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-sans flex flex-col md:flex-row gap-6">
              
              {/* Left Column: Slip Details */}
              <div className="w-full md:w-5/12 flex flex-col gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ข้อมูลจากสลิป</div>
                  
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs space-y-2.5">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">ยอดเงินโอน</div>
                      <div className="text-xl font-bold font-mono text-emerald-700">
                        ฿{parseFloat(selectedSlip.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">ผู้โอนเงิน</div>
                      <div className="text-sm font-semibold text-slate-800">{selectedSlip.senderName || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">เวลาที่โอน</div>
                      <div className="text-xs text-slate-600 font-mono">
                        {selectedSlip.createdAt ? new Date(selectedSlip.createdAt).toLocaleString("th-TH") : "-"}
                      </div>
                    </div>
                  </div>

                  {selectedSlip.imageUrl ? (
                    <SlipModalButton imageUrl={selectedSlip.imageUrl}>
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                        <img src={selectedSlip.imageUrl} alt="Slip" className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1">
                          <Eye size={14} /> ดูภาพเต็ม
                        </div>
                      </div>
                    </SlipModalButton>
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      ไม่มีรูปสลิป
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: House and Invoices */}
              <div className="w-full md:w-7/12 flex flex-col">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ค้นหาบ้านเลขที่</div>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <SearchAutocomplete 
                      value={searchHouseNumber}
                      onChange={setSearchHouseNumber}
                      onSubmit={() => handleSearchHouse(searchHouseNumber)}
                      placeholder="ใส่บ้านเลขที่ เช่น 123/4..."
                      className="w-full placeholder:text-slate-400 text-sm focus:ring-[#5B58F2] cursor-text rounded-xl border-slate-200"
                    />
                  </div>
                  <button 
                    onClick={() => handleSearchHouse(searchHouseNumber)}
                    disabled={isLoading || !searchHouseNumber}
                    className="bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-5 h-[42px] rounded-xl font-bold text-xs transition-all shadow-md shadow-[#5B58F2]/20 disabled:opacity-50 shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Search size={14} /> ค้นหา
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs border border-red-100 font-medium flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {foundHouse && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-base">บ้านเลขที่ {foundHouse.houseNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {foundHouse.zone ? `ชุมชน${foundHouse.zone}` : "พบบ้านแล้ว"}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                      <User size={13} /> เจ้าบ้าน: <strong className="font-semibold">{foundHouse.ownerName}</strong>
                    </div>
                  </div>
                )}

                {foundHouse && (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        บิลค้างชำระ ({unpaidInvoices.length} รายการ)
                      </div>
                      <span className="text-[11px] text-slate-400">เลือกบิลที่ต้องการตัดยอด</span>
                    </div>
                    
                    {unpaidInvoices.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                        บ้านหลังนี้ไม่มีบิลค้างชำระ 🎉
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {unpaidInvoices.map(inv => (
                          <label 
                            key={inv.id} 
                            className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedInvoices.includes(inv.id) 
                                ? "bg-indigo-50/50 border-[#5B58F2] ring-1 ring-[#5B58F2]/30" 
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-[#5B58F2] rounded border-slate-300 focus:ring-[#5B58F2] cursor-pointer"
                              checked={selectedInvoices.includes(inv.id)}
                              onChange={() => toggleInvoice(inv.id)}
                            />
                            <div className="ml-3 flex-1 flex justify-between items-center text-xs">
                              <div>
                                <div className="font-bold text-slate-800">งวดประจำเดือน {inv.monthYear}</div>
                                <div className="text-[11px] text-slate-400 font-mono">บิล #{inv.id}</div>
                              </div>
                              <div className="font-mono font-bold text-slate-800 text-sm">
                                ฿{parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
                <span className="text-slate-500">ยอดสลิป: <strong className="text-emerald-700 font-mono font-bold text-sm">฿{slipAmount.toFixed(2)}</strong></span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">ยอดบิลที่เลือก: <strong className={`font-mono font-bold text-sm ${selectedTotal === slipAmount ? "text-emerald-700" : "text-amber-600"}`}>฿{selectedTotal.toFixed(2)}</strong></span>
                
                {selectedTotal !== slipAmount && selectedTotal > 0 && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    (ยอดไม่ตรงกัน)
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedSlip(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isLoading || !foundHouse}
                  className="flex-1 sm:flex-initial px-6 py-2 bg-[#5B58F2] hover:bg-[#4A47D1] text-white rounded-xl transition-all font-bold text-xs disabled:opacity-50 shadow-md shadow-[#5B58F2]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : "ยืนยันอนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!rejectConfirmId}
        onClose={() => setRejectConfirmId(null)}
        onConfirm={executeReject}
        isLoading={isLoading}
        title="ปฏิเสธสลิป LINE"
        description="คุณแน่ใจหรือไม่ที่จะปฏิเสธสลิปใบนี้ ?"
        warningText="สลิปนี้จะถูกลบออกจากระบบ และไม่สามารถนำกลับมาตรวจสอบได้อีก"
        confirmText="ใช่, ปฏิเสธสลิป"
      />
    </div>
  );
}
