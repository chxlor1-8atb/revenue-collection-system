"use client";

import { useState } from "react";
import { ReceiptText, Receipt, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SlipModalButton({ imageUrl, buttonStyle = "history" }: { imageUrl: string, buttonStyle?: "history" | "house" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors font-medium"
      >
        {buttonStyle === "history" ? <ReceiptText size={14} /> : <Receipt size={14} />} ดูสลิป
      </button>

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
               className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center justify-center" 
               onClick={e => e.stopPropagation()}
             >
                <button 
                  className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full" 
                  onClick={() => setIsOpen(false)}
                >
                   <X size={24} />
                </button>
                <img 
                  src={imageUrl} 
                  alt="Slip" 
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
                />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
