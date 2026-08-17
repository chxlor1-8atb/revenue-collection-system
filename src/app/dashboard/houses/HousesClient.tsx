"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Upload, QrCode, X } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HouseForm, { HouseData } from "./HouseForm";
import { deleteHouse } from "./actions";

export default function HousesClient({ 
  initialHouses,
  currentPage = 1,
  totalPages = 1,
  totalHouses = 0,
  initialSearch = "",
  initialSort = { key: "createdAt", dir: "desc" }
}: { 
  initialHouses: HouseData[];
  currentPage?: number;
  totalPages?: number;
  totalHouses?: number;
  initialSearch?: string;
  initialSort?: { key: string; dir: string };
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // QR Code Modal State
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; houseNumber: string; url: string; qrDataUrl: string } | null>(null);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortConfig, setSortConfig] = useState(initialSort);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, initialSearch, sortConfig]);

  const updateUrlParams = (page: number, q: string, sortKey: string, sortDir: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');

    if (q) params.set('q', q);
    else params.delete('q');

    if (sortKey !== 'createdAt') params.set('sort', sortKey);
    else params.delete('sort');

    if (sortDir !== 'desc') params.set('dir', sortDir);
    else params.delete('dir');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (key: string) => {
    let newDir = 'desc';
    if (sortConfig.key === key && sortConfig.dir === 'desc') {
      newDir = 'asc';
    }
    setSortConfig({ key, dir: newDir });
    updateUrlParams(currentPage, searchQuery, key, newDir);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrlParams(newPage, searchQuery, sortConfig.key, sortConfig.dir);
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
        
        // Skip header and parse rows
        const parsedData = lines.slice(1).map(line => {
          // simple split by comma, works for basic cases without commas inside fields
          const [houseNumber, ownerName, zone, road] = line.split(',');
          return {
            houseNumber: houseNumber?.trim(),
            ownerName: ownerName?.trim(),
            zone: zone?.trim(),
            road: road?.trim(),
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="font-bold text-3xl text-[#1F2E22]">จัดการข้อมูลบ้าน</h1>
        <div className="flex flex-wrap gap-3">
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
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload size={16} />
            {isImporting ? 'กำลังนำเข้า...' : 'Import CSV'}
          </button>
          
          <a
            href="/api/houses/export"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </a>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#1F2E22] hover:bg-[#2c4030] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            เพิ่มบ้านใหม่
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 shadow-sm flex items-start gap-3">
          <div className="mt-0.5">⚠️</div>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200 shadow-sm flex items-start gap-3">
          <div className="mt-0.5">✅</div>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Toolbar: Search */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาบ้านเลขที่ หรือ ชื่อเจ้าบ้าน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2E22]/20 focus:border-[#1F2E22] transition-all"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          พบข้อมูลทั้งหมด {totalHouses} หลัง
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500 uppercase tracking-wider">
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('houseNumber')}>
                  <div className="flex items-center gap-2">
                    บ้านเลขที่
                    <ArrowUpDown size={14} className={sortConfig.key === 'houseNumber' ? 'text-[#1F2E22]' : 'opacity-50'} />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('ownerName')}>
                  <div className="flex items-center gap-2">
                    ชื่อเจ้าบ้าน
                    <ArrowUpDown size={14} className={sortConfig.key === 'ownerName' ? 'text-[#1F2E22]' : 'opacity-50'} />
                  </div>
                </th>
                <th className="p-4">ชุมชน/หมู่</th>
                <th className="p-4">ถนน</th>
                <th className="p-4">สมุดบัญชีบ้าน</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialHouses.map((house) => (
                <tr key={house.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{house.houseNumber}</td>
                  <td className="p-4 font-medium">{house.ownerName}</td>
                  <td className="p-4 text-slate-500">{house.zone || "-"}</td>
                  <td className="p-4 text-slate-500">{house.road || "-"}</td>
                  <td className="p-4">
                    <Link 
                      href={`/dashboard/houses/${house.id}`} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                      ดูข้อมูลบิล
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openQrModal(house)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="สร้าง QR Code หน้าบ้าน"
                      >
                        <QrCode size={14} />
                        QR
                      </button>
                      <button
                        onClick={() => handleEdit(house)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => confirmDelete(house.id!, house.houseNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {initialHouses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-slate-400 mb-2">🏠</div>
                    <div className="text-slate-500 font-medium">ไม่พบข้อมูลบ้าน</div>
                    {searchQuery ? (
                      <div className="text-sm text-slate-400 mt-1">ลองค้นหาด้วยคำอื่นดูอีกครั้ง</div>
                    ) : (
                      <div className="text-sm text-slate-400 mt-1">กดปุ่ม "เพิ่มบ้านใหม่" ด้านบนเพื่อเริ่มต้น</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              หน้า <span className="font-bold text-slate-700">{currentPage}</span> จาก <span className="font-bold text-slate-700">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <HouseForm 
          initialData={editingHouse} 
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
              ยืนยันการลบ
            </h3>
            <p className="text-center text-slate-600 mb-2">
              คุณต้องการลบข้อมูลบ้านเลขที่ <strong className="text-slate-900">{deletingHouse.houseNumber}</strong> ใช่หรือไม่?
            </p>
            <p className="text-center text-xs text-red-500 mb-6 bg-red-50 p-2 rounded-lg">
              *จะลบได้ก็ต่อเมื่อไม่มีบิลค้างอยู่ในระบบเท่านั้น
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingHouse(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting ? "กำลังลบ..." : "ลบข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && qrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQrModal(null)}>
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
              className="w-full py-3 bg-[#1F2E22] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#1F2E22]/20"
            >
              <Download size={18} />
              บันทึกรูป QR Code
            </a>
            
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
