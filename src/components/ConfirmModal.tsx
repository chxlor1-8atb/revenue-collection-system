import React from 'react';

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
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[500px] p-8 sm:p-10 animate-in zoom-in-95 duration-150 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-2xl sm:text-[28px] font-extrabold text-center text-slate-950 mb-4 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-center text-slate-800 font-medium mb-6 text-[16px] leading-relaxed">
          {description}
        </div>

        {/* Warning Box */}
        {warningText ? (
          <div className="bg-[#FFF0E6] p-4 sm:p-4.5 rounded-r-md rounded-l-none border-l-[6px] border-[#FF5A36] mb-8 text-left w-full mx-auto">
            <div className="flex items-start gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                <path d="M12 2L1 21H23L12 2ZM12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18ZM13 14H11V10H13V14Z" fill="#8C2A0D"/>
              </svg>
              <div>
                <div className="text-[#8C2A0D] font-bold text-[15px] leading-tight">
                  {warningTitle}
                </div>
                <div className="text-[#A33B1C] text-[13.5px] leading-relaxed font-normal mt-1">
                  {warningText}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between w-full">
          {/* 2. Cancel Button (Red - สีแดง) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6 py-3 sm:px-7 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium rounded-sm text-[15px] sm:text-[16px] transition-all cursor-pointer disabled:opacity-50 text-center"
          >
            {cancelText}
          </button>

          {/* 1. Confirm Button (Green - สีเขียว) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-3 sm:px-7 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-sm text-[15px] sm:text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
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
