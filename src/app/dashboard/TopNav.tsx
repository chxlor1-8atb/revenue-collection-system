"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import SettingsForm from "./settings/SettingsForm";

export default function TopNav({ userName, settings }: { userName: string, settings?: any }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Close settings on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSettingsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const navItems = [
    { name: "ภาพรวม", href: "/dashboard" },
    { name: "จัดการบ้าน", href: "/dashboard/houses" },
    { name: "รายการตรวจสอบ", href: "/dashboard/review" },
    { name: "ประวัติชำระ", href: "/dashboard/history" },
    { name: "ผู้ใช้งาน", href: "/dashboard/users" },
    { name: "สลิป LINE", href: "/dashboard/line-slips" },
    { name: "คลังไฟล์", href: "/dashboard/blob" },
  ];

  return (
    <>
      <header className="border-b border-slate-100 bg-white rounded-t-[32px] px-6 md:px-8 lg:px-12 py-5 relative z-40">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center justify-center w-8 h-8 bg-[#5B58F2] rounded-full text-white font-bold text-lg shadow-sm">
              ฿
            </div>
            <span className="font-sans font-bold text-[#0F172A] tracking-tight text-xl mr-6">ระบบจัดเก็บรายได้</span>
          </div>

          <nav className="flex-1 overflow-x-auto w-full md:w-auto flex justify-start md:justify-center no-scrollbar pb-2 sm:pb-0">
            <ul className="flex items-center gap-2 px-1 py-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? "text-white bg-[#1A1A1A] shadow-md" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right User Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors relative">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-2 cursor-pointer ml-1 relative group" onClick={async () => {
              await signOut({ redirect: false });
              if (window.opener) {
                window.close();
              } else {
                window.location.href = '/';
              }
            }}>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 uppercase text-xs">
                {userName.substring(0,2)}
              </div>
              {/* Tooltip for logout */}
              <div className="absolute top-full right-0 mt-2 bg-[#0F172A] text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                ออกจากระบบ ({userName})
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
               <h2 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-2">
                 <Settings size={20} className="text-[#5B58F2]" /> ตั้งค่าระบบ
               </h2>
               <button 
                 onClick={() => setIsSettingsOpen(false)} 
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
               >
                 ✕
               </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <SettingsForm 
                  collectorId={settings?.id || 1} 
                  initialName={settings?.accountName || "ชื่อบัญชีรับเงิน"} 
                  initialPromptPay={settings?.promptPayId || "เบอร์พร้อมเพย์"}
                  initialQrCodeImageUrl={settings?.qrCodeImageUrl} 
                />
             </div>
          </div>
        </div>
      )}
    </>
  );
}
