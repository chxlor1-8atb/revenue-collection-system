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
  warningTitle = "Warning",
  warningText,
  cancelText = "No, Cancel",
  confirmText = "Yes, Delete",
  variant,
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  // Auto-detect danger variant if title or confirmText implies deletion/voiding/rejecting
  const isDanger = variant === "danger" || (!variant && (
    (typeof title === 'string' && (title.includes('ลบ') || title.includes('ยกเลิก') || title.toLowerCase().includes('delete') || title.toLowerCase().includes('void') || title.includes('ปฏิเสธ') || title.includes('ออกจากระบบ'))) ||
    (typeof confirmText === 'string' && (confirmText.includes('ลบ') || confirmText.includes('ยกเลิก') || confirmText.toLowerCase().includes('delete') || confirmText.includes('ปฏิเสธ')))
  ));

  const resolvedVariant = variant || (isDanger ? "danger" : "success");

  // Cancel button is Red (#DC2626), Confirm button is Green (#10B981)
  const cancelBtnStyles = "bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626] shadow-sm shadow-red-500/20";
  const confirmBtnStyles = "bg-[#10B981] hover:bg-[#059669] text-white border border-[#10B981] shadow-sm shadow-emerald-500/20";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] p-7 sm:p-9 animate-in zoom-in-95 duration-150 border border-slate-100 text-left relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-2xl font-bold text-center text-slate-900 mb-3 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-center text-slate-700 font-medium mb-5 text-sm sm:text-base leading-relaxed">
          {description}
        </div>

        {/* Warning Box (Soft peach background with orange accent left bar) */}
        {warningText && (
          <div className="bg-[#FDF0E7] p-4 rounded-md border-l-[5px] border-[#F25A38] mb-6 text-left shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#9C3217] font-bold text-sm mb-1">
              <AlertTriangle size={15} className="shrink-0 text-[#E05326] fill-[#E05326] text-white" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-[#A34224] text-xs sm:text-[13px] leading-relaxed font-normal">
              {warningText}
            </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4 pt-1 w-full">
          {/* Cancel Button (Red Color - สีแดง) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className={`px-6 py-2.5 ${cancelBtnStyles} font-bold rounded-lg text-sm transition-all cursor-pointer disabled:opacity-50 text-center min-w-[120px]`}
          >
            {cancelText}
          </button>

          {/* Confirm Button (Green Color - สีเขียว) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 ${confirmBtnStyles} font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-w-[120px] text-center`}
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
