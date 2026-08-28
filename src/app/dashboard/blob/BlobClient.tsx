"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Download,
  Upload,
  ExternalLink,
  Eye,
  Filter,
  X
} from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import { motion, AnimatePresence } from "framer-motion";
import TablePagination from "@/components/TablePagination";
import ConfirmModal from "@/components/ConfirmModal";

export interface BlobFile {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
}

type TabPrefix = '' | 'line-slips/';
type SortKey = 'pathname' | 'size' | 'uploadedAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';
type SizeFilter = 'all' | 'large' | 'huge' | 'small';
type DateFilter = 'all' | 'today' | '7days' | '30days';

function FancyCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  size = "md"
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer select-none shrink-0 ${
        size === "sm" ? "w-4.5 h-4.5" : "w-5 h-5"
      } ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-slate-100 border border-slate-200"
          : checked || indeterminate
          ? "bg-[#5B58F2] text-white shadow-xs shadow-[#5B58F2]/30 border border-[#5B58F2] hover:bg-[#4A47D1] active:scale-95"
          : "bg-white/90 backdrop-blur-xs border-2 border-slate-300 hover:border-[#5B58F2] hover:bg-indigo-50/30 active:scale-95"
      }`}
    >
      {checked && !indeterminate && (
        <Check size={size === "sm" ? 11 : 13} strokeWidth={3} className="text-white" />
      )}
      {indeterminate && (
        <span className={`block bg-white rounded-full ${size === "sm" ? "w-2 h-0.5" : "w-2.5 h-0.5"}`} />
      )}
    </button>
  );
}

interface BlobClientProps {
  initialBlobs?: BlobFile[];
  initialCursor?: string | null;
  initialHasMore?: boolean;
}

export default function BlobClient({
  initialBlobs = [],
  initialCursor = null,
  initialHasMore = false,
}: BlobClientProps) {
  const [files, setFiles] = useState<BlobFile[]>(initialBlobs);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabPrefix>('');
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Cursor & Pagination for Vercel Blob
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ count: number; mode: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Lightbox Preview Modal State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Manual Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState<'line-slips' | 'uploads'>('line-slips');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Days for Old Files Cleanup
  const [oldDays, setOldDays] = useState(30);
  const [showCleanupMenu, setShowCleanupMenu] = useState(false);

  // Modal Confirm State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    warningText?: string;
    mode: 'selected' | 'old' | 'rejected' | 'single' | 'orphaned';
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

  // Only re-fetch if activeTab changes and not initial load
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialBlobs.length === 0) {
        fetchFiles(false);
      }
      return;
    }
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

    // Size filter
    if (sizeFilter === 'large') {
      result = result.filter(f => f.size >= 500 * 1024); // >= 500 KB
    } else if (sizeFilter === 'huge') {
      result = result.filter(f => f.size >= 1024 * 1024); // >= 1 MB
    } else if (sizeFilter === 'small') {
      result = result.filter(f => f.size < 100 * 1024); // < 100 KB
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        result = result.filter(f => new Date(f.uploadedAt).getTime() >= startOfDay);
      } else if (dateFilter === '7days') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        result = result.filter(f => new Date(f.uploadedAt).getTime() >= past7);
      } else if (dateFilter === '30days') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        result = result.filter(f => new Date(f.uploadedAt).getTime() >= past30);
      }
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
  }, [files, searchQuery, sortKey, sortDir, sizeFilter, dateFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 24 : 20;
  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFiles.slice(start, start + itemsPerPage);
  }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortKey, sortDir, activeTab, viewMode, sizeFilter, dateFilter]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : paginatedFiles.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev !== null && prev < paginatedFiles.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, paginatedFiles.length]);

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

  // Export Blob Manifest to CSV
  const exportBlobCsv = () => {
    const headers = ["ชื่อไฟล์ (Pathname)", "ขนาดไฟล์ (Bytes)", "ขนาดไฟล์", "วันที่อัปโหลด", "ลิงก์รูปภาพ (URL)"];
    const rows = filteredAndSortedFiles.map(f => [
      `"${f.pathname.replace(/"/g, '""')}"`,
      f.size,
      `"${formatSize(f.size)}"`,
      `"${new Date(f.uploadedAt).toLocaleString('th-TH')}"`,
      `"${f.url}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vercel_blob_files_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Manual File Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', uploadFolder);

      const res = await fetch('/api/blob', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setIsUploadOpen(false);
      setUploadFile(null);
      fetchFiles(false);
      setDeleteResult({ count: 1, mode: 'upload' });
    } catch (err: any) {
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  // Open confirmation modal
  const promptDelete = (mode: 'selected' | 'old' | 'rejected' | 'single' | 'orphaned', extraData?: any) => {
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
    } else if (mode === 'orphaned') {
      setConfirmModal({
        isOpen: true,
        mode: 'orphaned',
        title: 'ยืนยันการล้างไฟล์สลิปตกค้างที่ไม่มีบิลผูก',
        description: 'ระบบจะตรวจสอบไฟล์ใน Blob Storage เทียบกับฐานข้อมูลธุรกรรม และลบไฟล์ที่ไม่มีข้อมูลบิลหรือสลิปรองรับออกจากคลาวด์',
        warningText: 'ไฟล์ที่ไม่มีประวัติธุรกรรมจะถูกลบถาวรเพื่อประหยัดพื้นที่จัดเก็บ',
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
      else if (mode === 'orphaned') {
        setActionProgress('กำลังสแกนและลบไฟล์ตกค้างที่ไม่มีบิลผูก...');
        const payload = { mode: 'orphaned' };
        const res = await fetch('/api/blob', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data: any = await res.json();
        totalDeleted = data.deletedCount || 0;
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
    <div className="max-w-7xl mx-auto pb-16 font-sans">
      {/* Notifications / Banners */}
      <AnimatePresence>
        {deleteResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  {deleteResult.mode === 'upload' ? 'อัปโหลดไฟล์สำเร็จเรียบร้อย!' : 'ลบไฟล์สำเร็จเรียบร้อย!'}
                </p>
                <p className="text-xs text-emerald-700">
                  {deleteResult.mode === 'upload' ? 'ไฟล์ถูกจัดเก็บบน Vercel Blob เรียบร้อยแล้ว' : `ลบไฟล์ออกจากระบบแล้วทั้งหมด ${deleteResult.count} รายการ`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setDeleteResult(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1.5 hover:bg-emerald-100/80 rounded-xl transition-colors cursor-pointer"
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
            className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 shadow-sm"
          >
            <RefreshCw size={20} className="animate-spin text-blue-600 shrink-0" />
            <p className="text-sm font-semibold text-blue-900">{actionProgress}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Master Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col font-sans">
        {/* 1. Header Section (Desktop only - mobile goes straight to gauge & actionable tools) */}
        <div className="hidden sm:flex p-6 lg:p-7 border-b border-slate-100 flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <LottieIcon src="/icons/icons8-folder.json" size={48} className="shrink-0" loop autoplay />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-bold text-2xl text-slate-900 tracking-tight">พื้นที่จัดเก็บไฟล์ (Vercel Blob)</h1>
                <span className="bg-[#EEF0FF] text-[#5B58F2] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D5D9FF]">
                  {files.length.toLocaleString()} ไฟล์
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  usagePercentage > 90 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : usagePercentage > 75 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {usagePercentage > 90 ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                  {usagePercentage > 90 ? 'พื้นที่ใกล้เต็ม' : usagePercentage > 75 ? 'ใช้งานปานกลาง' : 'พื้นที่พร้อมใช้งาน'}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                ตรวจสอบสถิติการใช้งาน จัดการรูปภาพสลิป และทำความสะอาดไฟล์คลาวด์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <button
              onClick={exportBlobCsv}
              disabled={filteredAndSortedFiles.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="ส่งออกรายการไฟล์ทั้งหมดเป็น CSV"
            >
              <Download size={14} className="text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#5B58F2] hover:bg-[#4A47D1] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>อัปโหลดไฟล์</span>
            </button>

            <button
              onClick={() => fetchFiles(false)}
              disabled={loading && !cursor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={loading && !cursor ? 'animate-spin text-[#5B58F2]' : 'text-slate-500'} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* 2. Storage Gauge & Analytics Strip */}
        <div className="p-4 sm:p-5 lg:p-6 bg-slate-50/40 border-b border-slate-100 space-y-4">
          {/* Mobile Quick Action Buttons (Visible only on mobile) */}
          <div className="flex sm:hidden items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900">พื้นที่จัดเก็บ</span>
              <span className="bg-[#EEF0FF] text-[#5B58F2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {files.length} ไฟล์
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#5B58F2] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Upload size={12} />
                <span>อัปโหลด</span>
              </button>
              <button
                onClick={exportBlobCsv}
                disabled={filteredAndSortedFiles.length === 0}
                className="p-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
                title="ส่งออก CSV"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => fetchFiles(false)}
                disabled={loading && !cursor}
                className="p-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
                title="รีเฟรช"
              >
                <RefreshCw size={13} className={loading && !cursor ? 'animate-spin text-[#5B58F2]' : ''} />
              </button>
            </div>
          </div>

          {/* Storage Bar & Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-slate-500">ใช้พื้นที่ไป:</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {loading && files.length === 0 ? '—' : formatSize(totalSize)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 1.00 GB ({usagePercentage.toFixed(1)}%)</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>เหลือพื้นที่ว่าง:</span>
              <strong className="text-slate-800 font-bold text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                {loading && files.length === 0 ? '—' : formatSize(remainingBytes)}
              </strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5">
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

          {/* 4 Compact Stat Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">จำนวนไฟล์</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">{files.length.toLocaleString()} ไฟล์</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">ขนาดเฉลี่ย</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">{loading && files.length === 0 ? '—' : formatSize(averageFileSize)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">รองรับเพิ่ม</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600">~{loading && files.length === 0 ? '—' : estimatedRemainingImages.toLocaleString()} รูป</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#EEF0FF]/60 border border-[#D5D9FF] shadow-2xs">
              <span className="text-[11px] font-medium text-[#5B58F2]">เลือกอยู่</span>
              <span className="text-xs sm:text-sm font-bold text-[#5B58F2]">{selectedUrls.size} ไฟล์</span>
            </div>
          </div>
        </div>

        {/* 3. Toolbar & Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3.5 relative z-20">
          {/* Row 1: Folder Tabs, Search, Filters & View Mode */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start overflow-x-auto max-w-full border border-slate-200/60 shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.prefix}
                  onClick={() => setActiveTab(tab.prefix)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.prefix
                      ? 'bg-white text-[#5B58F2] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-52 min-w-[140px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไฟล์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B58F2]/20 focus:border-[#5B58F2] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Size Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-[11px] text-slate-400 font-semibold px-0.5 hidden sm:inline">ขนาด:</span>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                  className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none cursor-pointer pr-1"
                >
                  <option value="all">ทุกขนาด</option>
                  <option value="large">&gt; 500 KB (ใหญ่)</option>
                  <option value="huge">&gt; 1 MB (ใหญ่มาก)</option>
                  <option value="small">&lt; 100 KB (เล็ก)</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-[11px] text-slate-400 font-semibold px-0.5 hidden sm:inline">ช่วงเวลา:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none cursor-pointer pr-1"
                >
                  <option value="all">ทุกช่วงเวลา</option>
                  <option value="today">วันนี้</option>
                  <option value="7days">7 วันล่าสุด</option>
                  <option value="30days">30 วันล่าสุด</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <span className="text-[11px] text-slate-400 font-semibold px-0.5 hidden sm:inline">เรียง:</span>
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
                  className="p-1 text-slate-500 hover:text-[#5B58F2] rounded-lg transition-colors cursor-pointer"
                  title={sortDir === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
                >
                  <ArrowUpDown size={13} className={sortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="มุมมองตาราง"
                >
                  <List size={14} /> ตาราง
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="มุมมองการ์ด"
                >
                  <LayoutGrid size={14} /> การ์ด
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Maintenance & Cleaning Tools */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Sparkles size={13} className="text-[#5B58F2]" />
                เครื่องมือดูแลพื้นที่:
              </span>

              <button
                onClick={() => promptDelete('rejected')}
                disabled={actionProgress !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200/80 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle size={13} />
                <span>ลบสลิปที่ตรวจไม่ผ่าน</span>
              </button>

              <button
                onClick={() => promptDelete('orphaned')}
                disabled={actionProgress !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200/80 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                title="สแกนและล้างไฟล์สลิปในคลาวด์ที่ไม่มีรายการบิลผูกอยู่"
              >
                <Layers size={13} />
                <span>ล้างสลิปตกค้างไร้บิล</span>
              </button>


            </div>

            {/* Batch Selection */}
            <div className="flex items-center gap-2 ml-auto">
              {selectedUrls.size > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => promptDelete('selected')}
                    disabled={actionProgress !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>ลบที่เลือก ({selectedUrls.size})</span>
                  </button>
                  <button
                    onClick={() => setSelectedUrls(new Set())}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  เลือกทั้งหมดในหน้านี้
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Main File Content (Grid vs Table) */}
        <div className="overflow-hidden bg-slate-50/20">
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
            {(searchQuery || sizeFilter !== 'all' || dateFilter !== 'all') && (
              <p className="text-xs text-slate-400">
                ลองปรับตัวกรองหรือคำค้นหาใหม่
              </p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID / GALLERY VIEW */
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedFiles.map((file, idx) => {
                const isSelected = selectedUrls.has(file.url);
                return (
                  <motion.div
                    key={file.url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-2xs hover:shadow-md ${
                      isSelected 
                        ? 'border-[#5B58F2] ring-2 ring-[#5B58F2]/20 bg-indigo-50/10' 
                        : 'border-slate-200/90 hover:border-[#5B58F2]/40'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div 
                      className="relative aspect-4/3 sm:aspect-square w-full bg-slate-100/80 overflow-hidden cursor-pointer flex items-center justify-center"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <Image
                        src={file.url}
                        alt="File Thumbnail"
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="2" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }}
                      />

                      {/* Small Minimalist Index Badge */}
                      <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold shadow-xs">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Floating Sleek Checkbox */}
                      <div 
                        className="absolute top-2.5 right-2.5 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FancyCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(file.url)}
                          size="sm"
                        />
                      </div>

                      {/* Hover Action Overlay */}
                      <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-30" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => setLightboxIndex(idx)} 
                          className="p-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="ดูรูปภาพขนาดเต็ม"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleCopy(file.url)} 
                          className="p-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="คัดลอก URL"
                        >
                          {copiedUrl === file.url ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>
                        <button 
                          onClick={() => promptDelete('single', file)} 
                          className="p-2 rounded-xl bg-white/95 hover:bg-rose-600 hover:text-white text-rose-600 shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="ลบไฟล์นี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Card Footer Metadata */}
                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate font-mono" title={file.pathname}>
                          {file.pathname.replace('line-slips/', '').replace('qrcodes/', '') || 'FILE'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                        {formatSize(file.size)}
                      </span>
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
                    <div className="flex items-center justify-center">
                      <FancyCheckbox
                        checked={selectedUrls.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                        indeterminate={selectedUrls.size > 0 && selectedUrls.size < filteredAndSortedFiles.length}
                        onChange={toggleSelectAll}
                        size="sm"
                      />
                    </div>
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
                {paginatedFiles.map((file, idx) => {
                  const isSelected = selectedUrls.has(file.url);
                  return (
                    <tr
                      key={file.url}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#EEF0FF]/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <FancyCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(file.url)}
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div 
                          onClick={() => setLightboxIndex(idx)}
                          className="w-10 h-10 rounded-xl border border-slate-200/80 overflow-hidden cursor-zoom-in group relative bg-slate-100"
                        >
                          <Image src={file.url} alt="" width={80} height={80} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye size={12} className="text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
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
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="คัดลอก URL"
                          >
                            {copiedUrl === file.url ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => promptDelete('single', file)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        </div>

        {/* Load More Banner */}
        {hasMore && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-center items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">ยังมีไฟล์ในคลาวด์เพิ่มเติมที่ยังไม่ได้ดึงมา</span>
            <button
              onClick={() => fetchFiles(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-[#5B58F2] text-xs font-bold rounded-xl shadow-xs hover:bg-[#EEF0FF] transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Lightbox Modal with Prev/Next Navigation */}
      <AnimatePresence>
        {lightboxIndex !== null && paginatedFiles[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Toolbar */}
            <div 
              className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
                  รูปที่ {lightboxIndex + 1} จาก {paginatedFiles.length}
                </span>
                <span className="text-xs font-mono opacity-80 truncate max-w-xs md:max-w-md">
                  {paginatedFiles[lightboxIndex].pathname}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(paginatedFiles[lightboxIndex].url)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="คัดลอก URL"
                >
                  {copiedUrl === paginatedFiles[lightboxIndex].url ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <a
                  href={paginatedFiles[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="ปิด (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

                        <div className="flex items-center justify-center gap-4 sm:gap-12 w-full max-w-7xl mx-auto px-2 z-10">
              {/* Left Nav Arrow */}
              {paginatedFiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : paginatedFiles.length - 1));
                  }}
                  className="shrink-0 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20 backdrop-blur-md cursor-pointer hover:scale-110"
                  title="รูปก่อนหน้า (ลูกศรซ้าย)"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {/* Main Image Container */}
              <motion.div
                key={paginatedFiles[lightboxIndex].url}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center shrink min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={paginatedFiles[lightboxIndex].url} alt={paginatedFiles[lightboxIndex].pathname} width={1200} height={1200} className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl" />
                <div className="mt-4 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-white/80 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md whitespace-nowrap">
                  <span>ขนาด: <strong>{formatSize(paginatedFiles[lightboxIndex].size)}</strong></span>
                  <span>•</span>
                  <span>อัปโหลดเมื่อ: <strong>{formatDate(paginatedFiles[lightboxIndex].uploadedAt)}</strong></span>
                </div>
              </motion.div>

              {/* Right Nav Arrow */}
              {paginatedFiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => (prev !== null && prev < paginatedFiles.length - 1 ? prev + 1 : 0));
                  }}
                  className="shrink-0 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20 backdrop-blur-md cursor-pointer hover:scale-110"
                  title="รูปถัดไป (ลูกศรขวา)"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isUploading && setIsUploadOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF0FF] text-[#5B58F2] flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">อัปโหลดไฟล์ขึ้นคลาวด์</h3>
                    <p className="text-xs text-slate-500">รองรับไฟล์รูปภาพ PNG, JPG, JPEG, WEBP</p>
                  </div>
                </div>
                <button
                  onClick={() => !isUploading && setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Destination Folder */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">โฟลเดอร์ปลายทาง</label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5B58F2]/20 focus:border-[#5B58F2]"
                  >
                    <option value="line-slips">line-slips/ (รูปสลิป)</option>
                    <option value="uploads">uploads/ (ไฟล์ทั่วไป)</option>
                  </select>
                </div>

                {/* Drag & Drop File Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setUploadFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-[#5B58F2] bg-slate-50/50 hover:bg-[#EEF0FF]/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                  
                  {uploadFile ? (
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <Check size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto">{uploadFile.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{formatSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่</p>
                      <p className="text-[10px] text-slate-400">ขนาดสูงสุดไม่เกิน 10 MB</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    disabled={isUploading}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="flex-1 py-2.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>เริ่มอัปโหลด</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        warningText={confirmModal.warningText}
        confirmText="ยืนยันการดำเนินการ"
        cancelText="ยกเลิก"
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}




