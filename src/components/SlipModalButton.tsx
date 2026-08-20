"use client";

import { useState } from "react";
import { ReceiptText, Receipt, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SlipModalButton({ imageUrl, buttonStyle = "history", children }: { imageUrl: string, buttonStyle?: "history" | "house", children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slip-${new Date().getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback
      window.open(imageUrl, '_blank');
    }
  };

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
                  <div className="absolute -top-4 -right-4 z-10 flex flex-col gap-2">
                    <button 
                      className="text-white/90 hover:text-white transition-all bg-black/60 hover:bg-black/80 shadow-lg p-2 rounded-full ring-1 ring-white/20 backdrop-blur-md hover:scale-110 flex items-center justify-center" 
                      onClick={() => setIsOpen(false)}
                      title="ปิด"
                    >
                       <X size={20} />
                    </button>
                    <button 
                      className="text-white/90 hover:text-white transition-all bg-black/60 hover:bg-black/80 shadow-lg p-2 rounded-full ring-1 ring-white/20 backdrop-blur-md hover:scale-110 flex items-center justify-center" 
                      onClick={handleDownload}
                      title="ดาวน์โหลดภาพ"
                    >
                       <Download size={20} />
                    </button>
                  </div>
                  <img 
                    src={imageUrl} 
                    alt="Slip" 
                    className="max-w-[90vw] md:max-w-[60vw] lg:max-w-[40vw] max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10 bg-black/20" 
                  />
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
