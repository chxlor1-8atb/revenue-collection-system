"use client";

import { useState } from "react";
import { saveAdminUser } from "./actions";
import { X, Loader2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export interface AdminUserData {
  id?: number;
  username: string;
  role: string;
}

export default function UserForm({ 
  initialData, 
  onClose 
}: { 
  initialData?: AdminUserData;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(initialData?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialData?.role || "staff");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await saveAdminUser({
        id: initialData?.id,
        username,
        password: password || undefined,
        role
      });
      
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setErrorMsg(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans border border-slate-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            {initialData ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              placeholder="ตั้งชื่อผู้ใช้งาน"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              รหัสผ่าน (Password)
              {initialData && <span className="text-slate-400 font-normal ml-2">(ปล่อยว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
            </label>
            <input
              type="password"
              required={!initialData}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              placeholder="ตั้งรหัสผ่าน"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">สิทธิ์การใช้งาน (Role)</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`
                border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all
                ${role === 'staff' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 text-slate-600'}
              `}>
                <input type="radio" name="role" value="staff" checked={role === 'staff'} onChange={() => setRole('staff')} className="sr-only" />
                <span className="font-bold text-sm">Staff</span>
                <span className="text-[length:10px] text-center opacity-80">พนักงานทั่วไป / ตรวจสลิป</span>
              </label>
              
              <label className={`
                border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all
                ${role === 'admin' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-slate-200 hover:border-purple-300 text-slate-600'}
              `}>
                <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} className="sr-only" />
                <span className="font-bold text-sm">Admin</span>
                <span className="text-[length:10px] text-center opacity-80">ผู้ดูแลระบบ / จัดการตั้งค่า</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 font-medium flex items-start gap-2">
              <X size={16} className="mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#1F2E22] hover:bg-[#2d4332] text-white rounded-xl font-bold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</>
              ) : (
                "บันทึกข้อมูล"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
