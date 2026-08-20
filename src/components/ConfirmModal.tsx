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
  cancelText = "ไม่ใช่, ยกเลิก",
  confirmText = "ใช่, ดำเนินการ",
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-center text-slate-900 mb-4">
          {title}
        </h3>
        
        <div className="text-center text-slate-800 font-medium mb-5 text-[15px]">
          {description}
        </div>

        {warningText && (
          <div className="bg-[#FFF1E5] p-4 border-l-4 border-[#C73C27] mb-6 rounded-r-md">
            <div className="flex items-center gap-2 text-[#9A2B1B] font-bold mb-1">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-[#9A2B1B] text-sm leading-relaxed">
              {warningText}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-between">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-1/2 px-4 py-3 bg-[#0D1F23] hover:bg-slate-800 text-white font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-1/2 px-4 py-3 bg-white border border-[#0D1F23] text-[#0D1F23] hover:bg-slate-50 font-medium transition-colors flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[#0D1F23] border-t-transparent rounded-full animate-spin shrink-0"></span>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
