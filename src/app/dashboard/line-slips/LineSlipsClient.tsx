"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { 
  searchHouseByNumber, 
  getUnpaidInvoicesForHouse, 
  approveLineSlip, 
  rejectLineSlip,
  batchApproveSlips,
  restoreRejectedSlip
} from "./actions";
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  List, 
  LayoutGrid, 
  Smartphone, 
  AlertCircle, 
  Sparkles, 
  X, 
  Ban, 
  Eye, 
  FileText, 
  User, 
  Link2, 
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  RotateCcw,
  Zap,
  Filter,
  Send,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  House,
  CornerDownLeft
} from "lucide-react";
import AnimatedLineIcon from "@/components/AnimatedLineIcon";
import SlipModalButton from "@/components/SlipModalButton";
import ConfirmModal from "@/components/ConfirmModal";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TablePagination from "@/components/TablePagination";

interface LineSlipsClientProps {
  slips: any[];
  activeTab: "pending" | "verified" | "rejected";
  currentPage: number;
  totalPages: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  limit?: number;
}

export default function LineSlipsClient({ 
  slips, 
  activeTab, 
  currentPage, 
  totalPages, 
  pendingCount, 
  verifiedCount,
  rejectedCount,
  limit = 12
}: LineSlipsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"detailed" | "grid">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "verified" | "unverified" | "suggested" | "no_house">("all");
  const [selectedSlipIds, setSelectedSlipIds] = useState<number[]>([]);

  // Modal State
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [searchHouseNumber, setSearchHouseNumber] = useState("");
  const [foundHouse, setFoundHouse] = useState<any | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [advanceMonths, setAdvanceMonths] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reject Modal State
  const [rejectingSlip, setRejectingSlip] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("ภาพสลิปไม่ชัดเจน / มืดเกินไป");
  const [customReason, setCustomReason] = useState<string>("");

  // Generic Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    warningText?: string;
    confirmText?: string;
    variant?: "success" | "danger" | "primary";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("line_slips_view_mode");
    if (saved === "detailed" || saved === "grid") setViewMode(saved);
  }, []);

  const toggleViewMode = (mode: "detailed" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("line_slips_view_mode", mode);
  };

  const handleTabChange = (tab: "pending" | "verified" | "rejected") => {
    setSelectedSlipIds([]);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const updateUrlParams = (page: number, newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');

    if (newLimit !== 12) params.set('limit', newLimit.toString());
    else params.delete('limit');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams(page, limit);
  };

  // Filter and search slips on client
  const filteredSlips = useMemo(() => {
    return slips.filter((slip) => {
      const matchQuery = 
        !searchTerm ||
        (slip.senderName && slip.senderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (slip.houseNumber && slip.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (slip.smartMatch?.house?.houseNumber && slip.smartMatch.house.houseNumber.includes(searchTerm)) ||
        (slip.amount && slip.amount.toString().includes(searchTerm));

      if (!matchQuery) return false;

      if (filterType === "verified") return slip.isVerified;
      if (filterType === "unverified") return !slip.isVerified;
      if (filterType === "suggested") return !!slip.smartMatch;
      if (filterType === "no_house") return !slip.houseNumber && !slip.smartMatch;

      return true;
    });
  }, [slips, searchTerm, filterType]);

  // Open match modal with prefilled data or smart suggestion
  const openMatchModal = async (slip: any, prefillHouse?: any) => {
    setSelectedSlip(slip);
    setAdvanceMonths(0);
    setErrorMsg("");

    const targetHouseNumber = prefillHouse?.houseNumber || slip.smartMatch?.house?.houseNumber || slip.houseNumber || "";
    setSearchHouseNumber(targetHouseNumber);

    if (targetHouseNumber) {
      await handleSearchHouseForSlip(targetHouseNumber, parseFloat(slip.amount || "0"));
    } else {
      setFoundHouse(null);
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
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
        
        // Auto-select invoices if amount matches exactly
        const totalDebt = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0);
        if (totalDebt > 0 && slipAmt === totalDebt) {
          setSelectedInvoices(invoices.map((i: any) => i.id));
        } else if (invoices.length > 0) {
          // Select as many invoices as the slip amount covers
          let runningSum = 0;
          const toSelect: number[] = [];
          for (const inv of invoices) {
            const invAmt = parseFloat(inv.amount);
            if (runningSum + invAmt <= slipAmt) {
              toSelect.push(inv.id);
              runningSum += invAmt;
            }
          }
          setSelectedInvoices(toSelect);

          // If there is excess money after paying all debts, calculate advance months
          const remaining = slipAmt - runningSum;
          const defaultBill = parseFloat(house.defaultBillingAmount || "20");
          if (remaining > 0 && defaultBill > 0 && toSelect.length === invoices.length) {
            const adv = Math.floor(remaining / defaultBill);
            setAdvanceMonths(adv);
          }
        } else {
          // 0 debt, calculate advance months directly
          const defaultBill = parseFloat(house.defaultBillingAmount || "20");
          if (defaultBill > 0 && slipAmt > 0) {
            const adv = Math.floor(slipAmt / defaultBill);
            setAdvanceMonths(adv);
          }
        }
      } else {
        setFoundHouse(null);
        setUnpaidInvoices([]);
        setSelectedInvoices([]);
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
    if (!foundHouse || !selectedSlip) return;
    setIsLoading(true);
    setErrorMsg("");

    const res = await approveLineSlip(
      selectedSlip.id,
      foundHouse.id,
      selectedInvoices,
      parseFloat(selectedSlip.amount || "0"),
      selectedSlip.imageUrl || "",
      advanceMonths,
      selectedSlip.lineUserId
    );

    setIsLoading(false);
    if (res.success) {
      setSelectedSlip(null);
      router.refresh();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // Reject flow
  const handleOpenReject = (slip: any) => {
    setRejectingSlip(slip);
    setRejectionReason("ภาพสลิปไม่ชัดเจน / มืดเกินไป");
    setCustomReason("");
  };

  const executeRejectWithReason = async () => {
    if (!rejectingSlip) return;
    setIsLoading(true);
    const finalReason = rejectionReason === "other" ? customReason : rejectionReason;
    
    try {
      const res = await rejectLineSlip(rejectingSlip.id, finalReason, rejectingSlip.lineUserId);
      if (res.success) {
        setRejectingSlip(null);
        router.refresh();
      } else {
        alert(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Restore rejected slip
  const handleRestore = async (slipId: number) => {
    setIsLoading(true);
    try {
      const res = await restoreRejectedSlip(slipId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "เกิดข้อผิดพลาดในการกู้คืน");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-select management
  const toggleSelectSlip = (id: number) => {
    setSelectedSlipIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedSlipIds.length === filteredSlips.length) {
      setSelectedSlipIds([]);
    } else {
      setSelectedSlipIds(filteredSlips.map(s => s.id));
    }
  };

  // Batch approve selected slips that have matched houses
  const handleBatchApprove = () => {
    const candidateSlips = slips.filter(
      s => selectedSlipIds.includes(s.id) && (s.smartMatch?.house || s.houseNumber)
    );

    if (candidateSlips.length === 0) {
      alert("ไม่มีสลิปที่จับคู่บ้านได้ในรายการที่เลือก กรุณาจับคู่รายใบก่อนครับ");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "ยืนยันอนุมัติสลิปหลายรายการ",
      description: `คุณต้องการอนุมัติสลิปที่จับคู่บ้านแล้วจำนวน ${candidateSlips.length} รายการ ใช่หรือไม่?`,
      confirmText: "ใช่, อนุมัติสลิปทั้งหมด",
      variant: "success",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const approvals = candidateSlips.map(slip => {
            const house = slip.smartMatch?.house;
            return {
              lineMessageId: slip.id,
              houseId: house?.id || 0,
              invoiceIds: [],
              amount: parseFloat(slip.amount || "0"),
              imageUrl: slip.imageUrl || "",
              lineUserId: slip.lineUserId,
            };
          });

          const res = await batchApproveSlips(approvals);
          if (res.success) {
            setSelectedSlipIds([]);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            router.refresh();
          } else {
            alert("บางรายการไม่สามารถอนุมัติได้: " + res.errors?.join(", "));
          }
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Calculations for modal
  const slipAmount = parseFloat(selectedSlip?.amount || "0");
  const selectedInvoicesTotal = unpaidInvoices
    .filter(i => selectedInvoices.includes(i.id))
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  
  const defaultHouseBill = parseFloat(foundHouse?.defaultBillingAmount || "20");
  const advanceTotal = advanceMonths * defaultHouseBill;
  const calculatedGrandTotal = selectedInvoicesTotal + advanceTotal;
  const difference = slipAmount - calculatedGrandTotal;

  return (
    <div className="font-sans space-y-6 pb-20">
      {/* Master Unified Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col font-sans mb-8">
        
        {/* Header & Tabs */}
        <div className="p-4 sm:p-6 lg:p-7 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="hidden sm:flex items-center gap-4">
            <AnimatedLineIcon size={64} variant="black" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-2xl text-slate-900 tracking-tight">สลิปจาก LINE</h1>
                <span className="bg-[blue-50] text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {pendingCount + verifiedCount + rejectedCount} ทั้งหมด
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                ศูนย์จัดการสลิปแจ้งโอนเงินผ่าน LINE Bot อัจฉริยะ พร้อมระบบแนะนำบ้านและแจ้งเตือนกลับอัตโนมัติ
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between w-full lg:w-auto gap-3 self-start lg:self-center">
            {/* Tab Switcher Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => handleTabChange("pending")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "pending" 
                    ? "bg-white text-blue-600 shadow-xs" 
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

              <button
                onClick={() => handleTabChange("rejected")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "rejected" 
                    ? "bg-white text-red-600 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Ban size={13} />
                <span>ปฏิเสธแล้ว</span>
                {rejectedCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-red-200/60">
                    {rejectedCount}
                  </span>
                )}
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

        {/* Toolbar: Search, Filters & Bulk Select */}
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อผู้โอน, บ้านเลขที่, หรือยอดเงิน..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType === "all" ? "bg-blue-600 text-white shadow-2xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                ทั้งหมด
              </button>
              {activeTab === "pending" && (
                <>
                  <button
                    onClick={() => setFilterType("suggested")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === "suggested" ? "bg-blue-600 text-white shadow-2xs" : "bg-white border border-slate-200 text-purple-700 hover:bg-purple-50"
                    }`}
                  >
                    <Zap size={11} /> จับคู่อัตโนมัติ
                  </button>
                  <button
                    onClick={() => setFilterType("no_house")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === "no_house" ? "bg-amber-600 text-white shadow-2xs" : "bg-white border border-slate-200 text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    <AlertCircle size={11} /> ยังไม่ระบุบ้าน
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Selection indicator */}
          {activeTab === "pending" && filteredSlips.length > 0 && (
            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={selectAllFiltered}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {selectedSlipIds.length === filteredSlips.length && filteredSlips.length > 0 ? (
                  <><CheckSquare size={14} className="text-blue-600" /> ยกเลิกเลือกทั้งหมด</>
                ) : (
                  <><Square size={14} /> เลือกทั้งหมด ({filteredSlips.length})</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {viewMode === "grid" ? (
          <div className="p-6 lg:p-8 bg-slate-50/30 min-h-[400px]">
            {filteredSlips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-slate-800 font-bold mb-1">
                  {searchTerm ? "ไม่พบสลิปที่ตรงกับการค้นหา" : activeTab === "pending" ? "ไม่มีสลิปจาก LINE ที่รอดำเนินการ 🎉" : activeTab === "verified" ? "ยังไม่มีประวัติสลิปที่สำเร็จ" : "ไม่มีสลิปที่ถูกปฏิเสธ"}
                </h3>
                <p className="text-slate-500 text-xs">
                  {searchTerm ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" : activeTab === "pending" ? "สลิปที่ผู้ใช้อัปโหลดผ่าน LINE Bot จะปรากฏที่นี่" : "สลิปจะถูกเก็บประวัติไว้ที่นี่"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSlips.map((slip) => {
                  const isSelected = selectedSlipIds.includes(slip.id);
                  const hasSmartMatch = !!slip.smartMatch?.house;

                  return (
                    <div 
                      key={slip.id} 
                      className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative ${
                        isSelected ? "border-blue-600 ring-2 ring-blue-600/20" : "border-slate-200/90 hover:border-blue-600/40"
                      }`}
                    >
                      {/* Select checkbox for pending tab */}
                      {activeTab === "pending" && (
                        <div className="absolute top-3 left-3 z-20">
                          <button
                            onClick={() => toggleSelectSlip(slip.id)}
                            className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Top: Large Slip Visual Showcase */}
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
                        <div className="absolute top-3 right-3 flex items-start gap-2 pointer-events-none">
                          {activeTab === "verified" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md">
                              <CheckCircle2 size={11} /> สำเร็จแล้ว
                            </span>
                          ) : activeTab === "rejected" ? (
                            <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md">
                              <Ban size={11} /> ปฏิเสธแล้ว
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

                        {/* Bottom timestamp on slip */}
                        <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[10px] text-white/90 font-mono pointer-events-none drop-shadow">
                          <span>
                            {slip.createdAt ? new Date(slip.createdAt).toLocaleString("th-TH", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            }) : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Smart Match Banner if detected */}
                      {activeTab === "pending" && hasSmartMatch && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sparkles size={13} className="text-blue-600 shrink-0" />
                            <div className="truncate text-xs">
                              <span className="font-bold text-blue-600">แนะนำ: บ้าน {slip.smartMatch.house.houseNumber}</span>
                              <span className="text-[10px] text-slate-500 block truncate">({slip.smartMatch.reason})</span>
                            </div>
                          </div>
                          <button
                            onClick={() => openMatchModal(slip, slip.smartMatch.house)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            <Zap size={11} /> ใช้บ้านนี้
                          </button>
                        </div>
                      )}

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
                            ) : !hasSmartMatch && (
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
                        {activeTab === "pending" ? (
                          <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => openMatchModal(slip)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                            >
                              <Link2 size={14} /> จับคู่ / อนุมัติ
                            </button>
                            <button
                              onClick={() => handleOpenReject(slip)}
                              className="flex items-center justify-center px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              title="ปฏิเสธสลิป"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        ) : activeTab === "rejected" ? (
                          <div className="pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleRestore(slip.id)}
                              disabled={isLoading}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <RotateCcw size={13} /> กู้คืนสลิป (Undo)
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 lg:p-8 pt-0 overflow-x-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeTab === "pending" && <th className="px-4 py-3.5 w-10"></th>}
                    <th className="px-5 py-3.5">เวลาแจ้ง</th>
                    <th className="px-5 py-3.5 w-16 text-center">สลิป</th>
                    <th className="px-5 py-3.5">ยอดเงิน</th>
                    <th className="px-5 py-3.5">ผู้โอนเงิน</th>
                    <th className="px-5 py-3.5">บ้านเลขที่</th>
                    <th className="px-5 py-3.5 text-center">สถานะ</th>
                    <th className="px-5 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-500 font-medium">
                        ไม่พบข้อมูลสลิป
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => {
                      const isSelected = selectedSlipIds.includes(slip.id);
                      return (
                        <tr key={slip.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-indigo-50/30" : ""}`}>
                          {activeTab === "pending" && (
                            <td className="px-4 py-4">
                              <button
                                onClick={() => toggleSelectSlip(slip.id)}
                                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                              </button>
                            </td>
                          )}
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
                            ) : slip.smartMatch?.house ? (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-blue-600 border border-purple-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                                <Sparkles size={11} /> แนะนำ {slip.smartMatch.house.houseNumber}
                              </span>
                            ) : (
                              <span className="text-amber-600 text-xs font-medium">ยังไม่ระบุ</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {activeTab === "verified" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 size={12} /> สำเร็จแล้ว
                              </span>
                            ) : activeTab === "rejected" ? (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                <Ban size={12} /> ปฏิเสธแล้ว
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
                          <td className="px-5 py-4 text-right">
                            {activeTab === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openMatchModal(slip)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                >
                                  <Link2 size={12} /> จับคู่
                                </button>
                                <button
                                  onClick={() => handleOpenReject(slip)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                  title="ปฏิเสธ"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ) : activeTab === "rejected" ? (
                              <button
                                onClick={() => handleRestore(slip.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <RotateCcw size={12} /> กู้คืน
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
          totalItems={activeTab === 'pending' ? pendingCount : activeTab === 'verified' ? verifiedCount : rejectedCount}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={(newLimit) => updateUrlParams(1, newLimit)}
        />
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedSlipIds.length > 0 && activeTab === "pending" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 border border-slate-700/60 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700 text-sm font-semibold">
            <CheckSquare size={16} className="text-[#7E7BFF]" />
            <span>เลือกแล้ว {selectedSlipIds.length} รายการ</span>
          </div>

          <button
            onClick={handleBatchApprove}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
          >
            <Zap size={14} /> อนุมัติสลิปที่จับคู่ได้ ({selectedSlipIds.length})
          </button>

          <button
            onClick={() => setSelectedSlipIds([])}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Matching & Approval Modal with Advance Payment & LINE Push */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Link2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">จับคู่บ้านและอนุมัติสลิป</h2>
                  <p className="text-xs text-slate-500">เลือกบ้านเลขที่ บิลที่ต้องการตัดชำระ หรือเลือกเหมาจ่ายล่วงหน้า</p>
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
                      <div className="text-2xl font-bold font-mono text-emerald-700">
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
                        {selectedSlip.createdAt ? new Date(selectedSlip.createdAt).toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
                      </div>
                    </div>
                  </div>

                  {selectedSlip.imageUrl ? (
                    <SlipModalButton imageUrl={selectedSlip.imageUrl}>
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                        <img src={selectedSlip.imageUrl} alt="Slip" className="w-full max-h-44 object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1">
                          <Eye size={14} /> ดูภาพเต็ม
                        </div>
                      </div>
                    </SlipModalButton>
                  ) : (
                    <div className="w-full h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      ไม่มีรูปสลิป
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: House and Invoices */}
              <div className="w-full md:w-7/12 flex flex-col space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ค้นหาบ้านเลขที่</div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SearchAutocomplete 
                        value={searchHouseNumber}
                        onChange={setSearchHouseNumber}
                        onSubmit={() => handleSearchHouseForSlip(searchHouseNumber, slipAmount)}
                        placeholder="ใส่บ้านเลขที่ เช่น 123/4..."
                        className="w-full placeholder:text-slate-400 text-sm focus:ring-blue-600 cursor-text rounded-xl border border-slate-200"
                      />
                    </div>
                    <button 
                      onClick={() => handleSearchHouseForSlip(searchHouseNumber, slipAmount)}
                      disabled={isLoading || !searchHouseNumber}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-[42px] rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Search size={14} /> ค้นหา
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 font-medium flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {foundHouse && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-base">บ้านเลขที่ {foundHouse.houseNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        {foundHouse.zone ? `ชุมชน${foundHouse.zone}` : "พบบ้านแล้ว"}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                      <User size={13} /> เจ้าบ้าน: <strong className="font-semibold">{foundHouse.ownerName}</strong>
                      <span className="text-slate-400 mx-1">|</span>
                      <span>ค่าบริการ: ฿{foundHouse.defaultBillingAmount || "20"}/เดือน</span>
                    </div>
                  </div>
                )}

                {foundHouse && (
                  <div className="space-y-4">
                    {/* Unpaid invoices checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          บิลค้างชำระ ({unpaidInvoices.length} รายการ)
                        </div>
                        <span className="text-[11px] text-slate-400">เลือกบิลที่ต้องการตัดยอด</span>
                      </div>
                      
                      {unpaidInvoices.length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-4 bg-slate-50 rounded-xl border border-slate-100 font-medium">
                          บ้านหลังนี้ไม่มีบิลค้างชำระ 🎉 (สามารถเลือกชำระล่วงหน้าด้านล่างได้)
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {unpaidInvoices.map(inv => (
                            <label 
                              key={inv.id} 
                              className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all ${
                                selectedInvoices.includes(inv.id) 
                                  ? "bg-indigo-50/50 border-blue-600 ring-1 ring-blue-600/30" 
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer"
                                checked={selectedInvoices.includes(inv.id)}
                                onChange={() => toggleInvoice(inv.id)}
                              />
                              <div className="ml-3 flex-1 flex justify-between items-center text-xs">
                                <div>
                                  <div className="font-bold text-slate-800">งวดประจำเดือน {inv.monthYear}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">บิล #{inv.id}</div>
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

                    {/* Advance Months Selector */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar size={14} className="text-blue-600" /> จ่ายล่วงหน้า (งวดถัดไป):
                        </span>
                        <span className="font-bold text-blue-600 font-mono">
                          +{advanceMonths} เดือน (฿{advanceTotal.toFixed(2)})
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[0, 1, 3, 6, 12].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAdvanceMonths(num)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              advanceMonths === num
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {num === 0 ? "ไม่จ่ายล่วงหน้า" : num === 12 ? "เหมาทั้งปี (12 เดือน)" : `+${num} เดือน`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
                <span className="text-slate-500">ยอดสลิป: <strong className="text-emerald-700 font-mono font-bold text-base">฿{slipAmount.toFixed(2)}</strong></span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">ยอดตัดชำระ: <strong className={`font-mono font-bold text-base ${difference === 0 ? "text-emerald-700" : "text-amber-600"}`}>฿{calculatedGrandTotal.toFixed(2)}</strong></span>
                
                {difference !== 0 && calculatedGrandTotal > 0 && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    ({difference > 0 ? `เหลือเงิน ฿${difference.toFixed(2)}` : `ขาด ฿${Math.abs(difference).toFixed(2)}`})
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedSlip(null)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isLoading || !foundHouse || (selectedInvoices.length === 0 && advanceMonths === 0)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs disabled:opacity-50 shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : (
                    <>
                      <Send size={14} /> ยืนยันอนุมัติ & ส่งแจ้งเตือน LINE
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Slip Modal with Reason Picker */}
      {rejectingSlip && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 font-sans">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-2xs">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">ปฏิเสธสลิป LINE</h3>
                  <p className="text-xs text-slate-500">เลือกเหตุผลเพื่อแจ้งเตือนให้ชาวบ้านทราบทาง LINE</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectingSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                เลือกเหตุผลในการปฏิเสธ:
              </div>

              <div className="space-y-2">
                {[
                  "ภาพสลิปไม่ชัดเจน / มืดเกินไป",
                  "ยอดเงินโอนไม่ตรงกับค่าบริการ",
                  "โอนผิดบัญชี / ไม่ใช่บัญชีเทศบาล",
                  "สลิปซ้ำ / เคยแจ้งชำระเงินแล้ว",
                  "ข้อมูลบ้านเลขที่ไม่ถูกต้อง",
                  "other"
                ].map(reason => (
                  <label
                    key={reason}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer text-xs font-medium transition-colors ${
                      rejectionReason === reason
                        ? "bg-red-50/60 border-red-300 text-red-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={() => setRejectionReason(reason)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2.5">
                      {reason === "other" ? "ระบุเหตุผลอื่นๆ..." : reason}
                    </span>
                  </label>
                ))}
              </div>

              {rejectionReason === "other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="พิมพ์เหตุผลที่ต้องการแจ้งชาวบ้าน..."
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                />
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setRejectingSlip(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={executeRejectWithReason}
                disabled={isLoading || (rejectionReason === "other" && !customReason.trim())}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? "กำลังประมวลผล..." : (
                  <>
                    <Ban size={13} /> ยืนยันปฏิเสธ & ส่ง LINE
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        warningText={confirmModal.warningText}
        confirmText={confirmModal.confirmText || "ยืนยัน"}
        cancelText="ยกเลิก"
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={isLoading}
      />

    </div>
  );
}
