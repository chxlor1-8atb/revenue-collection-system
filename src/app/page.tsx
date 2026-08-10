"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Activity } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <main className="w-full max-w-md relative z-10 mt-8">
        {/* Header / Brand */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100">
             <img src="/nangrong-logo.png" alt="ตราสัญลักษณ์" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            เทศบาลเมืองนางรอง
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            ตรวจสอบและชำระค่าธรรมเนียมออนไลน์
          </p>
        </motion.div>

        {/* The "Modern Ticket" Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-slate-900">ค้นหาข้อมูลบ้าน</h2>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <Activity size={12} /> ระบบออนไลน์
                </span>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-3 overflow-hidden"
                    >
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-2 relative group">
                  <label htmlFor="houseNumber" className="block text-sm font-semibold text-slate-700 transition-colors group-focus-within:text-emerald-600">
                    บ้านเลขที่
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <input 
                      id="houseNumber"
                      type="text" 
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl font-mono text-lg focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                      placeholder="เช่น 123/4"
                      required
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSearching} 
                  className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-md shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Search size={20} />
                      </motion.div>
                      กำลังค้นหา...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      ตรวจสอบรายการ
                    </>
                  )}
                  {/* Subtle sweep animation on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </button>
              </form>
            </div>
            
            {/* Footer of the card */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                หากไม่พบข้อมูล กรุณาติดต่อกองคลัง เทศบาลเมืองนางรอง
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="mt-12 relative z-10">
        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors decoration-slate-300 underline-offset-4 hover:underline">
          สำหรับเจ้าหน้าที่ (เข้าสู่ระบบ)
        </Link>
      </footer>
    </div>
  );
}
