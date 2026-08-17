"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, HardDrive, FolderOpen, Image, RefreshCw, AlertTriangle, Clock, XCircle } from "lucide-react";

interface BlobFile {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
}

type TabPrefix = '' | 'line-slips/' | 'slips/' | 'qr-codes/';

export default function BlobManagementPage() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabPrefix>('');
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ count: number; mode: string } | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setSelectedUrls(new Set());
    try {
      const params = activeTab ? `?prefix=${encodeURIComponent(activeTab)}` : '';
      const res = await fetch(`/api/blob${params}`);
      const data = await res.json();
      setFiles(data.blobs || []);
    } catch (error) {
      console.error('Failed to fetch blobs:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === files.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(files.map(f => f.url)));
    }
  };

  const handleDelete = async (mode: string, extraData?: any) => {
    const confirmMessages: Record<string, string> = {
      selected: `คุณต้องการลบ ${selectedUrls.size} ไฟล์ที่เลือกใช่ไหม?`,
      old: `คุณต้องการลบไฟล์ที่เก่ากว่า ${extraData?.days || 30} วันใช่ไหม?`,
      rejected: 'คุณต้องการลบสลิปที่ตรวจสอบไม่ผ่านทั้งหมดใช่ไหม?',
    };
    if (!confirm(confirmMessages[mode] || 'ยืนยันการลบ?')) return;

    setActionLoading(mode);
    setDeleteResult(null);
    try {
      const body: any = { mode };
      if (mode === 'selected') body.urls = Array.from(selectedUrls);
      if (mode === 'old') body.days = extraData?.days || 30;

      const res = await fetch('/api/blob', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteResult({ count: data.deletedCount, mode });
        fetchFiles();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('เกิดข้อผิดพลาดในการลบไฟล์');
    } finally {
      setActionLoading(null);
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

  const tabs: { label: string; prefix: TabPrefix; icon: any }[] = [
    { label: 'ทั้งหมด', prefix: '', icon: <FolderOpen size={16} /> },
    { label: 'line-slips/', prefix: 'line-slips/', icon: <Image size={16} /> },
    { label: 'slips/', prefix: 'slips/', icon: <Image size={16} /> },
    { label: 'qr-codes/', prefix: 'qr-codes/', icon: <Image size={16} /> },
  ];

  const [oldDays, setOldDays] = useState(30);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive size={24} className="text-slate-600" />
            จัดการ Blob Storage
          </h1>
          <p className="text-sm text-slate-500 mt-1">ดูและลบไฟล์สลิป, QR Code ที่เก็บใน Vercel Blob</p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">จำนวนไฟล์</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : files.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">ขนาดรวม</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : formatSize(totalSize)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">เลือกอยู่</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{selectedUrls.size} ไฟล์</p>
        </div>
      </div>

      {/* Delete Result Banner */}
      {deleteResult && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-emerald-800 font-medium">
            ✅ ลบสำเร็จ {deleteResult.count} ไฟล์
          </p>
          <button onClick={() => setDeleteResult(null)} className="text-emerald-600 hover:text-emerald-800">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.prefix}
            onClick={() => setActiveTab(tab.prefix)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.prefix
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleDelete('selected')}
          disabled={selectedUrls.size === 0 || actionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
          {actionLoading === 'selected' ? 'กำลังลบ...' : `ลบที่เลือก (${selectedUrls.size})`}
        </button>

        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2">
          <input
            type="number"
            value={oldDays}
            onChange={(e) => setOldDays(Math.max(1, parseInt(e.target.value) || 30))}
            className="w-14 py-2 text-sm text-center bg-transparent border-none outline-none text-amber-800 font-mono"
            min={1}
          />
          <span className="text-xs text-amber-600 mr-1">วัน</span>
          <button
            onClick={() => handleDelete('old', { days: oldDays })}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40"
          >
            <Clock size={14} />
            {actionLoading === 'old' ? 'กำลังลบ...' : 'ลบไฟล์เก่า'}
          </button>
        </div>

        <button
          onClick={() => handleDelete('rejected')}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-40"
        >
          <AlertTriangle size={16} />
          {actionLoading === 'rejected' ? 'กำลังลบ...' : 'ลบสลิปไม่ผ่าน'}
        </button>
      </div>

      {/* File Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">ไม่พบไฟล์ในโฟลเดอร์นี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={selectedUrls.size === files.length && files.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-600 w-12">ตัวอย่าง</th>
                  <th className="text-left p-3 font-semibold text-slate-600">ชื่อไฟล์</th>
                  <th className="text-right p-3 font-semibold text-slate-600">ขนาด</th>
                  <th className="text-right p-3 font-semibold text-slate-600">วันที่อัปโหลด</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.url}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedUrls.has(file.url) ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(file.url)}
                        onChange={() => toggleSelect(file.url)}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <img
                        src={file.url}
                        alt=""
                        className="w-10 h-10 object-cover rounded border border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </td>
                    <td className="p-3">
                      <p className="font-mono text-xs text-slate-700 truncate max-w-[300px]" title={file.pathname}>
                        {file.pathname}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-slate-500">
                      {formatSize(file.size)}
                    </td>
                    <td className="p-3 text-right text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(file.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
