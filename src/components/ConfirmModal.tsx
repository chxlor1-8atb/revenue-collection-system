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
  warningTitle = "คำเตือน",
  warningText,
  cancelText = "ยกเลิก",
  confirmText = "ยืนยัน",
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] px-8 py-10 animate-in zoom-in-95 duration-150 border-2 border-red-600 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-2xl sm:text-[28px] font-extrabold text-center text-black mb-5 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-center text-slate-900 font-medium mb-7 text-base sm:text-[17px] leading-relaxed px-4">
          {description}
        </div>

        {/* Warning Box */}
        {warningText ? (
          <div className="bg-[#FFF0E6] py-3.5 px-4 rounded-r-md rounded-l-none border-l-[6px] border-[#E85C38] mb-8 text-left w-full mx-auto">
            <div className="flex items-center gap-2 text-[#8C2A0D] font-bold text-[15px] mb-1">
              <AlertTriangle size={18} className="shrink-0 text-[#8C2A0D] fill-[#8C2A0D]" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-[#A33B1C] text-[14px] leading-relaxed font-normal ml-6">
              {warningText}
            </p>
          </div>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4 mt-2 w-full">
          {/* 2. Cancel Button (Red - สีแดง) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-8 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium rounded-sm text-[16px] transition-all shadow-sm cursor-pointer disabled:opacity-50 text-center min-w-[140px]"
          >
            {cancelText}
          </button>

          {/* 1. Confirm Button (Green - สีเขียว) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-sm text-[16px] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center min-w-[140px]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
