"use client";

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
  warningTitle = "Warning",
  warningText,
  cancelText = "No, Cancel",
  confirmText = "Yes, Delete",
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-[16px] shadow-2xl w-full max-w-[500px] px-5 py-6 sm:px-8 sm:py-8 animate-in zoom-in-95 duration-150 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-[20px] sm:text-[24px] font-bold text-center text-black mb-2 sm:mb-3 tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <div className="text-center text-black font-medium mb-5 sm:mb-6 text-[15px] sm:text-[17px] leading-snug px-0 sm:px-2">
          {description}
        </div>

        {/* Warning Box */}
        {warningText ? (
          <div className="bg-[#FFF0E6] py-3.5 px-4 rounded-r-[6px] rounded-l-none border-l-[6px] border-[#FF5B35] mb-6 w-full text-left">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                <path d="M12 2L1 21H23L12 2ZM12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18ZM13 14H11V10H13V14Z" fill="#89290B"/>
              </svg>
              <div>
                <div className="text-[#89290B] font-bold text-[15px] sm:text-[16px] leading-tight mb-1">
                  {warningTitle}
                </div>
                <div className="text-[#A64121] text-[13px] sm:text-[14px] leading-relaxed font-normal">
                  {warningText}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full mt-2 gap-3 sm:gap-4">
          {/* Cancel Button (Red) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-[4px] sm:rounded-[2px] text-[15px] sm:text-[16px] transition-colors cursor-pointer disabled:opacity-50 text-center sm:min-w-[140px]"
          >
            {cancelText}
          </button>

          {/* Confirm Button (White with Green Border) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2.5 bg-white hover:bg-emerald-50 text-[#10B981] border border-[#10B981] font-semibold rounded-[4px] sm:rounded-[2px] text-[15px] sm:text-[16px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center sm:min-w-[140px]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin shrink-0"></span>
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
