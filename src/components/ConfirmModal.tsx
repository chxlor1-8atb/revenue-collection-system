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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-[22px] shadow-2xl w-full max-w-[500px] p-8 sm:p-10 animate-in zoom-in-95 duration-150 border border-slate-100/90 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-2xl sm:text-[26px] font-bold text-center text-slate-950 mb-3.5 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-center text-slate-900 font-medium mb-6 text-sm sm:text-base leading-relaxed">
          {description}
        </div>

        {/* Warning Box */}
        {warningText ? (
          <div className="bg-[#FFEFE6] p-4 rounded-md border-l-[6px] border-[#FF5A36] mb-8 text-left shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#88240A] font-bold text-sm sm:text-[15px] mb-1">
              <AlertTriangle size={16} className="shrink-0 text-[#E04B26] fill-[#E04B26] text-white" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-[#9E3618] text-xs sm:text-[13px] leading-relaxed font-normal">
              {warningText}
            </p>
          </div>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4 pt-1 w-full">
          {/* 2. Cancel Button (Red - สีแดง) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-7 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded text-sm sm:text-[15px] transition-all shadow-xs cursor-pointer disabled:opacity-50 text-center border border-[#DC2626] min-w-[125px]"
          >
            {cancelText}
          </button>

          {/* 1. Confirm Button (Green - สีเขียว) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-7 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded text-sm sm:text-[15px] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center border border-[#10B981] min-w-[125px]"
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
