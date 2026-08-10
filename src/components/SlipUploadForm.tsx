"use client";

import { useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import AnimatedButton from "./AnimatedButton";

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
      setStatus("idle");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
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
      <div className="p-6 text-center mt-6 border border-emerald-200 bg-emerald-50/50 rounded-xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="font-sans font-bold text-lg text-slate-800">ส่งหลักฐานการโอนเงินสำเร็จ</h3>
        <p className="font-sans text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
          ระบบจัดเก็บรายได้ได้รับสลิปของท่านแล้ว เจ้าหน้าที่ของเทศบาลเมืองนางรองจะดำเนินการตรวจสอบความถูกต้องในลำดับถัดไป
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 font-sans">
      <div className="perforation-line"></div>
      
      <div className="mb-5">
        <label className="font-sans block mb-2 text-xs font-semibold text-slate-600">
          แนบสลิปชำระเงิน (สลิปการโอนเงิน)
        </label>
        
        {!preview ? (
          <div className="relative border border-slate-200 hover:border-teal-500 rounded-lg p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-all duration-150 cursor-pointer group">
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-teal-600 mx-auto mb-2 transition-colors" />
            <p className="font-sans text-xs font-semibold text-slate-700">
              กดเลือกไฟล์สลิป หรือลากไฟล์ภาพมาที่นี่
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              รองรับไฟล์ JPG, PNG, WEBP
            </p>
          </div>
        ) : (
          <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2 flex flex-col items-center">
            <button 
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition-colors z-10"
              title="ลบไฟล์สลิป"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <img 
              src={preview} 
              alt="Slip preview" 
              className="max-h-60 w-auto rounded border border-slate-200 object-contain shadow-sm" 
            />
            <div className="w-full flex items-center justify-between mt-2.5 text-[10px] text-slate-500 px-1 font-mono">
              <span className="truncate max-w-[180px]">{file?.name}</span>
              <span>{(file ? file.size / 1024 / 1024 : 0).toFixed(2)} MB</span>
            </div>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="error-box flex items-start gap-2 mb-4">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
          <span>เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน กรุณาลองใหม่อีกครั้ง</span>
        </div>
      )}

      <AnimatedButton
        type="submit"
        disabled={!file || isUploading}
        className="btn btn-primary w-full py-3.5 text-xs font-semibold disabled:opacity-40"
      >
        {isUploading ? (
          <span className="flex items-center gap-1.5 justify-center">
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
            กำลังส่งข้อมูล...
          </span>
        ) : (
          "ส่งหลักฐานสลิปการชำระเงิน"
        )}
      </AnimatedButton>
    </form>
  );
}
