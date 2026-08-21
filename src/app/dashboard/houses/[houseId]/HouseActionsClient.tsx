"use client";

import { useState } from "react";
import { QrCode, FilePlus, Send, Edit2, Trash2, X, Download, Copy, Check, Loader2, FileText, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { deleteHouse, createInitialInvoice, sendLineReminder } from "../actions";
import HouseForm, { HouseData } from "../HouseForm";
import MonthPicker from "@/components/MonthPicker";
import ConfirmModal from "@/components/ConfirmModal";
import LineSendingModal from "@/components/LineSendingModal";
import { CustomField } from "../CustomFieldsManager";

export default function HouseActionsClient({ house, customFieldsSchema }: { house: HouseData, customFieldsSchema: CustomField[] }) {
  const router = useRouter();
  
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; houseNumber: string; url: string; qrDataUrl: string } | null>(null);
  const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string; isManual?: boolean } | null>(null);
  const [lineSendModal, setLineSendModal] = useState<{ isOpen: boolean; phase: 'sending' | 'success' | 'error', houseNumber?: string }>({ isOpen: false, phase: 'sending' });
  const [showForm, setShowForm] = useState(false);
  const [deletingHouse, setDeletingHouse] = useState<{ id: number; houseNumber: string } | null>(null);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sendingLine, setSendingLine] = useState<number | null>(null);

  const openQrModal = async (h: HouseData) => {
    try {
      const url = `${window.location.origin}/house/${h.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#1F2E22', light: '#FFFFFF' }
      });
      setQrModal({ isOpen: true, houseNumber: h.houseNumber, url, qrDataUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingHouse) return;
    setIsDeleting(true);
    const res = await deleteHouse(deletingHouse.id);
    setIsDeleting(false);
    if (res.success) {
      setDeletingHouse(null);
      router.push("/dashboard/houses");
    } else {
      setError(res.error || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => openQrModal(house)}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <QrCode size={16} className="text-[#5B58F2]" /> QR ชำระเงิน
        </button>
        
        <button
          onClick={() => {
            setInitialBillPrompt({
              isOpen: true,
              houseId: house.id!,
              monthYear: new Date().toISOString().slice(0, 7),
              amount: house.defaultBillingAmount || "20.00",
              isManual: true
            });
          }}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <FilePlus size={16} className="text-amber-500" /> สร้างบิล (แมนนวล)
        </button>

        {(house as any).lineUserId && (
          <button
            onClick={async () => {
              setLineSendModal({ isOpen: true, phase: "sending", houseNumber: house.houseNumber });
              setSendingLine(house.id!);
              const res = await sendLineReminder(house.id!, window.location.origin);
              setSendingLine(null);
              if (res.success) {
                setLineSendModal({ isOpen: true, phase: "success", houseNumber: house.houseNumber });
              } else {
                setLineSendModal({ isOpen: true, phase: "error", houseNumber: house.houseNumber });
              }
            }}
            disabled={sendingLine === house.id}
            className="flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {sendingLine === house.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            แจ้งเตือนผ่าน LINE
          </button>
        )}

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Edit2 size={16} className="text-blue-500" /> แก้ไข
        </button>

        <button
          onClick={() => setDeletingHouse({ id: house.id!, houseNumber: house.houseNumber })}
          className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Trash2 size={16} /> ลบ
        </button>
      </div>

      {error && (
        <div className="fixed top-4 right-4 z-[200] p-4 bg-red-50 text-red-700 rounded-xl shadow-lg border border-red-200 flex items-center gap-3 animate-in slide-in-from-top-2">
          <X size={20} className="cursor-pointer" onClick={() => setError(null)} />
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="fixed top-4 right-4 z-[200] p-4 bg-emerald-50 text-emerald-700 rounded-xl shadow-lg border border-emerald-200 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 size={20} className="cursor-pointer" onClick={() => setSuccessMsg(null)} />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {showForm && (
        <HouseForm
          initialData={house}
          customFieldsSchema={customFieldsSchema}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {deletingHouse && (
        <ConfirmModal
          isOpen={!!deletingHouse}
          title="ยืนยันการลบข้อมูลบ้าน"
          description={<>คุณต้องการลบข้อมูลบ้านเลขที่ <strong className="text-slate-900">{deletingHouse.houseNumber}</strong> ใช่หรือไม่?</>}
          warningText="ข้อมูลบิลและประวัติการชำระเงินทั้งหมดที่เกี่ยวข้องจะถูกลบออกด้วย และไม่สามารถกู้คืนได้"
          confirmText="ลบข้อมูล"
          onConfirm={handleDelete}
          onCancel={() => setDeletingHouse(null)}
          isLoading={isDeleting}
        />
      )}

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
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-1">บ้านเลขที่ {qrModal.houseNumber}</h3>
            <p className="text-slate-500 text-sm mb-6 text-center">สแกนเพื่อเข้าสู่หน้าชำระเงินของบ้านหลังนี้</p>
            <div className="bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm mb-6">
              <img src={qrModal.qrDataUrl} alt={`QR Code บ้าน ${qrModal.houseNumber}`} className="w-48 h-48 rounded-xl" />
            </div>
            <a href={qrModal.qrDataUrl} download={`qrcode_house_${qrModal.houseNumber.replace(/\//g, '-')}.png`} className="w-full py-3 bg-[#1F2E22] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#1F2E22]/20 mb-3">
              <Download size={18} /> บันทึกรูป QR Code
            </a>
            <button onClick={() => { navigator.clipboard.writeText(qrModal.url); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }} className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
              {copiedLink ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              {copiedLink ? 'คัดลอกลิงก์สำเร็จ' : 'คัดลอกลิงก์ชำระเงิน'}
            </button>
          </div>
        </div>
      )}

      {lineSendModal.isOpen && (
        <LineSendingModal isOpen={lineSendModal.isOpen} phase={lineSendModal.phase} houseNumber={lineSendModal.houseNumber} onClose={() => setLineSendModal({ isOpen: false, phase: 'sending' })} />
      )}

      {initialBillPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 relative">
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                สร้างบิลค้างชำระแบบแมนนวล
              </h3>
              {!isGeneratingBill && (
                <button onClick={() => setInitialBillPrompt(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6 leading-relaxed">ระบุยอดเงินและประจำเดือนที่ต้องการสร้างบิลค้างชำระ (เพิ่มยอดหนี้) ให้กับบ้านหลังนี้</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประจำเดือน <span className="text-red-500">*</span></label>
                  <MonthPicker value={initialBillPrompt.monthYear} onChange={(val) => setInitialBillPrompt(prev => prev ? { ...prev, monthYear: val } : null)} disabled={isGeneratingBill} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยอดเงิน (บาท) <span className="text-red-500">*</span></label>
                  <input type="number" value={initialBillPrompt.amount} onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, amount: e.target.value } : null)} disabled={isGeneratingBill} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3" step="0.01" min="0" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInitialBillPrompt(null)} disabled={isGeneratingBill} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50">
                  ยกเลิก
                </button>
                <button onClick={async () => {
                    if (!initialBillPrompt.monthYear || !initialBillPrompt.amount) return;
                    setIsGeneratingBill(true);
                    const res = await createInitialInvoice(initialBillPrompt.houseId, initialBillPrompt.monthYear, initialBillPrompt.amount, "monthly", null);
                    setIsGeneratingBill(false);
                    if (res.success) {
                      setSuccessMsg("สร้างบิลสำเร็จ");
                      setInitialBillPrompt(null);
                      router.refresh();
                    } else {
                      setError(res.error || "เกิดข้อผิดพลาดในการสร้างบิล");
                      setInitialBillPrompt(null);
                    }
                  }} disabled={isGeneratingBill} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-50">
                  {isGeneratingBill ? <><Loader2 size={16} className="animate-spin mr-2" /> กำลังสร้าง...</> : "สร้างบิลทันที"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
