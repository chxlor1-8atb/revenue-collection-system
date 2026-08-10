"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedButton from "@/components/AnimatedButton";
import { motion } from "framer-motion";
import { Recycle, Search, AlertCircle, ArrowRight } from "lucide-react";

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
    <div className="pwa-container relative overflow-hidden flex flex-col justify-between min-h-screen bg-slate-50">
      {/* Background Watermark/Decoration */}
      <Recycle className="waste-watermark text-teal-600/5" strokeWidth={0.5} />

      {/* Subtle top header band */}
      <div className="w-full bg-slate-900 text-slate-300 text-[10px] md:text-xs font-mono py-2.5 px-4 text-center tracking-widest z-10 font-medium">
        ระบบบริการประชาชนอิเล็กทรอนิกส์ • เทศบาลเมืองนางรอง
      </div>

      <main className="pwa-main relative z-10 flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Hero / Welcome */}
          <motion.div 
            className="welcome-banner text-center md:text-left md:col-span-7 flex flex-col justify-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 mx-auto md:mx-0">
              <img 
                src="/nangrong-logo.png" 
                alt="ตราสัญลักษณ์เทศบาลเมืองนางรอง" 
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <h1 className="font-serif font-bold text-fluid-hero text-slate-900 mb-3 tracking-tight leading-tight">
              เทศบาลเมืองนางรอง
            </h1>
            <p className="font-sans text-fluid-sub mb-3 font-semibold text-teal-700">
              ระบบตรวจสอบและชำระค่าธรรมเนียมเก็บขนมูลฝอย
            </p>
            <p className="font-sans text-slate-500 text-xs md:text-sm max-w-md mx-auto md:mx-0 leading-relaxed">
              สืบค้น ค้นหาบิลค่าบริการขนขยะมูลฝอยประจำเดือนของบ้านเลขที่ท่าน 
              ตรวจสอบยอดชำระค้างส่ง พร้อมสแกนจ่ายเงินผ่าน QR Code ได้สะดวก รวดเร็ว และแม่นยำ
            </p>
          </motion.div>

          {/* Right Column: Search Card */}
          <motion.div
            className="md:col-span-5 flex justify-center md:justify-end w-full"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="ledger-card-home w-full max-w-sm border border-slate-200 bg-white shadow-md p-6 rounded-xl">
              <div className="text-center md:text-left mb-6">
                <h2 className="font-sans text-lg font-bold text-slate-800 mb-1">สืบค้นข้อมูลยอดชำระ</h2>
                <p className="font-sans text-xs text-slate-400">ระบุเลขที่บ้านของท่านเพื่อดำเนินงาน</p>
              </div>
              
              <form onSubmit={handleSearch} className="form-container">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="error-box flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                
                <div className="form-group relative">
                  <label className="font-sans text-xs font-semibold text-slate-600 mb-2">บ้านเลขที่</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="ledger-input font-mono text-center text-lg py-2.5 pr-4 pl-9 border-slate-200 focus:border-teal-500 rounded-lg text-slate-800"
                      placeholder="เช่น 123/4"
                      required
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">ตัวอย่าง: 12/3, 45, 102/5</p>
                </div>
                
                <AnimatedButton 
                  type="submit" 
                  disabled={isSearching} 
                  className="btn btn-primary w-full py-2.5 text-sm font-semibold mt-2"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังดำเนินการ...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 justify-center">
                      ค้นหาบิลค่าบริการ
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </AnimatedButton>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="w-full text-center py-5 border-t border-slate-200 bg-white/60 backdrop-blur-sm z-10">
        <a href="/login" className="text-xs text-slate-400 hover:text-teal-600 underline font-sans transition-colors">
          ระบบสารสนเทศผู้บริหารและพนักงานจัดเก็บรายได้
        </a>
      </footer>
    </div>
  );
}
