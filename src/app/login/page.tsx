"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="layout-center">
      <div className="receipt-card max-w-sm">
        <div className="text-center mb-6 flex flex-col items-center">
          <img src="/nangrong-logo.png" alt="ตราสัญลักษณ์เทศบาลเมืองนางรอง" style={{ width: "4rem", height: "4rem", objectFit: "contain", marginBottom: "0.5rem" }} />
          <h1 className="font-serif text-2xl font-bold">ระบบจัดเก็บรายได้</h1>
          <p className="font-sans text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        
        <div className="perforation-line"></div>
        
        <form onSubmit={handleSubmit} className="form-container mt-6">
          {error && (
            <div className="error-box text-center">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="font-serif block font-bold mb-1">รหัสผู้ใช้งาน</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="ledger-input font-mono"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="font-serif block font-bold mb-1">รหัสผ่าน</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ledger-input font-mono"
              required
            />
          </div>
          
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-4 font-serif">
            {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
