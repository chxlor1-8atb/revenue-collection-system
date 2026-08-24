import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  warningTitle?: string;
  warningText?: string;
  cancelText?: string;
  confirmText?: string;
  variant?: "success" | "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  warningTitle = "คำเตือน (Warning)",
  warningText,
  cancelText = "ยกเลิก (No, Cancel)",
  confirmText = "ยืนยัน (Confirm)",
  variant,
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  // Auto-detect danger variant if title or confirmText implies deletion/voiding
  const isDanger = variant === "danger" || (!variant && (
    (typeof title === 'string' && (title.includes('ลบ') || title.includes('ยกเลิก') || title.toLowerCase().includes('delete') || title.toLowerCase().includes('void') || title.includes('ปฏิเสธ'))) ||
    (typeof confirmText === 'string' && (confirmText.includes('ลบ') || confirmText.includes('ยกเลิก') || confirmText.toLowerCase().includes('delete')))
  ));

  const resolvedVariant = variant || (isDanger ? "danger" : "success");

  // Button styles: Red for danger/delete, Green for success/confirm, Indigo for primary
  const confirmBtnStyles = resolvedVariant === "danger"
    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 border border-rose-600"
    : resolvedVariant === "primary"
    ? "bg-[#5B58F2] hover:bg-[#4A47D1] text-white shadow-md shadow-[#5B58F2]/20 border border-[#5B58F2]"
    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-emerald-600";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-[480px] overflow-hidden p-7 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 mb-2.5 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-slate-700 font-medium mb-6 text-sm sm:text-base leading-relaxed">
          {description}
        </div>

        {/* Warning Box */}
        {warningText && (
          <div className="bg-[#FDF1E8] p-4 rounded-2xl border-l-4 border-[#F26E43] mb-6 text-left shadow-2xs">
            <div className="flex items-center gap-2 text-[#993A1C] font-bold mb-1 text-sm">
              <AlertTriangle size={17} className="shrink-0 text-[#E05326]" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-[#A34B2E] text-xs sm:text-[13px] leading-relaxed font-normal">
              {warningText}
            </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 pt-1">
          {/* Cancel Button (Dark Charcoal Solid Pill) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-5 bg-[#112022] hover:bg-[#1C3337] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 text-center"
          >
            {cancelText}
          </button>

          {/* Confirm Button (Red for delete / Green for confirm) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-5 ${confirmBtnStyles} font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
