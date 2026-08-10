"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Lock, AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import AnimatedButton from "@/components/AnimatedButton";

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
    <div className="layout-center flex-col relative overflow-hidden bg-slate-50">
      <motion.div 
        className="receipt-card max-w-sm w-full relative border border-slate-200 bg-white shadow-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-5 flex flex-col items-center">
          <img 
            src="/nangrong-logo.png" 
            alt="ตราสัญลักษณ์เทศบาลเมืองนางรอง" 
            className="w-16 h-16 object-contain mb-2" 
          />
          <h1 className="font-serif text-xl font-bold text-slate-800">เข้าสู่ระบบเจ้าหน้าที่</h1>
          <p className="font-sans text-[10px] text-teal-600 font-semibold tracking-wide uppercase mt-0.5">
            เทศบาลเมืองนางรอง
          </p>
        </div>
        
        <div className="perforation-line"></div>
        
        <form onSubmit={handleSubmit} className="form-container mt-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-box flex items-start gap-2"
            >
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          
          <div className="form-group">
            <label className="font-sans text-xs font-semibold text-slate-600 mb-2">รหัสผู้ใช้งาน</label>
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ledger-input font-mono pl-9 border-slate-200 text-slate-800"
                placeholder="Username"
                required
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          
          <div className="form-group">
            <label className="font-sans text-xs font-semibold text-slate-600 mb-2">รหัสผ่าน</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ledger-input font-mono pl-9 border-slate-200 text-slate-800"
                placeholder="Password"
                required
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          
          <AnimatedButton 
            type="submit" 
            disabled={isSubmitting} 
            className="btn btn-primary w-full mt-2 py-2.5 text-sm font-semibold"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5 justify-center">
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                <ShieldAlert className="w-4 h-4" />
                เข้าสู่ระบบ
              </span>
            )}
          </AnimatedButton>
        </form>
      </motion.div>

      <a href="/" className="mt-6 text-xs text-slate-500 hover:text-teal-600 transition-colors underline font-sans flex items-center gap-1 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับสู่หน้าหลักระบบประชาชน
      </a>
    </div>
  );
}
