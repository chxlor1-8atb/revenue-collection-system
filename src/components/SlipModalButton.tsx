"use client";

import { useState } from "react";
import { ReceiptText, Receipt, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SlipModalButton({ imageUrl, buttonStyle = "history", children }: { imageUrl: string, buttonStyle?: "history" | "house", children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children ? (
        <div onClick={() => setIsOpen(true)} className="inline-block">
          {children}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors font-medium"
        >
          {buttonStyle === "history" ? <ReceiptText size={14} /> : <Receipt size={14} />} ดูสลิป
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
               className="relative max-h-[90vh] flex flex-col items-center justify-center px-4" 
               onClick={e => e.stopPropagation()}
             >
                <div className="relative inline-block">
                  <button 
                    className="absolute -top-4 -right-4 z-10 text-white/90 hover:text-white transition-all bg-black/60 hover:bg-black/80 shadow-lg p-2 rounded-full ring-1 ring-white/20 backdrop-blur-md hover:scale-110" 
                    onClick={() => setIsOpen(false)}
                  >
                     <X size={20} />
                  </button>
                  <img 
                    src={imageUrl} 
                    alt="Slip" 
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
                  />
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
