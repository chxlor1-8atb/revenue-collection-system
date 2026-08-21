"use client";

import { useState, useEffect, useCallback, useRef, useTransition, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Upload, QrCode, X, Settings, Home, Loader2, FileText, CheckCircle2, FilePlus, Send, Copy, Check, Banknote, Building2, RotateCcw, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HouseForm, { HouseData } from "./HouseForm";
import GenerateInvoiceButton from "./GenerateInvoiceButton";
import { deleteHouse, createInitialInvoice, sendLineReminder, markAllInvoicesAsPaidCash } from "./actions";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import CustomSelect from "@/components/CustomSelect";
import CustomFieldsManager, { CustomField } from "./CustomFieldsManager";
import TablePagination from "@/components/TablePagination";
import MonthPicker from "@/components/MonthPicker";
import ConfirmModal from "@/components/ConfirmModal";
import LineSendingModal from "@/components/LineSendingModal";

export default function HousesClient({ 
  initialHouses,
  currentPage = 1,
  totalPages = 1,
  totalHouses = 0,
  initialSearch = "",
  initialZone = "",
  initialPaymentStatus = "",
  initialSort = { key: "createdAt", dir: "desc" },
  limit = 10,
  customFieldsSchema = [],
  paymentSummary = null,
  overviewStats = null,
}: { 
  initialHouses: HouseData[];
  currentPage?: number;
  totalPages?: number;
  totalHouses?: number;
  initialSearch?: string;
  initialZone?: string;
  initialPaymentStatus?: string;
  initialSort?: { key: string; dir: string };
  limit?: number;
  customFieldsSchema?: CustomField[];
  paymentSummary?: { unpaidTotal: number; paidTotal: number; unpaidCount: number; paidCount: number } | null;
  overviewStats?: { totalHousesAll: number; unpaidHousesCount: number; monthlyProjectedRevenue: number } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingHouse, setDeletingHouse] = useState<{ id: number; houseNumber: string } | null>(null);
  const [confirmCashHouse, setConfirmCashHouse] = useState<{ id: number; houseNumber: string } | null>(null);
  const [isCashing, setIsCashing] = useState(false);
  const [confirmLineHouse, setConfirmLineHouse] = useState<{ id: number; houseNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayFields = useMemo(() => {
    const fields = customFieldsSchema.filter(f => !f.isHidden);
    const amountField = fields.find(f => f.id === 'defaultBillingAmount');
    if (amountField) {
      return [...fields.filter(f => f.id !== 'defaultBillingAmount'), amountField];
    }
    return fields;
  }, [customFieldsSchema]);

  // QR Code Modal State
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; houseNumber: string; url: string; qrDataUrl: string } | null>(null);

  // Initial Bill Prompt State
  const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string; isManual?: boolean; type?: string; title?: string } | null>(null);
  const [sendingLine, setSendingLine] = useState<number | null>(null);
  const [lineSendModal, setLineSendModal] = useState<{ isOpen: boolean; phase: "sending" | "success" | "error"; houseNumber: string; errorMsg?: string }>({ isOpen: false, phase: "sending", houseNumber: "" });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedZone, setSelectedZone] = useState(initialZone);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(initialPaymentStatus);
  const [sortConfig, setSortConfig] = useState(initialSort);

  // Zone Filter Effect
  useEffect(() => {
    if (selectedZone !== initialZone) {
      startTransition(() => {
        updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "", selectedPaymentStatus || "");
      });
    }
  }, [selectedZone]);

  // Payment Status Filter Effect
  useEffect(() => {
    if (selectedPaymentStatus !== initialPaymentStatus) {
      startTransition(() => {
        updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "", selectedPaymentStatus || "");
      });
    }
  }, [selectedPaymentStatus]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "", selectedPaymentStatus || "");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, initialSearch, sortConfig]);

  const updateUrlParams = (page: number, q: string, sortKey: string, sortDir: string, newLimit: number, newZone: string, newPaymentStatus: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) params.set('page', page.toString());
      else params.delete('page');

      if (q) params.set('q', q);
      else params.delete('q');

      if (sortKey !== 'createdAt') params.set('sort', sortKey);
      else params.delete('sort');

      if (sortDir !== 'desc') params.set('dir', sortDir);
      else params.delete('dir');

      if (newLimit !== 10) params.set('limit', newLimit.toString());
      else params.delete('limit');

      if (newZone) params.set('zone', newZone);
      else params.delete('zone');

      if (newPaymentStatus) params.set('paymentStatus', newPaymentStatus);
      else params.delete('paymentStatus');

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSort = (key: string) => {
    const newDir = sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, dir: newDir });
    updateUrlParams(currentPage, searchQuery, key, newDir, limit, selectedZone || "", selectedPaymentStatus || "");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrlParams(newPage, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "", selectedPaymentStatus || "");
    }
  };

  const handleAdd = () => {
    setEditingHouse(undefined);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (house: HouseData) => {
    setEditingHouse(house);
    setShowForm(true);
    setError(null);
  };

  const confirmDelete = (id: number, houseNumber: string) => {
    setDeletingHouse({ id, houseNumber });
  };

  const handleDelete = async () => {
    if (!deletingHouse) return;
    setError(null);
    setSuccessMsg(null);
    setIsDeleting(true);
    const res = await deleteHouse(deletingHouse.id);
    setIsDeleting(false);
    if (!res.success) {
      setError(res.error || "เกิดข้อผิดพลาดในการลบ");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.refresh();
    }
    setDeletingHouse(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        // Filter out hidden fields for import mapping
        const visibleFields = customFieldsSchema.filter(f => !f.isHidden);

        const parsedData = lines.slice(1).map(line => {
          const cols = line.split(',');
          
          let houseNumber = "";
          let ownerName = "";
          let zone = "";
          let road = "";
          const customFieldsObj: Record<string, any> = {};
          
          visibleFields.forEach((field, i) => {
            const val = cols[i] ? cols[i].trim() : "";
            if (field.isSystem) {
              if (field.id === 'houseNumber') houseNumber = val;
              if (field.id === 'ownerName') ownerName = val;
              if (field.id === 'zone') zone = val;
              if (field.id === 'road') road = val;
            } else {
              customFieldsObj[field.id] = val;
            }
          });

          return {
            houseNumber,
            ownerName,
            zone,
            road,
            customFields: customFieldsObj,
          };
        }).filter(item => item.houseNumber && item.ownerName);

        const res = await fetch('/api/houses/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData)
        });
        
        const result = await res.json();
        if (result.success) {
          setSuccessMsg(`นำเข้าข้อมูลสำเร็จ: เพิ่มใหม่ ${result.insertedCount} หลัง (ข้ามข้อมูลซ้ำ/ไม่สมบูรณ์ ${result.skippedCount} หลัง)`);
          router.refresh();
        } else {
          setError(result.error || "เกิดข้อผิดพลาดในการนำเข้า");
        }
      } catch (err: any) {
        setError("ไม่สามารถอ่านไฟล์ CSV ได้: " + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const openQrModal = async (house: HouseData) => {
    try {
      const houseUrl = `${window.location.origin}/house/${house.id}`;
      const dataUrl = await QRCode.toDataURL(houseUrl, { width: 300, margin: 2, color: { dark: '#1F2E22', light: '#FFFFFF' } });
      setQrModal({ isOpen: true, houseNumber: house.houseNumber, url: houseUrl, qrDataUrl: dataUrl });
    } catch (err) {
      console.error("Failed to generate QR", err);
      alert("ไม่สามารถสร้าง QR Code ได้");
    }
  };

  const hasActiveFilters = Boolean(searchQuery || selectedZone || selectedPaymentStatus);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedZone("");
    setSelectedPaymentStatus("");
    updateUrlParams(1, "", sortConfig.key, sortConfig.dir, limit, "", "");
  };

  return (
    <div className="font-sans space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B58F2] to-[#7E7BFF] flex items-center justify-center text-white shadow-md shadow-[#5B58F2]/25 shrink-0">
            <Building2 size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-2xl text-slate-900 tracking-tight">จัดการข้อมูลบ้าน</h1>
              <span className="bg-[#EEF0FF] text-[#5B58F2] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D5D9FF]">
                {totalHouses} หลัง
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">จัดการทะเบียนบ้าน รายละเอียดเจ้าบ้าน และออกบิลค่าบริการ</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            aria-label="นำเข้าข้อมูลจากไฟล์ CSV"
            className="h-10 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            <Upload size={15} className="text-slate-500" />
            {isImporting ? 'กำลังนำเข้า...' : 'นำเข้า CSV'}
          </button>
          
          <a
            href="/api/houses/export"
            aria-label="ส่งออกข้อมูลเป็นไฟล์ Excel"
            className="h-10 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Download size={15} className="text-slate-500" />
            ส่งออก Excel
          </a>

          <button
            onClick={() => setShowSettings(true)}
            aria-label="ตั้งค่าฟิลด์ข้อมูลเพิ่มเติม"
            className="h-10 w-10 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs"
            title="ตั้งค่าฟิลด์เพิ่มเติม"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={handleAdd}
            aria-label="เพิ่มบ้านหลังใหม่"
            className="h-10 flex items-center gap-2 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-[#5B58F2]/20 hover:shadow-md"
          >
            <Plus size={16} strokeWidth={2.5} />
            เพิ่มบ้านใหม่
          </button>
          
          <div className="w-[1px] bg-slate-200 h-6 mx-1 hidden sm:block"></div>

          <GenerateInvoiceButton />
        </div>
      </div>

      {/* KPI Overview Metrics Cards */}
      {overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ทะเบียนบ้านทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {overviewStats.totalHousesAll.toLocaleString()} <span className="text-sm font-medium text-slate-500">หลัง</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Home size={20} />
            </div>
          </div>

          <div 
            onClick={() => setSelectedPaymentStatus("unpaid")}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-red-200 hover:bg-red-50/20 transition-all group"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                บ้านที่ค้างชำระ
              </div>
              <div className="text-2xl font-bold text-red-700 tracking-tight">
                {overviewStats.unpaidHousesCount.toLocaleString()} <span className="text-sm font-medium text-red-500">หลัง</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertCircle size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">ยอดจัดเก็บคาดการณ์/เดือน</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
                ฿{overviewStats.monthlyProjectedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-2xl text-sm border border-red-200 flex items-center gap-3">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <X size={14} className="text-red-600" />
          </div>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm border border-emerald-200 flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Toolbar: Search & Filters */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white relative z-20">
          <div className="flex flex-col sm:flex-row flex-wrap w-full lg:w-auto gap-3 items-center z-20">
            <div className="relative w-full sm:w-80">
              <SearchAutocomplete 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="ค้นหาบ้านเลขที่, ชื่อ, หมู่, ชุมชน..."
                className="w-full sm:w-80 focus:w-full sm:focus:w-80 !bg-slate-50 hover:!bg-slate-100/70 border-transparent focus:!bg-white focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 shadow-none text-sm rounded-xl transition-all"
              />
            </div>
            <div className="w-full sm:w-48 z-10">
              <CustomSelect
                value={selectedZone || ""}
                onChange={setSelectedZone}
                placeholder="ทุกชุมชน"
                options={[
                  { value: "", label: "ทุกชุมชน" },
                  ...["หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"].map(z => ({ value: z, label: z }))
                ]}
              />
            </div>
            <div className="w-full sm:w-44 z-10">
              <CustomSelect
                value={selectedPaymentStatus || ""}
                onChange={setSelectedPaymentStatus}
                placeholder="ทุกสถานะ"
                options={[
                  { value: "", label: "ทุกสถานะ" },
                  { value: "unpaid", label: "· ค้างชำระ" },
                  { value: "paid", label: "· ชำระครบแล้ว" },
                ]}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                aria-label="ล้างตัวกรองทั้งหมด"
                className="h-[42px] px-3.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <RotateCcw size={13} />
                ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-semibold z-10 flex gap-4 shrink-0 self-end lg:self-center">
            <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 
              พบ {totalHouses} หลัง
            </span>
          </div>
        </div>

        {/* Payment Summary Banner */}
        {paymentSummary && selectedPaymentStatus === 'unpaid' && (
          <div className="mx-6 my-4 p-4 rounded-2xl bg-red-50/90 border border-red-200/80 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-bold text-red-900">สรุปยอดบ้านที่ค้างชำระ</span>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <span className="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                {paymentSummary.unpaidCount} บิล
              </span>
              <span className="text-lg font-bold font-mono text-red-800 tabular-nums">
                ฿{paymentSummary.unpaidTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {paymentSummary && selectedPaymentStatus === 'paid' && (
          <div className="mx-6 my-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-bold text-emerald-900">สรุปยอดบ้านที่ชำระครบแล้ว</span>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                {paymentSummary.paidCount} บิล
              </span>
              <span className="text-lg font-bold font-mono text-emerald-800 tabular-nums">
                ฿{paymentSummary.paidTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">ลำดับ</th>
                {displayFields.map(field => (
                  <th 
                    key={field.id} 
                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${field.isSystem && (field.id === 'houseNumber' || field.id === 'ownerName') ? 'cursor-pointer text-slate-600 hover:text-slate-900 transition-colors' : 'text-slate-500'}`} 
                    onClick={() => {
                      if (field.id === 'houseNumber' || field.id === 'ownerName') handleSort(field.id);
                    }}
                    role={field.isSystem && (field.id === 'houseNumber' || field.id === 'ownerName') ? 'button' : undefined}
                    tabIndex={field.isSystem && (field.id === 'houseNumber' || field.id === 'ownerName') ? 0 : undefined}
                    aria-label={field.isSystem && (field.id === 'houseNumber' || field.id === 'ownerName') ? `เรียงตาม ${field.name}` : undefined}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && (field.id === 'houseNumber' || field.id === 'ownerName')) {
                        e.preventDefault();
                        handleSort(field.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {field.name}
                      {(field.id === 'houseNumber' || field.id === 'ownerName') && (
                        <ArrowUpDown size={12} className={sortConfig.key === field.id ? 'text-[#5B58F2]' : 'opacity-40'} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 text-slate-700 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
              <AnimatePresence mode="wait">
                {initialHouses.map((house, index) => (
                  <motion.tr 
                    key={house.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 text-slate-400 font-medium text-xs text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {(currentPage - 1) * limit + index + 1}
                      </span>
                    </td>

                    {displayFields.map(field => {
                      let val = "-";
                      if (field.isSystem) {
                        val = (house as any)[field.id] || "-";
                      } else {
                        val = (house.customFields as Record<string, any>)?.[field.id] || "-";
                      }
                      
                      if (field.id === 'houseNumber') {
                        return (
                          <td key={field.id} className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100/90 px-3 py-1 rounded-xl border border-slate-200/80 text-sm">
                              {val}
                            </span>
                          </td>
                        );
                      }
                      if (field.id === 'ownerName') {
                        return (
                          <td key={field.id} className="px-6 py-4 font-bold text-slate-900 text-sm">
                            {val}
                          </td>
                        );
                      }
                      if (field.id === 'zone' && val !== '-') {
                        return (
                          <td key={field.id} className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              {val}
                            </span>
                          </td>
                        );
                      }
                      if (field.id === 'defaultBillingAmount' && val !== '-') {
                        return (
                          <td key={field.id} className="px-6 py-4 font-mono font-bold text-emerald-700 text-sm">
                            ฿{parseFloat(val).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        );
                      }
                      return (
                        <td key={field.id} className="px-6 py-4 text-slate-600 font-medium text-sm">
                          {val}
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/houses/${house.id}`} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#5B58F2] bg-[#EEF0FF] hover:bg-[#5B58F2] hover:text-white rounded-xl transition-all border border-[#D5D9FF] hover:border-transparent shadow-2xs group/btn"
                      >
                        <span>ดูข้อมูล / จัดการ</span>
                        <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              
              {initialHouses.length === 0 && !isPending && (
                <tr>
                  <td colSpan={2 + customFieldsSchema.filter(f => !f.isHidden).length} className="p-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
                      <Home size={32} />
                    </div>
                    <div className="text-slate-800 font-bold text-lg">ไม่พบข้อมูลบ้านที่ตรงกับเงื่อนไข</div>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                      {hasActiveFilters ? "ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองชุมชน/สถานะ" : "ยังไม่มีข้อมูลบ้านในระบบ คลิก 'เพิ่มบ้านใหม่' เพื่อเริ่มต้น"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-4 inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs"
                      >
                        <RotateCcw size={14} />
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="rounded-b-3xl bg-white overflow-visible border-t border-slate-100">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalHouses}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={(newLimit) => updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, newLimit, selectedZone || "", selectedPaymentStatus || "")}
          />
        </div>
      </div>

      {showForm && (
        <HouseForm 
          initialData={editingHouse} 
          customFieldsSchema={customFieldsSchema}
          onClose={() => setShowForm(false)}
          onSuccess={(houseId) => {
            setShowForm(false);
            if (houseId) {
              setInitialBillPrompt({
                isOpen: true,
                houseId,
                monthYear: new Date().toISOString().slice(0, 7),
                amount: "20.00"
              });
            } else {
              router.refresh();
            }
          }} 
        />
      )}

      {showSettings && (
        <CustomFieldsManager 
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            setShowSettings(false);
            router.refresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deletingHouse}
        title="ยืนยันการลบข้อมูลบ้าน"
        description={<>คุณต้องการลบข้อมูลบ้านเลขที่ <strong className="text-slate-900">{deletingHouse?.houseNumber}</strong> ใช่หรือไม่?</>}
        warningText="จะลบได้ก็ต่อเมื่อไม่มีบิลค้างอยู่ในระบบเท่านั้น ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้"
        confirmText="ใช่, ลบข้อมูล"
        onConfirm={handleDelete}
        onCancel={() => setDeletingHouse(null)}
        isLoading={isDeleting}
      />

      {/* Confirm Cash Modal */}
      <ConfirmModal 
        isOpen={!!confirmCashHouse}
        title="ยืนยันรับชำระเงินสด"
        description={<>คุณต้องการรับชำระเงินสด สำหรับบิลค้างชำระทั้งหมดของบ้านเลขที่ <strong className="text-slate-900">{confirmCashHouse?.houseNumber}</strong> ใช่หรือไม่?</>}
        warningTitle="โปรดตรวจสอบยอดเงิน"
        warningText="การดำเนินการนี้จะเคลียร์บิลค้างชำระทั้งหมดของบ้านหลังนี้เป็น 'จ่ายแล้ว' ทันที"
        confirmText="ใช่, รับชำระเงิน"
        onConfirm={async () => {
          if (!confirmCashHouse) return;
          setIsCashing(true);
          const res = await markAllInvoicesAsPaidCash(confirmCashHouse.id);
          setIsCashing(false);
          setConfirmCashHouse(null);
          if (res.success) {
            setSuccessMsg("รับชำระเงินสดสำเร็จ!");
            setTimeout(() => {
              setSuccessMsg("");
              window.location.reload();
            }, 1500);
          } else {
            alert(res.error || "เกิดข้อผิดพลาด");
          }
        }}
        onCancel={() => setConfirmCashHouse(null)}
        isLoading={isCashing}
      />

      {/* Confirm Line Modal */}
      <ConfirmModal 
        isOpen={!!confirmLineHouse}
        title="ยืนยันการส่งแจ้งเตือน"
        description={<>คุณต้องการส่งแจ้งเตือนยอดค้างชำระไปที่ LINE ของบ้านเลขที่ <strong className="text-slate-900">{confirmLineHouse?.houseNumber}</strong> ใช่หรือไม่?</>}
        warningTitle="การแจ้งเตือน"
        warningText="ระบบจะส่งข้อความแจ้งเตือนพร้อม QR Code ชำระเงินไปยัง LINE ของลูกบ้าน"
        confirmText="ใช่, ส่งแจ้งเตือน"
        onConfirm={async () => {
          if (!confirmLineHouse) return;
          const id = confirmLineHouse.id;
          const hn = confirmLineHouse.houseNumber;
          setConfirmLineHouse(null);
          setSendingLine(id);
          setLineSendModal({ isOpen: true, phase: "sending", houseNumber: hn });
          const res = await sendLineReminder(id, window.location.origin);
          setSendingLine(null);
          if (res.success) {
            setLineSendModal({ isOpen: true, phase: "success", houseNumber: hn });
          } else {
            setLineSendModal({ isOpen: true, phase: "error", houseNumber: hn, errorMsg: res.error || "เกิดข้อผิดพลาดในการส่งแจ้งเตือน" });
          }
        }}
        onCancel={() => setConfirmLineHouse(null)}
      />

      {/* LINE Sending Animation Modal */}
      <LineSendingModal
        isOpen={lineSendModal.isOpen}
        phase={lineSendModal.phase}
        houseNumber={lineSendModal.houseNumber}
        errorMsg={lineSendModal.errorMsg}
        onClose={() => setLineSendModal({ isOpen: false, phase: "sending", houseNumber: "" })}
      />

      {/* Initial Bill Prompt Modal */}
      {initialBillPrompt && initialBillPrompt.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 relative">
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                {initialBillPrompt.isManual ? "สร้างบิลค้างชำระแบบแมนนวล" : "สร้างบิลตั้งต้น"}
              </h3>
              {!isGeneratingBill && (
                <button 
                  onClick={() => { setInitialBillPrompt(null); router.refresh(); }}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-6 leading-relaxed">
                {initialBillPrompt.isManual ? "ระบุยอดเงินและประจำเดือนที่ต้องการสร้างบิลค้างชำระ (เพิ่มยอดหนี้) ให้กับบ้านหลังนี้" : "คุณต้องการสร้างบิลตั้งต้นหรือยอดยกมา สำหรับบ้านที่เพิ่งเพิ่มเข้าไปใหม่นี้เลยหรือไม่?"}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประจำเดือน <span className="text-red-500">*</span></label>
                  <MonthPicker
                    value={initialBillPrompt.monthYear}
                    onChange={(val) => setInitialBillPrompt(prev => prev ? { ...prev, monthYear: val } : null)}
                    disabled={isGeneratingBill}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยอดเงิน (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={initialBillPrompt.amount}
                    onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, amount: e.target.value } : null)}
                    disabled={isGeneratingBill}
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setInitialBillPrompt(null); router.refresh(); }}
                  disabled={isGeneratingBill}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  ข้ามไปก่อน
                </button>
                <button
                  onClick={async () => {
                    if (!initialBillPrompt.monthYear || !initialBillPrompt.amount) return;
                    setIsGeneratingBill(true);
                    const res = await createInitialInvoice(initialBillPrompt.houseId, initialBillPrompt.monthYear, initialBillPrompt.amount, initialBillPrompt.type || "monthly", initialBillPrompt.title || null);
                    setIsGeneratingBill(false);
                    if (res.success) {
                      setSuccessMsg("สร้างบิลตั้งต้นสำเร็จ");
                      setInitialBillPrompt(null);
                      router.refresh();
                    } else {
                      setError(res.error || "เกิดข้อผิดพลาดในการสร้างบิล");
                      setInitialBillPrompt(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={isGeneratingBill}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isGeneratingBill ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> กำลังสร้าง...</>
                  ) : initialBillPrompt.isManual ? "สร้างบิลทันที" : "สร้างบิลตั้งต้น"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* QR Code Modal JSX */}
      {qrModal && qrModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
              onClick={() => setQrModal(null)}
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-[#1F2E22] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#1F2E22]/20">
              <QrCode size={32} />
            </div>
            
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-1">
              บ้านเลขที่ {qrModal.houseNumber}
            </h3>
            <p className="text-slate-500 text-sm mb-6 text-center">สแกนเพื่อเข้าสู่หน้าชำระเงินของบ้านหลังนี้</p>
            
            <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm mb-6">
              <img src={qrModal.qrDataUrl} alt={`QR Code บ้าน ${qrModal.houseNumber}`} className="w-48 h-48 rounded-xl" />
            </div>

            <a
              href={qrModal.qrDataUrl}
              download={`qrcode_house_${qrModal.houseNumber.replace(/\//g, '-')}.png`}
              className="w-full py-3 bg-[#1F2E22] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#1F2E22]/20 mb-3"
            >
              <Download size={18} />
              บันทึกรูป QR Code
            </a>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrModal.url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {copiedLink ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              {copiedLink ? 'คัดลอกลิงก์สำเร็จ' : 'คัดลอกลิงก์ชำระเงิน'}
            </button>
            
            <div className="mt-4 pt-4 border-t border-slate-100 w-full text-center">
              <a href={qrModal.url} target="_blank" className="text-xs text-blue-600 hover:underline break-all">
                {qrModal.url}
              </a>
            </div>
          </div>
        </div>
      )}
</div>
  );
}

