"use client";
import { encodeSecureId } from "@/lib/secureId";

import { useState } from "react";
import { QrCode, FilePlus, Send, Edit2, Trash2, X, Download, Copy, Check, Loader2, FileText, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
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
      const url = `${window.location.origin}/house/${encodeSecureId(h.id)}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#1E293B', light: '#FFFFFF' }
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
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        
        {/* 1. Citizen Portal Primary Link */}
        <a 
          href={`/house/${encodeSecureId(house.id)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
        >
          <span>หน้าเว็บบ้านลูกบ้าน</span>
          <ExternalLink size={13} />
        </a>

        {/* 2. Billing Actions Group */}
        <div className="flex items-center bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <button 
            type="button"
            onClick={() => openQrModal(house)}
            className="flex items-center gap-1.5 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer border-r border-slate-200/90"
          >
            <QrCode size={15} className="text-[blue-600]" />
            <span className="hidden sm:inline">QR ชำระเงิน</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setInitialBillPrompt({
                isOpen: true,
                houseId: house.id!,
                monthYear: new Date().toISOString().slice(0, 7),
                amount: house.defaultBillingAmount || "20.00",
                isManual: true
              });
            }}
            className="flex items-center gap-1.5 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            <FilePlus size={15} className="text-amber-500" />
            <span className="hidden sm:inline">ออกบิลรายหลัง</span>
          </button>
        </div>

        {/* 3. Management & Danger Actions Group */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          {(house as any).lineUserId && (
            <button
              type="button"
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
              title="ส่งแจ้งเตือน LINE"
              className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              {sendingLine === house.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowForm(true)}
            title="แก้ไขข้อมูลบ้าน"
            className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors shadow-2xs"
          >
            <Edit2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => setDeletingHouse({ id: house.id!, houseNumber: house.houseNumber })}
            title="ลบข้อมูลบ้าน"
            className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-red-600 rounded-lg transition-colors shadow-2xs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed top-4 right-4 z-[200] p-4 bg-red-50 text-red-700 rounded-2xl shadow-xl border border-red-200 flex items-center gap-3 animate-in slide-in-from-top-2">
          <X size={18} className="cursor-pointer" onClick={() => setError(null)} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="fixed top-4 right-4 z-[200] p-4 bg-emerald-50 text-emerald-700 rounded-2xl shadow-xl border border-emerald-200 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="cursor-pointer" onClick={() => setSuccessMsg(null)} />
          <span className="text-xs font-bold">{successMsg}</span>
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
          confirmText="ลบข้อมูลทันที"
          onConfirm={handleDelete}
          onCancel={() => setDeletingHouse(null)}
          isLoading={isDeleting}
          variant="danger"
        />
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm w-full relative text-center border border-slate-200/90 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => setQrModal(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[blue-600] flex items-center justify-center mx-auto mb-3">
              <QrCode size={24} />
            </div>

            <h3 className="font-bold text-lg text-slate-900">QR Code ชำระเงิน</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">บ้านเลขที่ {qrModal.houseNumber}</p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner mb-4">
              <img src={qrModal.qrDataUrl} alt="House Payment QR" className="w-48 h-48 mx-auto rounded-xl" />
            </div>

            <div className="space-y-2">
              <a
                href={qrModal.qrDataUrl}
                download={`QR_House_${qrModal.houseNumber}.png`}
                className="w-full py-2.5 bg-gradient-to-r from-[blue-600] to-indigo-600 hover:from-[blue-700] hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} /> ดาวน์โหลดภาพ QR Code
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedLink ? "คัดลอกลิงก์เรียบร้อย!" : "คัดลอกลิงก์หน้าเว็บบ้าน"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual Single Bill Modal */}
      {initialBillPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setInitialBillPrompt(null)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative border border-slate-200/90 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <FilePlus size={16} />
                </div>
                <h3 className="font-bold text-base text-slate-800">ออกบิลรายหลัง</h3>
              </div>
              <button 
                onClick={() => setInitialBillPrompt(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รอบเดือนที่ต้องการออกบิล</label>
                <MonthPicker
                  value={initialBillPrompt.monthYear}
                  onChange={(val) => setInitialBillPrompt({ ...initialBillPrompt, monthYear: val })}
                  disabled={isGeneratingBill}
                  placement="bottom"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ยอดเงินเรียกเก็บ (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBillPrompt.amount}
                  onChange={(e) => setInitialBillPrompt({ ...initialBillPrompt, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[blue-600]/30 focus:border-[blue-600] outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInitialBillPrompt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  disabled={isGeneratingBill}
                  onClick={async () => {
                    setIsGeneratingBill(true);
                    const res = await createInitialInvoice(initialBillPrompt.houseId, initialBillPrompt.monthYear, initialBillPrompt.amount);
                    setIsGeneratingBill(false);
                    if (res.success) {
                      setInitialBillPrompt(null);
                      router.refresh();
                    } else {
                      setError(res.error || "เกิดข้อผิดพลาดในการสร้างบิล");
                    }
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[blue-600] to-indigo-600 hover:from-[blue-700] hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isGeneratingBill ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>ยืนยันออกบิล</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LINE Sending Indicator Modal */}
      <LineSendingModal
        isOpen={lineSendModal.isOpen}
        phase={lineSendModal.phase}
        houseNumber={lineSendModal.houseNumber}
        onClose={() => setLineSendModal({ isOpen: false, phase: "sending" })}
      />
    </>
  );
}
