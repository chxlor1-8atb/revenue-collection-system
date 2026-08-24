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
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden font-sans border border-slate-100 animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#5B58F2] flex items-center justify-center shadow-2xs">
              <KeyRound size={18} />
            </div>
            {initialData ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ชื่อผู้ใช้ (Username)</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 transition-all text-slate-800"
              placeholder="ตั้งชื่อผู้ใช้งาน"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              รหัสผ่าน (Password)
              {initialData && <span className="text-slate-400 font-normal normal-case ml-2">(เว้นว่างหากไม่เปลี่ยน)</span>}
            </label>
            <input
              type="password"
              required={!initialData}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 transition-all text-slate-800"
              placeholder="ตั้งรหัสผ่าน"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">สิทธิ์การใช้งาน (Role)</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`
                border rounded-2xl p-3.5 flex flex-col items-center gap-1 cursor-pointer transition-all
                ${role === 'staff' ? 'border-[#5B58F2] bg-indigo-50/50 text-[#5B58F2] ring-2 ring-[#5B58F2]/20 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}
              `}>
                <input type="radio" name="role" value="staff" checked={role === 'staff'} onChange={() => setRole('staff')} className="sr-only" />
                <span className="text-sm">Staff</span>
                <span className="text-[10px] text-center opacity-80 font-normal">พนักงานทั่วไป / ตรวจสลิป</span>
              </label>
              
              <label className={`
                border rounded-2xl p-3.5 flex flex-col items-center gap-1 cursor-pointer transition-all
                ${role === 'admin' ? 'border-[#5B58F2] bg-indigo-50/50 text-[#5B58F2] ring-2 ring-[#5B58F2]/20 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}
              `}>
                <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} className="sr-only" />
                <span className="text-sm">Admin</span>
                <span className="text-[10px] text-center opacity-80 font-normal">ผู้ดูแลระบบ / ตั้งค่าระบบ</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 font-medium flex items-start gap-2">
              <X size={15} className="mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#5B58F2]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
