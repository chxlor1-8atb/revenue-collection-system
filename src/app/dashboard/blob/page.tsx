"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Trash2, 
  HardDrive, 
  FolderOpen, 
  Image as ImageIcon, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Search, 
  ArrowUpDown, 
  ChevronDown,
  LayoutGrid,
  List,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  X
} from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import { motion, AnimatePresence } from "framer-motion";
import SlipModalButton from "@/components/SlipModalButton";
import TablePagination from "@/components/TablePagination";
import ConfirmModal from "@/components/ConfirmModal";

interface BlobFile {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
}

type TabPrefix = '' | 'line-slips/';
type SortKey = 'pathname' | 'size' | 'uploadedAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

export default function BlobManagementPage() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabPrefix>('');
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Cursor & Pagination for Vercel Blob
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ count: number; mode: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Custom Days for Old Files Cleanup
  const [oldDays, setOldDays] = useState(30);
  const [showCleanupMenu, setShowCleanupMenu] = useState(false);

  // Modal Confirm State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    warningText?: string;
    mode: 'selected' | 'old' | 'rejected' | 'single';
    extraData?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    mode: 'selected'
  });

  const fetchFiles = useCallback(async (append = false) => {
    if (!append) {
      setLoading(true);
      setFiles([]);
      setSelectedUrls(new Set());
      setCursor(null);
      setHasMore(false);
    }
    
    try {
      const currentCursor = append ? cursor : null;
      const params = new URLSearchParams();
      if (activeTab) params.append('prefix', activeTab);
      if (currentCursor) params.append('cursor', currentCursor);
      
      const res = await fetch(`/api/blob?${params.toString()}`);
      const data = await res.json();
      
      setFiles(prev => append ? [...prev, ...(data.blobs || [])] : (data.blobs || []));
      setCursor(data.cursor || null);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch blobs:', error);
      if (!append) setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, cursor]);

  useEffect(() => {
    fetchFiles(false);
  }, [activeTab]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase().trim();
      result = result.filter(f => f.pathname.toLowerCase().includes(lowerQ));
    }
    
    result.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (sortKey === 'uploadedAt') {
        valA = new Date(valA as string).getTime();
        valB = new Date(valB as string).getTime();
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [files, searchQuery, sortKey, sortDir]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 24 : 20;
  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFiles.slice(start, start + itemsPerPage);
  }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortKey, sortDir, activeTab, viewMode]);

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredAndSortedFiles.map(f => f.url)));
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Open confirmation modal
  const promptDelete = (mode: 'selected' | 'old' | 'rejected' | 'single', extraData?: any) => {
    if (mode === 'selected') {
      const selectedFiles = files.filter(f => selectedUrls.has(f.url));
      const totalSelectedBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
      setConfirmModal({
        isOpen: true,
        mode: 'selected',
        title: 'ยืนยันการลบไฟล์ที่เลือก',
        description: `คุณต้องการลบไฟล์ที่เลือกทั้งหมด ${selectedUrls.size} รายการ (รวมประมาณ ${formatSize(totalSelectedBytes)}) หรือไม่?`,
        warningText: 'ไฟล์ที่ถูกลบออกจาก Blob Storage จะไม่สามารถกู้คืนได้ และสลิปที่แนบไว้จะไม่สามารถแสดงผลได้อีกต่อไป',
      });
    } else if (mode === 'single') {
      setConfirmModal({
        isOpen: true,
        mode: 'single',
        extraData,
        title: 'ยืนยันการลบไฟล์',
        description: `คุณต้องการลบไฟล์ "${extraData?.pathname || 'ไฟล์นี้'}" ใช่หรือไม่?`,
        warningText: 'การลบนี้จะนำไฟล์ออกจากคลาวด์ถาวร ไม่สามารถกู้คืนได้',
      });
    } else if (mode === 'old') {
      const days = extraData?.days || oldDays;
      setConfirmModal({
        isOpen: true,
        mode: 'old',
        extraData: { days },
        title: `ยืนยันการลบไฟล์ที่เก่ากว่า ${days} วัน`,
        description: `ระบบจะค้นหาและลบไฟล์ใน line-slips/ ทั้งหมดที่มีอายุเกิน ${days} วัน เพื่อเพิ่มพื้นที่ว่าง`,
        warningText: 'กรุณาตรวจสอบว่าไม่มีสลิปเก่าที่จำเป็นต้องเก็บไว้สำหรับตรวจสอบบัญชีย้อนหลัง',
      });
    } else if (mode === 'rejected') {
      setConfirmModal({
        isOpen: true,
        mode: 'rejected',
        title: 'ยืนยันการลบสลิปที่ไม่ผ่านการตรวจสอบ',
        description: 'ระบบจะค้นหาภาพสลิปที่ระบบตรวจแล้วไม่ผ่าน (isVerified = false) และลบออกจากพื้นที่จัดเก็บ',
        warningText: 'สลิปที่ไม่ผ่านและถูกปฏิเสธจะถูกลบถาวร ไม่สามารถเรียกดูภาพย้อนหลังได้',
      });
    }
  };

  const executeDelete = async () => {
    const { mode, extraData } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setActionProgress('กำลังเตรียมการลบข้อมูล...');
    setDeleteResult(null);
    let totalDeleted = 0;

    try {
      if (mode === 'selected') {
        const payload = { mode: 'selected', urls: Array.from(selectedUrls) };
        const res = await fetch('/api/blob', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        totalDeleted = data.deletedCount || 0;
      } 
      else if (mode === 'single') {
        const payload = { mode: 'selected', urls: [extraData.url] };
        const res = await fetch('/api/blob', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        totalDeleted = data.deletedCount || 0;
      }
      else if (mode === 'old') {
        const prefixes = ['line-slips/'];
        for (const prefix of prefixes) {
          let currentCursor: string | null = null;
          let more = true;
          while (more) {
            setActionProgress(`กำลังลบไฟล์เก่าโฟลเดอร์ ${prefix} (ลบไปแล้ว ${totalDeleted} ไฟล์)...`);
            const payload = { mode: 'old', days: extraData?.days || 30, prefix, cursor: currentCursor };
            const res = await fetch('/api/blob', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data: any = await res.json();
            if (!data.success) break;
            totalDeleted += data.deletedCount || 0;
            more = data.hasMore;
            currentCursor = data.cursor;
          }
        }
      }
      else if (mode === 'rejected') {
        let offset = 0;
        let more = true;
        while (more) {
          setActionProgress(`กำลังลบสลิปที่ไม่ผ่าน (ลบไปแล้ว ${totalDeleted} ไฟล์)...`);
          const payload = { mode: 'rejected', offset };
          const res = await fetch('/api/blob', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data: any = await res.json();
          if (!data.success) break;
          totalDeleted += data.deletedCount || 0;
          more = data.hasMore;
          offset = data.nextOffset;
        }
      }
      
      setDeleteResult({ count: totalDeleted, mode });
      setSelectedUrls(new Set());
      fetchFiles(false);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('เกิดข้อผิดพลาดในการลบไฟล์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setActionProgress(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

  // Storage Calculations (1 GB Free Tier Quota)
  const MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
  const usagePercentage = (totalSize / MAX_STORAGE_BYTES) * 100;
  const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
  const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - totalSize);
  const estimatedRemainingImages = averageFileSize > 0 ? Math.floor(remainingBytes / averageFileSize) : 0;

  const tabs: { label: string; prefix: TabPrefix; icon: any; count?: number }[] = [
    { label: 'ไฟล์ทั้งหมด', prefix: '', icon: <Layers size={15} /> },
    { label: 'สลิป LINE (line-slips/)', prefix: 'line-slips/', icon: <ImageIcon size={15} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Top Header (Desktop only - mobile goes straight to storage analytics & files) */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5 mb-1">
            <LottieIcon src="/icons/icons8-folder.json" size={48} className="shrink-0" loop autoplay />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              พื้นที่จัดเก็บไฟล์ (Vercel Blob)
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            ตรวจสอบสถิติการใช้งาน จัดการรูปภาพสลิป และทำความสะอาดไฟล์คลาวด์
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => fetchFiles(false)}
            disabled={loading && !cursor}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-sm hover:border-slate-300 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading && !cursor ? 'animate-spin text-[#5B58F2]' : 'text-slate-500'} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Storage Gauge & Analytics Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#5B58F2]/5 to-transparent rounded-full pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">สถานะความจุคลาวด์</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                usagePercentage > 90 
                  ? 'bg-red-50 text-red-600 border border-red-200' 
                  : usagePercentage > 75 
                  ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {usagePercentage > 90 ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
                {usagePercentage > 90 ? 'พื้นที่ใกล้เต็ม' : usagePercentage > 75 ? 'ใช้งานปานกลาง' : 'พื้นที่พร้อมใช้งาน'}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {loading && files.length === 0 ? '—' : formatSize(totalSize)}
              </h2>
              <span className="text-sm font-medium text-slate-400">
                จากทั้งหมด 1.00 GB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">เหลือพื้นที่ว่าง</div>
              <div className="text-lg font-bold text-slate-700">
                {loading && files.length === 0 ? '—' : formatSize(remainingBytes)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] flex items-center justify-center text-[#5B58F2] font-black text-sm shrink-0">
              {loading && files.length === 0 ? '—' : `${usagePercentage.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="pt-6 space-y-3">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                usagePercentage > 90 
                  ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                  : usagePercentage > 75 
                  ? 'bg-gradient-to-r from-blue-500 to-amber-500' 
                  : 'bg-gradient-to-r from-[#5B58F2] to-[#7B78FF]'
              }`}
              style={{ width: `${Math.min(100, Math.max(1, usagePercentage))}%` }}
            />
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">จำนวนไฟล์ในระบบ</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{files.length.toLocaleString()} ไฟล์</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ขนาดเฉลี่ยต่อรูป</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{loading && files.length === 0 ? '—' : formatSize(averageFileSize)}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">รองรับสลิปได้อีก</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">~{loading && files.length === 0 ? '—' : estimatedRemainingImages.toLocaleString()} รูป</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EEF0FF]/50 border border-[#5B58F2]/15">
              <div className="text-[11px] font-semibold text-[#5B58F2] uppercase tracking-wider">เลือกรายการอยู่</div>
              <div className="text-lg font-bold text-[#5B58F2] mt-0.5">{selectedUrls.size} ไฟล์</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Banners */}
      <AnimatePresence>
        {deleteResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  ลบไฟล์สำเร็จเรียบร้อย!
                </p>
                <p className="text-xs text-emerald-700">
                  ลบไฟล์ออกจากระบบแล้วทั้งหมด {deleteResult.count} รายการ
                </p>
              </div>
            </div>
            <button 
              onClick={() => setDeleteResult(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1.5 hover:bg-emerald-100/80 rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {actionProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 shadow-sm"
          >
            <RefreshCw size={20} className="animate-spin text-blue-600 shrink-0" />
            <p className="text-sm font-semibold text-blue-900">{actionProgress}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls & Filter Hub */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        {/* Row 1: Folder Tabs & Search & View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
            {tabs.map(tab => (
              <button
                key={tab.prefix}
                onClick={() => setActiveTab(tab.prefix)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.prefix
                    ? 'bg-white text-[#5B58F2] shadow-sm shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search, Sort, View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อไฟล์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B58F2]/20 focus:border-[#5B58F2] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1.5">
              <span className="text-[11px] text-slate-400 font-semibold px-1 hidden sm:inline">เรียง:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none cursor-pointer pr-1"
              >
                <option value="uploadedAt">วันที่อัปโหลด</option>
                <option value="size">ขนาดไฟล์</option>
                <option value="pathname">ชื่อไฟล์</option>
              </select>
              <button
                onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-slate-500 hover:text-[#5B58F2] rounded-lg transition-colors"
                title={sortDir === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
              >
                <ArrowUpDown size={13} className={sortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100/80 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#5B58F2] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="มุมมองการ์ด (Grid)"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#5B58F2] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="มุมมองตาราง (Table)"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Maintenance & Cleaning Hub */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Sparkles size={13} className="text-[#5B58F2]" />
              เครื่องมือดูแลพื้นที่:
            </span>

            {/* Clean Rejected Slips */}
            <button
              onClick={() => promptDelete('rejected')}
              disabled={actionProgress !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200/80 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <AlertTriangle size={13} />
              <span>ลบสลิปที่ตรวจไม่ผ่าน</span>
            </button>

            {/* Clean Old Slips with Popover / Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCleanupMenu(prev => !prev)}
                disabled={actionProgress !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/80 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Clock size={13} />
                <span>ลบไฟล์สลิปเก่า ({oldDays} วัน)</span>
                <ChevronDown size={12} />
              </button>

              {showCleanupMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-30 space-y-3">
                  <div className="text-xs font-bold text-slate-800">ล้างไฟล์เก่ากว่าที่กำหนด</div>
                  <div className="flex gap-1.5">
                    {[15, 30, 60, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => setOldDays(d)}
                        className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-all ${
                          oldDays === d 
                            ? 'bg-amber-500 text-white border-amber-500' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d} วัน
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={oldDays}
                      onChange={(e) => setOldDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                      min={1}
                    />
                    <span className="text-xs text-slate-500">วันขึ้นไป</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowCleanupMenu(false);
                      promptDelete('old', { days: oldDays });
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
                  >
                    เริ่มค้นหาและลบ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Batch Selection Info */}
          <div className="flex items-center gap-2 ml-auto">
            {selectedUrls.size > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => promptDelete('selected')}
                  disabled={actionProgress !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 transition-all disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>ลบที่เลือก ({selectedUrls.size})</span>
                </button>
                <button
                  onClick={() => setSelectedUrls(new Set())}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                เลือกทั้งหมดในหน้านี้
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main File Content (Grid vs Table) */}
      <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading && !cursor && files.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <RefreshCw size={36} className="animate-spin text-[#5B58F2] mx-auto opacity-80" />
            <p className="text-sm font-semibold text-slate-600">กำลังดึงข้อมูลไฟล์จาก Vercel Blob...</p>
            <p className="text-xs text-slate-400">โปรดรอสักครู่</p>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <FolderOpen size={32} />
            </div>
            <p className="text-base font-bold text-slate-700">ไม่พบไฟล์ที่ตรงกับเงื่อนไข</p>
            {searchQuery && (
              <p className="text-xs text-slate-400">
                ไม่มีไฟล์ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID / GALLERY VIEW */
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedFiles.map((file) => {
                const isSelected = selectedUrls.has(file.url);
                return (
                  <motion.div
                    key={file.url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col bg-white ${
                      isSelected 
                        ? 'border-[#5B58F2] ring-2 ring-[#5B58F2]/20 shadow-md' 
                        : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                      <img
                        src={file.url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="2" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }}
                      />

                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(file.url)}
                          className="w-4 h-4 rounded-md border-slate-300 text-[#5B58F2] focus:ring-[#5B58F2] cursor-pointer shadow-xs"
                        />
                      </div>

                      {/* File Size Badge */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white font-mono">
                        {formatSize(file.size)}
                      </div>

                      {/* Overlay Hover Actions */}
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <SlipModalButton imageUrl={file.url}>
                          <button 
                            className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-lg transition-transform hover:scale-110"
                            title="ดูรูปภาพขนาดเต็ม"
                          >
                            <Search size={14} />
                          </button>
                        </SlipModalButton>

                        <button
                          onClick={() => handleCopy(file.url)}
                          className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-lg transition-transform hover:scale-110"
                          title="คัดลอก URL"
                        >
                          {copiedUrl === file.url ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>

                        <button
                          onClick={() => promptDelete('single', file)}
                          className="p-2 rounded-xl bg-white/90 hover:bg-red-600 hover:text-white text-red-600 shadow-lg transition-all hover:scale-110"
                          title="ลบไฟล์นี้"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-3 space-y-1 bg-white">
                      <p 
                        className="text-xs font-mono font-bold text-slate-700 truncate" 
                        title={file.pathname}
                      >
                        {file.pathname.replace('line-slips/', '')}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-12 px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUrls.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#5B58F2] focus:ring-[#5B58F2] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">ตัวอย่าง</th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('pathname')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ชื่อไฟล์และโฟลเดอร์</span>
                      {sortKey === 'pathname' && <ArrowUpDown size={12} className="text-[#5B58F2]" />}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('size')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>ขนาด</span>
                      {sortKey === 'size' && <ArrowUpDown size={12} className="text-[#5B58F2]" />}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('uploadedAt')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>วันที่อัปโหลด</span>
                      {sortKey === 'uploadedAt' && <ArrowUpDown size={12} className="text-[#5B58F2]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-28">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {paginatedFiles.map((file) => {
                  const isSelected = selectedUrls.has(file.url);
                  return (
                    <tr
                      key={file.url}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#EEF0FF]/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-6 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(file.url)}
                          className="w-4 h-4 rounded border-slate-300 text-[#5B58F2] focus:ring-[#5B58F2] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <SlipModalButton imageUrl={file.url}>
                          <div className="w-10 h-10 rounded-xl border border-slate-200/80 overflow-hidden cursor-zoom-in group relative bg-slate-100">
                            <img
                              src={file.url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Search size={12} className="text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          </div>
                        </SlipModalButton>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-xs font-bold text-slate-700 truncate max-w-xs md:max-w-md" title={file.pathname}>
                          {file.pathname}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold text-slate-600">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopy(file.url)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="คัดลอก URL"
                          >
                            {copiedUrl === file.url ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => promptDelete('single', file)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบไฟล์"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Banner */}
        {hasMore && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-center items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">ยังมีไฟล์ในคลาวด์เพิ่มเติมที่ยังไม่ได้ดึงมา</span>
            <button
              onClick={() => fetchFiles(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-[#5B58F2] text-xs font-bold rounded-xl shadow-xs hover:bg-[#EEF0FF] transition-colors disabled:opacity-50"
            >
              {loading && cursor ? <RefreshCw size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              <span>โหลดไฟล์เพิ่มจากคลาวด์</span>
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="overflow-visible bg-white">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedFiles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            isInfinite={hasMore}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        warningText={confirmModal.warningText}
        confirmText="ยืนยันการลบถาวร"
        cancelText="ยกเลิก"
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
