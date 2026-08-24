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
  cancelText = "ไม่ใช่, ยกเลิก",
  confirmText = "ใช่, ดำเนินการ",
  variant = "success",
  onConfirm,
  onCancel,
  onClose,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});

  const confirmBtnStyles = variant === "danger"
    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
    : variant === "primary"
    ? "bg-[#5B58F2] hover:bg-[#4A47D1] text-white shadow-[#5B58F2]/20"
    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
          {title}
        </h3>
        
        <div className="text-center text-slate-600 font-medium mb-6 text-sm">
          {description}
        </div>

        {warningText && (
          <div className="bg-amber-50 p-4 border border-amber-200 mb-6 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800 font-bold mb-1 text-sm">
              <AlertTriangle size={17} className="shrink-0 text-amber-600" />
              <span>{warningTitle}</span>
            </div>
            <p className="text-amber-700 text-xs leading-relaxed">
              {warningText}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-1/2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer border border-slate-200/80"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-1/2 px-4 py-2.5 ${confirmBtnStyles} font-semibold rounded-xl text-sm transition-all shadow-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
