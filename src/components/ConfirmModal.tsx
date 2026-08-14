import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  warningText?: ReactNode;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  cancelText = "No, Cancel",
  confirmText = "Yes, Confirm",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden font-sans"
          >
            <div className="p-8 pb-8 text-center">
              <h3 className="text-xl font-bold text-black mb-4 tracking-wide">
                {title}
              </h3>
              
              <div className="text-slate-800 mb-6 text-[15px]">
                {description}
              </div>
              
              {warningText && (
                <div className="bg-[#FDECE3] border-l-4 border-[#F05A2B] text-left p-4 mb-8">
                  <div className="flex items-center gap-2 text-[#9B371F] font-bold mb-1.5">
                    <AlertTriangle size={18} strokeWidth={2.5} />
                    <span>Warning</span>
                  </div>
                  <div className="text-[#9B371F] text-sm leading-relaxed pr-2 opacity-90">
                    {warningText}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-4 mt-2">
                <button
                  disabled={isLoading}
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 font-semibold text-white bg-[#0B1E19] hover:bg-[#15342c] transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  disabled={isLoading}
                  onClick={onConfirm}
                  className="flex-1 py-2.5 px-4 font-semibold text-black bg-white border border-black hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
