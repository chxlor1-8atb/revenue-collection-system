"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedButton from "@/components/AnimatedButton";
import { motion } from "framer-motion";

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
    <div className="pwa-container">
      <main className="pwa-main">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-12 md:items-center">
          
          {/* Left Column: Hero / Welcome */}
          <motion.div 
            className="welcome-banner text-center md:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="inline-block p-3 bg-white border border-[#D8D3C3] rounded-sm shadow-sm mb-6 mx-auto md:mx-0" style={{ width: "fit-content" }}>
              <span style={{ fontSize: "2.5rem" }}>🏛️</span>
            </div>
            <h1 className="font-serif font-bold text-fluid-hero text-[#1F2E22] mb-4">
              เทศบาลเมืองนางรอง
            </h1>
            <p className="font-sans text-fluid-sub text-[#3A5A40] mb-2 font-semibold">
              ระบบตรวจสอบและชำระค่าธรรมเนียมเก็บขนมูลฝอย
            </p>
            <p className="font-sans text-gray-500 mb-8 max-w-md mx-auto md:mx-0">
              เพื่อความสะดวก รวดเร็ว และโปร่งใส ท่านสามารถตรวจสอบยอดค้างชำระและสแกนจ่ายผ่าน QR Code ได้ทันที
            </p>
          </motion.div>

          {/* Right Column: Search Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="flex justify-center md:justify-end"
          >
            <div className="receipt-card max-w-sm w-full">
              {/* Decorative slip corner */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#F6F4EC] border-l border-b border-[#D8D3C3] -mt-1 -mr-1 transform rotate-45"></div>

              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl font-bold mb-1">ตรวจสอบยอดชำระ</h2>
                <p className="font-sans text-sm text-status-dark">กรอกบ้านเลขที่ของท่าน</p>
              </div>
              
              <div className="perforation-line"></div>
              
              <form onSubmit={handleSearch} className="form-container mt-6">
                {error && (
                  <div className="error-box text-center">
                    {error}
                  </div>
                )}
                
                <div className="form-group text-center">
                  <label className="font-serif block font-bold mb-2 text-[#3A5A40]">บ้านเลขที่</label>
                  <input 
                    type="text" 
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="ledger-input font-mono text-center text-xl tracking-widest py-3"
                    placeholder="เช่น 123/4"
                    required
                  />
                </div>
                
                <AnimatedButton type="submit" disabled={isSearching} className="btn btn-primary w-full mt-6 py-3 font-serif text-lg shadow-sm">
                  {isSearching ? "กำลังตรวจสอบ..." : "ตรวจสอบรายการ"}
                </AnimatedButton>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="p-4 text-center">
        <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 underline font-sans transition-colors">
          สำหรับเจ้าหน้าที่ (เข้าสู่ระบบ)
        </a>
      </footer>
    </div>
  );
}
