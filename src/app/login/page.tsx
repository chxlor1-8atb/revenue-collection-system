"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="receipt-card max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl mb-1">ระบบจัดเก็บรายได้</h1>
          <p className="font-sans text-sm text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        
        <div className="perforation-line"></div>
        
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="bg-status-pending/20 text-status-pending text-sm p-3 border border-status-pending text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="font-serif block text-sm font-bold mb-1">รหัสผู้ใช้งาน</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b-2 border-dashed border-[#D8D3C3] bg-transparent py-2 px-1 focus:outline-none focus:border-[#3A5A40] font-mono"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="font-serif block text-sm font-bold mb-1">รหัสผ่าน</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-dashed border-[#D8D3C3] bg-transparent py-2 px-1 focus:outline-none focus:border-[#3A5A40] font-mono"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full py-3 font-serif tracking-widest">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
