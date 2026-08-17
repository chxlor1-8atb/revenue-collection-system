"use client";

import { useState, useEffect, useCallback, useRef, useTransition, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Upload, QrCode, X, Settings, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HouseForm, { HouseData } from "./HouseForm";
import GenerateInvoiceButton from "./GenerateInvoiceButton";
import { deleteHouse } from "./actions";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import CustomFieldsManager, { CustomField } from "./CustomFieldsManager";
import TablePagination from "@/components/TablePagination";

export default function HousesClient({ 
  initialHouses,
  currentPage = 1,
  totalPages = 1,
  totalHouses = 0,
  initialSearch = "",
  initialSort = { key: "createdAt", dir: "desc" },
  customFieldsSchema = []
}: { 
  initialHouses: HouseData[];
  currentPage?: number;
  totalPages?: number;
  totalHouses?: number;
  initialSearch?: string;
  initialSort?: { key: string; dir: string };
  customFieldsSchema?: CustomField[];
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
  const [showSettings, setShowSettings] = useState(false);
  const [isPending, startTransition] = useTransition();
  
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

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
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

  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="font-bold text-2xl text-slate-800 tracking-tight">จัดการข้อมูลบ้าน</h1>
        <div className="flex flex-wrap gap-2">
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
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload size={14} />
            {isImporting ? 'กำลังนำเข้า...' : 'นำเข้า CSV'}
          </button>
          
          <a
            href="/api/houses/export"
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Download size={14} />
            ส่งออก CSV
          </a>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            title="ตั้งค่าฟิลด์เพิ่มเติม"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} />
            เพิ่มบ้านใหม่
          </button>
          
          <div className="w-[1px] bg-slate-200 h-8 mx-1 self-center hidden sm:block"></div>

          <GenerateInvoiceButton />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 shadow-sm flex items-start gap-3">
          <div className="mt-0.5">⚠️</div>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 shadow-sm flex items-start gap-3">
          <div className="mt-0.5">✅</div>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Main Card Container */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Toolbar: Search */}
        <div className="p-8 lg:p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80 z-20">
            <SearchAutocomplete 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="ค้นหาบ้านหรือชื่อเจ้าของ..."
              className="w-full sm:w-80 focus:w-full sm:focus:w-80 !bg-slate-50 border-transparent focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 shadow-none text-sm rounded-xl"
            />
          </div>
          <div className="text-[length:13px] text-slate-400 font-medium z-10 flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ทั้งหมด {totalHouses}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                {customFieldsSchema.filter(f => !f.isHidden).map(field => (
                  <th key={field.id} className={`px-4 py-3 text-[length:11px] font-semibold uppercase tracking-wider ${field.isSystem && (field.id === 'houseNumber' || field.id === 'ownerName') ? 'cursor-pointer text-slate-500 hover:text-slate-800 transition-colors' : 'text-slate-400'}`} onClick={() => {
                    if (field.id === 'houseNumber' || field.id === 'ownerName') handleSort(field.id);
                  }}>
                    <div className="flex items-center gap-1.5">
                      {field.name}
                      {(field.id === 'houseNumber' || field.id === 'ownerName') && (
                        <ArrowUpDown size={12} className={sortConfig.key === field.id ? 'text-[#5B58F2]' : 'opacity-30'} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider">บัญชี</th>
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-50 text-slate-700 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
              <AnimatePresence mode="wait">
                {initialHouses.map((house, index) => (
                  <motion.tr 
                    key={house.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                  {customFieldsSchema.filter(f => !f.isHidden).map(field => {
                    let val = "-";
                    if (field.isSystem) {
                      val = (house as any)[field.id] || "-";
                    } else {
                      val = (house.customFields as Record<string, any>)?.[field.id] || "-";
                    }
                    
                    if (field.id === 'houseNumber') {
                      return <td key={field.id} className="px-4 py-4 font-mono font-bold text-slate-800 text-[length:13px]">{val}</td>;
                    }
                    if (field.id === 'ownerName') {
                      return <td key={field.id} className="px-4 py-4 font-semibold text-[length:13px]">{val}</td>;
                    }
                    return <td key={field.id} className="px-4 py-4 text-slate-500 text-[length:13px]">{val}</td>;
                  })}
                  <td className="px-4 py-4">
                    <Link 
                      href={`/dashboard/houses/${house.id}`} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[length:11px] font-bold text-[#5B58F2] bg-[#EEF0FF] hover:bg-[#E0E4FF] rounded-full transition-colors"
                    >
                      ดูบิลชำระ
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openQrModal(house)}
                        className="p-2 text-slate-400 hover:text-[#5B58F2] hover:bg-slate-100 rounded-lg transition-colors"
                        title="QR Code"
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(house)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(house.id!, house.houseNumber)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                ))}
              </AnimatePresence>
              
              {initialHouses.length === 0 && !isPending && (
                <tr>
                  <td colSpan={2 + customFieldsSchema.filter(f => !f.isHidden).length} className="p-16 text-center">
                    <div className="text-slate-300 mb-3 flex justify-center"><Home size={40} /></div>
                    <div className="text-slate-500 font-semibold">ไม่พบข้อมูลบ้าน</div>
                    <div className="text-[length:13px] text-slate-400 mt-1">
                      {searchQuery ? "ลองค้นหาด้วยคำอื่น" : "คลิก 'เพิ่มบ้านใหม่' เพื่อเริ่มต้น"}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalHouses}
          itemsPerPage={20} // Assuming limit=20 in page.tsx
          onPageChange={handlePageChange}
        />
      </div>

      {showForm && (
        <HouseForm 
          initialData={editingHouse} 
          customFieldsSchema={customFieldsSchema}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
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
