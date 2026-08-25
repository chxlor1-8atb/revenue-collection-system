"use client";

import { useEffect } from "react";
import { X, Printer, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceItem {
  id?: number;
  monthYear: string;
  amount: string | number;
  houseNumber?: string;
  ownerName?: string;
}

interface ReceiptData {
  id: number;
  amount: string | number;
  paidAt?: string | Date | null;
  createdAt?: string | Date | null;
  verifiedBy?: string | null;
  slipRefId?: string | null;
  houseNumber?: string;
  ownerName?: string;
  senderName?: string | null;
  paidVia?: string;
  zone?: string | null;
  invoices?: InvoiceItem[];
  months?: string[];
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReceiptData | null;
}

function formatThaiMonth(monthYear: string) {
  if (!monthYear) return "-";
  const thaiMonths = [
    "", "���Ҥ�", "����Ҿѹ��", "�չҤ�", "����¹", "����Ҥ�", "�Զع�¹",
    "�á�Ҥ�", "�ԧ�Ҥ�", "�ѹ��¹", "���Ҥ�", "��Ȩԡ�¹", "�ѹ�Ҥ�"
  ];
  const parts = monthYear.split("-");
  if (parts.length < 2) return monthYear;
  const [year, month] = parts;
  const monthIdx = parseInt(month, 10);
  const yearBe = parseInt(year, 10) + 543;
  return `${thaiMonths[monthIdx] || month} ${yearBe}`;
}

export default function ReceiptModal({ isOpen, onClose, item }: ReceiptModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const totalAmount = parseFloat(String(item.amount || "0"));
  const paidDate = item.paidAt ? new Date(item.paidAt) : item.createdAt ? new Date(item.createdAt) : new Date();

  // Prepare invoice rows
  const invoiceList: InvoiceItem[] = 
    item.invoices && item.invoices.length > 0 
      ? item.invoices 
      : item.months && item.months.length > 0 
        ? item.months.map((m, idx) => ({
            id: idx + 1,
            monthYear: m,
            amount: totalAmount / (item.months?.length || 1),
            houseNumber: item.houseNumber,
            ownerName: item.ownerName
          }))
        : [{
            id: 1,
            monthYear: new Date().toISOString().slice(0, 7),
            amount: totalAmount,
            houseNumber: item.houseNumber,
            ownerName: item.ownerName
          }];

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:block print:z-auto">
        {/* Backdrop click to close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 print:hidden"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden print:max-h-none print:w-full print:shadow-none print:border-none print:rounded-none print:overflow-visible print:block"
        >
          {/* Header Bar (Screen Only) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/90 backdrop-blur-xs shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span>��͹��Ѻ</span>
              </button>
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                | ������Ѻ�Թ #{item.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#5B58F2] hover:bg-[#4A47D1] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>����������</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="�Դ˹�ҵ�ҧ (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Body (Screen: scrollable, Print: full-bleed A4) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 custom-scrollbar bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible print:block">
            {/* Pure Document Sheet (No double outer card) */}
            <div 
              id="printable-receipt"
              className="relative mx-auto bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-xs print:border-none print:shadow-none print:p-0 print:rounded-none overflow-hidden max-w-[210mm]"
            >
              {/* Official Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden select-none">
                <span className="text-[70px] sm:text-[110px] md:text-[130px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                  �ͧ�Ҹ�ó�آ
                </span>
              </div>

              {/* Document Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b-2 border-slate-800 pb-5 sm:pb-6 mb-6 gap-4 sm:gap-0">
                  <div className="flex gap-4 items-center">
                    <img 
                      src="/nangrong-logo.png" 
                      alt="�Ⱥ�����ͧ�ҧ�ͧ" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" 
                    />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">������Ѻ�Թ</h1>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-700 mt-0.5">�Ⱥ�����ͧ�ҧ�ͧ</h2>
                      <p className="text-xs sm:text-sm text-slate-500">�.�ҧ�ͧ �.���������</p>
                    </div>
                  </div>
                  <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-xl sm:text-3xl font-black tracking-widest text-slate-300 sm:mb-1.5 order-2 sm:order-1">
                      ���Ф�Ң��
                    </div>
                    <div className="order-1 sm:order-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700">�Ţ�����¡��: #{item.id}</p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        �ѹ���: ${paidDate.toLocaleString('th-TH', { 
                          day: 'numeric', month: 'long', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer & Payment Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 text-xs sm:text-sm">
                  <div className="bg-slate-50/60 p-3 sm:p-0 rounded-lg sm:bg-transparent">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">���Ѻ�Թ�ҡ</h3>
                    <p className="text-sm sm:text-base font-bold text-slate-800">{item.ownerName || "-"}</p>
                    <p className="text-slate-600 mt-0.5">��ҹ�Ţ���: <span className="font-semibold text-slate-800">{item.houseNumber || "-"}</span></p>
                    <p className="text-slate-600">�����: {item.zone || "-"}</p>
                  </div>
                  <div className="sm:text-right bg-slate-50/60 p-3 sm:p-0 rounded-lg sm:bg-transparent">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">��������´��ê���</h3>
                    <p className="text-slate-800 font-medium">{item.senderName || item.ownerName || "-"}</p>
                    <p className="text-slate-600 mt-0.5">��ͧ�ҧ: <span className="font-semibold text-slate-800">{item.paidVia || "���䫵�"}</span></p>
                    {item.slipRefId && (
                      <p className="text-slate-500 text-[11px] font-mono mt-0.5">Ref Code: {item.slipRefId}</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800">
                        <th className="py-2.5 px-2 text-left text-xs sm:text-sm font-bold text-slate-700 w-12 sm:w-16">�ӴѺ</th>
                        <th className="py-2.5 px-2 text-left text-xs sm:text-sm font-bold text-slate-700">��¡�ê����Թ</th>
                        <th className="py-2.5 px-2 text-right text-xs sm:text-sm font-bold text-slate-700">�ӹǹ�Թ (�ҷ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoiceList.map((inv, index) => (
                        <tr key={inv.id || index}>
                          <td className="py-3 px-2 text-xs sm:text-sm text-slate-600">{index + 1}</td>
                          <td className="py-3 px-2">
                            <div className="font-semibold text-xs sm:text-sm text-slate-800">��Ҹ��������Ѵ�红����Ž��</div>
                            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                              ��Ш���͹: {formatThaiMonth(inv.monthYear)} {inv.id ? `(���ʺ��: #${inv.id})` : ""}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-xs sm:text-sm text-slate-800">
                            {parseFloat(String(inv.amount || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 border-b-2 border-slate-800">
                        <td colSpan={2} className="py-3 px-3 sm:px-4 text-right font-bold text-xs sm:text-sm text-slate-700">
                          ����Թ������
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-sm sm:text-base text-slate-900">
                          �{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Symmetrical Signatures Section */}
                <div className="grid grid-cols-2 gap-6 sm:gap-16 mt-8 sm:mt-12 pt-4">
                  <div className="text-center flex flex-col items-center">
                    <div className="h-8 sm:h-10 flex items-end justify-center mb-1.5 w-36 sm:w-56 border-b border-slate-400 border-dashed pb-1">
                      <span className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-full px-1">
                        {item.ownerName || "-"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">�������Թ</p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="h-8 sm:h-10 flex items-end justify-center mb-1.5 w-36 sm:w-56 border-b border-slate-400 border-dashed pb-1">
                      <span className="text-slate-800 font-bold text-xs sm:text-sm truncate max-w-full px-1">
                        {item.verifiedBy === "line_bot" ? "�к�͹��ѵ��ѵ��ѵ�" : item.verifiedBy || "���˹�ҷ��"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">����Ѻ�Թ / ����Ǩ�ͺ</p>
                  </div>
                </div>

                {/* Print Only Notice */}
                <div suppressHydrationWarning className="text-center text-[10px] sm:text-xs text-slate-400 mt-10 pt-4 border-t border-slate-100 print:block hidden">
                  �͡��é�Ѻ���١���ҧ��鹴����к�����硷�͹ԡ�� � �ѹ�������: ${new Date().toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
