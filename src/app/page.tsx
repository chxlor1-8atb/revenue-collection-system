"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedButton from "@/components/AnimatedButton";

export default function Home() {
  const [houseNumber, setHouseNumber] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching || !houseNumber.trim()) return;
    
    setIsSearching(true);
    setError("");
    
    try {
      const res = await fetch("/api/houses/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseNumber: houseNumber.trim() })
      });

      if (!res.ok) {
        setError("ไม่พบข้อมูลบ้านเลขที่นี้ กรุณาตรวจสอบอีกครั้ง");
        setIsSearching(false);
        return;
      }

      const data = await res.json();
      router.push(`/house/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      setIsSearching(false);
    }
  };

  return (
    <div className="layout-center flex-col">
      <div className="receipt-card max-w-sm w-full">
        {/* Decorative slip corner */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-[#F6F4EC] border-l border-b border-[#D8D3C3] -mt-1 -mr-1 transform rotate-45"></div>

        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-bold mb-1">ตรวจสอบยอดชำระ</h1>
          <p className="font-sans text-sm text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        
        <div className="perforation-line"></div>
        
        <form onSubmit={handleSearch} className="form-container mt-6">
          <p className="text-sm text-center mb-2">กรุณากรอกบ้านเลขที่เพื่อดูยอดค้างชำระค่าขยะ</p>
          
          {error && (
            <div className="error-box text-center">
              {error}
            </div>
          )}
          
          <div className="form-group text-center">
            <label className="font-serif block font-bold mb-2">บ้านเลขที่</label>
            <input 
              type="text" 
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="ledger-input font-mono text-center text-lg tracking-widest"
              placeholder="เช่น 123/4"
              required
            />
          </div>
          
          <AnimatedButton type="submit" disabled={isSearching} className="btn btn-primary w-full mt-4 font-serif">
            {isSearching ? "กำลังตรวจสอบ..." : "ตรวจสอบรายการ"}
          </AnimatedButton>
        </form>
      </div>

      <a href="/login" className="mt-8 text-sm text-gray-500 underline font-sans">
        สำหรับเจ้าหน้าที่ (เข้าสู่ระบบ)
      </a>
    </div>
  );
}
