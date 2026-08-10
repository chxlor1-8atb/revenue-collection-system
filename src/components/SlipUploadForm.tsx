"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle, Receipt, ArrowRight } from "lucide-react";

export default function SlipUploadForm({ qrCodeId, invoiceIds }: { qrCodeId: string, invoiceIds?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("qrCodeId", qrCodeId);
      if (invoiceIds) {
        formData.append("invoiceIds", invoiceIds);
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full absolute inset-0 z-50 bg-emerald-600 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-white shadow-2xl"
      >
        {/* Confetti or subtle background shapes could go here */}
        
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/20 mb-6 relative"
        >
          <CheckCircle size={48} className="text-emerald-500" strokeWidth={3} />
          
          {/* Ripple effect */}
          <motion.div 
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full border-4 border-white"
          />
        </motion.div>

        {/* The VERIFIED Stamp Animation */}
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: -5 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.5 }}
          className="border-4 border-white text-white font-mono font-bold text-2xl tracking-widest px-4 py-1 rounded mb-8 shadow-sm backdrop-blur-sm bg-emerald-500/30"
        >
          VERIFIED
        </motion.div>

        <h3 className="font-sans text-2xl font-bold mb-2">ทำรายการสำเร็จ</h3>
        <p className="font-sans text-emerald-100 text-center text-sm max-w-[200px] mb-10">
          ระบบได้รับหลักฐานการโอนเงินของคุณแล้ว
        </p>

        <button 
          onClick={() => window.location.href = "/"}
          className="bg-white text-emerald-700 font-semibold py-3 px-6 rounded-xl hover:bg-emerald-50 transition-colors shadow-md flex items-center gap-2"
        >
          กลับสู่หน้าหลัก <ArrowRight size={18} />
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <div className="relative border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-6 text-center group overflow-hidden">
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            required
          />
          <div className="flex flex-col items-center justify-center space-y-2 relative z-0">
            <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <UploadCloud size={24} className="text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="font-sans text-sm font-semibold text-slate-700">อัปโหลดสลิปการโอนเงิน</p>
            <p className="font-sans text-xs text-slate-400">คลิก หรือ ลากไฟล์มาวางที่นี่</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex justify-center overflow-hidden"
          >
            <div className="relative rounded-xl border-4 border-slate-100 shadow-inner overflow-hidden">
              <img src={preview} alt="Slip preview" className="max-h-48 object-contain bg-slate-900/5" />
              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                <Receipt size={12} /> SLIP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>กำลังตรวจสอบ...</span>
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            <span>ยืนยันการชำระเงิน</span>
          </>
        )}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </button>
    </form>
  );
}
