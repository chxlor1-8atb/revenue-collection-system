"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");
    
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      setIsSubmitting(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center py-4 px-4 sm:px-6 lg:px-8">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          กลับสู่ระบบประชาชน
        </Link>

        {/* Secure Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <ShieldCheck size={200} />
            </div>

            <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-lg mb-4 relative z-10">
               <img src="/nangrong-logo.png" alt="ตราสัญลักษณ์เทศบาล" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-sans font-bold text-white tracking-tight relative z-10">
              ระบบสารสนเทศภายใน
            </h1>
            <p className="text-xs font-sans text-slate-400 mt-1 font-medium tracking-wide uppercase relative z-10">
              Staff Authentication Gateway
            </p>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl border border-red-100 text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-1.5 group">
                <label className="block text-[length:10px] font-sans font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-emerald-600 transition-colors">
                  รหัสเจ้าหน้าที่ (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl font-sans text-sm focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                    placeholder="ระบุรหัสผู้ใช้งาน"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5 group">
                <label className="block text-[length:10px] font-sans font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-emerald-600 transition-colors">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl font-sans text-sm focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full mt-4 relative overflow-hidden group font-sans bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
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
                    <span>เข้าสู่ระบบจัดการข้อมูล</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 py-3 px-4 text-center">
            <p className="text-xs font-sans text-slate-400 font-medium">
              ระบบนี้จำกัดสิทธิ์เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
