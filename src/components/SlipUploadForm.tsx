"use client";

import { useState } from "react";
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
      <div className="receipt-card animate-stamp text-center mt-6">
        <div className="receipt-stamp-ref">VERIFIED</div>
        <h3 className="font-serif text-xl mb-2 text-status-verified">ส่งข้อมูลสำเร็จ</h3>
        <p className="font-sans text-sm text-status-dark">
          ระบบได้รับสลิปของคุณแล้ว ขอบคุณครับ
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="perforation-line"></div>
      
      <div className="mb-4">
        <label className="font-serif block mb-2 text-sm font-bold">แนบสลิปการโอนเงิน</label>
        <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded bg-gray-50 hover:bg-gray-100 transition-colors">
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-[#3A5A40] file:text-white
              hover:file:bg-[#2d4732] cursor-pointer"
            required
          />
        </div>
      </div>

      {preview && (
        <div className="mb-6 flex justify-center">
          <img src={preview} alt="Slip preview" className="max-h-64 rounded shadow-sm border border-[#D8D3C3]" />
        </div>
      )}

      <AnimatedButton
        type="submit"
        disabled={!file || isUploading}
        className="btn btn-primary w-full py-3 text-lg font-serif tracking-wide disabled:opacity-50"
      >
        {isUploading ? "กำลังประมวลผล..." : "ส่งสลิปเพื่อตรวจสอบ"}
      </AnimatedButton>
    </form>
  );
}
