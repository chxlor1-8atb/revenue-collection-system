"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trash2, HardDrive, FolderOpen, Image as ImageIcon, RefreshCw, AlertTriangle, Clock, XCircle, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";

interface BlobFile {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
}

type TabPrefix = '' | 'line-slips/' | 'slips/' | 'qr-codes/';
type SortKey = 'pathname' | 'size' | 'uploadedAt';
type SortDirection = 'asc' | 'desc';

export default function BlobManagementPage() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabPrefix>('');
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  
  // New States for Enhancements
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'uploadedAt', direction: 'desc' });
  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ count: number; mode: string } | null>(null);

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
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(f => f.pathname.toLowerCase().includes(lowerQ));
    }
    
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'uploadedAt') {
        valA = new Date(valA as string).getTime();
        valB = new Date(valB as string).getTime();
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [files, searchQuery, sortConfig]);

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === filteredAndSortedFiles.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredAndSortedFiles.map(f => f.url)));
    }
  };

  const handleDelete = async (mode: string, extraData?: any) => {
    const confirmMessages: Record<string, string> = {
      selected: `คุณต้องการลบ ${selectedUrls.size} ไฟล์ที่เลือกใช่ไหม?`,
      old: `คุณต้องการลบไฟล์ที่เก่ากว่า ${extraData?.days || 30} วันใช่ไหม? \n(การลบจะค่อยๆ ลบทีละชุดเพื่อไม่ให้ระบบค้าง)`,
      rejected: 'คุณต้องการลบสลิปที่ตรวจสอบไม่ผ่านทั้งหมดใช่ไหม? \n(การลบจะค่อยๆ ลบทีละชุด)',
    };
    if (!confirm(confirmMessages[mode] || 'ยืนยันการลบ?')) return;

    setActionProgress('กำลังเตรียมการลบ...');
    setDeleteResult(null);
    let totalDeleted = 0;

    try {
      if (mode === 'selected') {
        const payload: Record<string, any> = { mode: 'selected', urls: Array.from(selectedUrls) };
        const res = await fetch('/api/blob', {
           method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await res.json();
        totalDeleted = data.deletedCount || 0;
      } 
      else if (mode === 'old') {
         const prefixes = ['line-slips/', 'slips/', 'qr-codes/'];
         for (const prefix of prefixes) {
            let currentCursor = null;
            let more = true;
            while (more) {
               setActionProgress(`กำลังลบไฟล์เก่าโฟลเดอร์ ${prefix} (ลบไปแล้ว ${totalDeleted} ไฟล์)`);
               const payload: Record<string, any> = { mode: 'old', days: extraData?.days || 30, prefix, cursor: currentCursor };
               const res = await fetch('/api/blob', {
                  method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
               });
               const data = await res.json();
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
            setActionProgress(`กำลังลบสลิปที่ไม่ผ่าน (ลบไปแล้ว ${totalDeleted} ไฟล์)`);
            const payload: Record<string, any> = { mode: 'rejected', offset };
            const res = await fetch('/api/blob', {
               method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.success) break;
            totalDeleted += data.deletedCount || 0;
            more = data.hasMore;
            offset = data.nextOffset;
         }
      }
      
      setDeleteResult({ count: totalDeleted, mode });
      setSelectedUrls(new Set());
      fetchFiles(false); // reload from start
    } catch (error) {
      console.error('Delete failed:', error);
      alert('เกิดข้อผิดพลาดในการลบไฟล์');
    } finally {
      setActionProgress(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // Storage Usage Calculations (Based on 1 GB Free Tier)
  const MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
  const usagePercentage = (totalSize / MAX_STORAGE_BYTES) * 100;
  const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
  const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - totalSize);
  const estimatedRemainingImages = averageFileSize > 0 ? Math.floor(remainingBytes / averageFileSize) : 0;

  const tabs: { label: string; prefix: TabPrefix; icon: any }[] = [
    { label: 'ทั้งหมด', prefix: '', icon: <FolderOpen size={16} /> },
    { label: 'line-slips/', prefix: 'line-slips/', icon: <ImageIcon size={16} /> },
    { label: 'slips/', prefix: 'slips/', icon: <ImageIcon size={16} /> },
    { label: 'qr-codes/', prefix: 'qr-codes/', icon: <ImageIcon size={16} /> },
  ];

  const [oldDays, setOldDays] = useState(30);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive size={24} className="text-slate-600" />
            จัดการ Blob Storage
          </h1>
          <p className="text-sm text-slate-500 mt-1">ดูและลบไฟล์สลิป, QR Code ที่เก็บใน Vercel Blob (รองรับรูปจำนวนมาก)</p>
        </div>
        <button
          onClick={() => fetchFiles(false)}
          disabled={loading && !cursor}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={loading && !cursor ? 'animate-spin' : ''} />
          โหลดใหม่ทั้งหมด
        </button>
      </div>

      {/* Storage Usage Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">ปริมาณการใช้งาน Storage (โควต้า 1 GB)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              พื้นที่ว่างเหลือ {loading && files.length===0 ? '—' : formatSize(remainingBytes)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-800">
              {loading && files.length===0 ? '—' : usagePercentage.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, usagePercentage)}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">ที่แสดงอยู่ใช้ไป: <span className="font-medium text-slate-800">{loading && files.length===0 ? '—' : formatSize(totalSize)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-slate-600">รองรับได้อีกประมาณ: <span className="font-medium text-slate-800">{loading && files.length===0 ? '—' : estimatedRemainingImages.toLocaleString()} ภาพ</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-slate-600">ขนาดเฉลี่ยต่อภาพ: <span className="font-medium text-slate-800">{loading && files.length===0 ? '—' : formatSize(averageFileSize)}</span></span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">จำนวนไฟล์ที่โหลดมาแล้ว</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{files.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">ขนาดรวมไฟล์ที่โหลดมา</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatSize(totalSize)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 sm:col-span-1 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">เลือกอยู่</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{selectedUrls.size} ไฟล์</p>
        </div>
      </div>

      {/* Delete Result Banner */}
      {deleteResult && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm">
          <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
            ✅ ลบสำเร็จทั้งหมด {deleteResult.count} ไฟล์
          </p>
          <button onClick={() => setDeleteResult(null)} className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-full transition-colors">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Action Progress Banner */}
      {actionProgress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 shadow-sm">
          <RefreshCw size={20} className="animate-spin text-blue-500" />
          <p className="text-sm text-blue-800 font-medium">{actionProgress}</p>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto shadow-inner">
          {tabs.map(tab => (
            <button
              key={tab.prefix}
              onClick={() => setActiveTab(tab.prefix)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.prefix
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full md:w-64 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200 items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase px-2">จัดการแบบกลุ่ม</span>
        <button
          onClick={() => handleDelete('selected')}
          disabled={selectedUrls.size === 0 || actionProgress !== null}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Trash2 size={14} />
          {`ลบที่เลือก (${selectedUrls.size})`}
        </button>

        <div className="flex items-center gap-1 bg-amber-100/50 border border-amber-200 rounded-md px-1 ml-auto sm:ml-0">
          <input
            type="number"
            value={oldDays}
            onChange={(e) => setOldDays(Math.max(1, parseInt(e.target.value) || 30))}
            className="w-12 py-1.5 text-sm text-center bg-transparent border-none outline-none text-amber-800 font-mono"
            min={1}
          />
          <span className="text-xs text-amber-600 mr-1">วัน</span>
          <button
            onClick={() => handleDelete('old', { days: oldDays })}
            disabled={actionProgress !== null}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500 text-white rounded cursor-pointer text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 shadow-sm"
          >
            <Clock size={14} />
            ลบไฟล์เก่า
          </button>
        </div>

        <button
          onClick={() => handleDelete('rejected')}
          disabled={actionProgress !== null}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-40 shadow-sm"
        >
          <AlertTriangle size={14} />
          ลบสลิปไม่ผ่าน
        </button>
      </div>

      {/* File Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading && !cursor && files.length === 0 ? (
          <div className="p-16 text-center">
            <RefreshCw size={36} className="animate-spin text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="p-16 text-center">
            <FolderOpen size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-base text-slate-600 font-medium">ไม่พบไฟล์</p>
            {searchQuery && <p className="text-sm text-slate-400 mt-1">ลองล้างคำค้นหาดูนะครับ</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="w-10 p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUrls.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 cursor-pointer text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-600 w-16">ตัวอย่าง</th>
                  <th className="text-left p-3 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors select-none" onClick={() => handleSort('pathname')}>
                    <div className="flex items-center gap-1">ชื่อไฟล์ <ArrowUpDown size={12} className={sortConfig.key==='pathname' ? 'text-emerald-500' : 'text-slate-300'}/></div>
                  </th>
                  <th className="text-right p-3 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors select-none" onClick={() => handleSort('size')}>
                    <div className="flex items-center justify-end gap-1">ขนาด <ArrowUpDown size={12} className={sortConfig.key==='size' ? 'text-emerald-500' : 'text-slate-300'}/></div>
                  </th>
                  <th className="text-right p-3 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors select-none" onClick={() => handleSort('uploadedAt')}>
                    <div className="flex items-center justify-end gap-1">วันที่อัปโหลด <ArrowUpDown size={12} className={sortConfig.key==='uploadedAt' ? 'text-emerald-500' : 'text-slate-300'}/></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedFiles.map((file) => (
                  <tr
                    key={file.url}
                    className={`border-b border-slate-100 transition-colors ${
                      selectedUrls.has(file.url) ? 'bg-red-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(file.url)}
                        onChange={() => toggleSelect(file.url)}
                        className="rounded border-slate-300 cursor-pointer text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3 align-middle">
                      <SlipModalButton imageUrl={file.url}>
                        <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-zoom-in group relative bg-slate-100 inline-block">
                          <img
                            src={file.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                             <Search size={14} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                          </div>
                        </div>
                      </SlipModalButton>
                    </td>
                    <td className="p-3 align-middle">
                      <p className="font-mono text-xs text-slate-700 truncate max-w-[200px] md:max-w-[400px]" title={file.pathname}>
                        {file.pathname}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-slate-500 align-middle">
                      {formatSize(file.size)}
                    </td>
                    <td className="p-3 text-right text-xs text-slate-500 whitespace-nowrap align-middle">
                      {formatDate(file.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
            <button
              onClick={() => fetchFiles(true)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-full shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loading && cursor ? <RefreshCw size={16} className="animate-spin" /> : <ChevronDown size={16} />}
              โหลดข้อมูลเพิ่มเติม (มีไฟล์เหลืออยู่)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
