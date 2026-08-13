"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Truck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [houseNumber, setHouseNumber] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching || !houseNumber.trim()) return;
    
    setIsSearching(true);
    setError("");
    setResults([]);
    
    try {
      const res = await fetch(`/api/houses/lookup?q=${encodeURIComponent(houseNumber.trim())}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        setError("ไม่พบข้อมูล กรุณาตรวจสอบอีกครั้ง");
        setIsSearching(false);
        return;
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        if (data.length === 1) {
          router.push(`/house/${data[0].id}`);
        } else {
          setResults(data);
          setIsSearching(false);
        }
      } else {
        router.push(`/house/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center py-4 px-4 sm:px-6 lg:px-8">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <main className="w-full max-w-md relative z-10 mt-4">
        {/* Header / Brand */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm mb-3 border border-slate-100">
             <img src="/nangrong-logo.png" alt="ตราสัญลักษณ์" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
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
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">ค้นหาข้อมูลบ้าน</h2>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <Truck size={14} /> ค่าธรรมเนียมขยะ
                </span>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-4">
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
                    บ้านเลขที่ หรือ ชื่อเจ้าบ้าน
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Trash2 size={20} />
                    </div>
                    <input 
                      id="houseNumber"
                      type="text" 
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl font-mono text-lg focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                      placeholder="เช่น 123/4 หรือ สมชาย"
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

              {/* Display Results */}
              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">พบ {results.length} รายการ กรุณาเลือก:</h3>
                    {results.map((house) => (
                      <Link 
                        href={`/house/${house.id}`} 
                        key={house.id}
                        className="block w-full p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900 font-mono text-lg">{house.houseNumber}</p>
                            <p className="text-sm text-slate-500 font-sans">{house.ownerName}</p>
                          </div>
                          {house.zone && (
                            <span className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-100">
                              {house.zone}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer of the card */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                หากไม่พบข้อมูล กรุณาติดต่อกองสาธารณสุข เทศบาลเมืองนางรอง
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="mt-8 relative z-10">
        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors decoration-slate-300 underline-offset-4 hover:underline">
          สำหรับเจ้าหน้าที่ (เข้าสู่ระบบ)
        </Link>
      </footer>
    </div>
  );
}
