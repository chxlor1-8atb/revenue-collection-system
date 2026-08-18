"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SlipUploader({ transactionId }: { transactionId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/transactions/${transactionId}/verify`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการตรวจสอบสลิป");
        setIsUploading(false);
        return;
      }
      
      // Success! Redirect to success page
      router.push(`/pay/${transactionId}/success`);
      router.refresh();
      
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <div className="w-full border-t border-slate-100 my-4"></div>
      
      <p className="font-sans text-xs text-slate-500 uppercase tracking-widest mb-3">หรืออัปโหลดสลิปที่นี่</p>
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      
      {!file ? (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold py-3 px-6 rounded-xl border border-slate-300 border-dashed transition-all"
        >
          <Upload size={18} />
          <span>เลือกรูปสลิปเพื่ออัปโหลด</span>
        </button>
      ) : (
        <div className="w-full">
          <div className="relative w-full h-40 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-3 flex items-center justify-center">
            {previewUrl && (
              <img src={previewUrl} alt="Slip Preview" className="h-full object-contain" />
            )}
            <button 
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setError(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <button 
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold py-3 px-6 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>กำลังตรวจสอบสลิป...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>ยืนยันการชำระเงิน</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
