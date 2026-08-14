"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  BarChart4, 
  CheckSquare, 
  History, 
  Home, 
  Users, 
  Settings, 
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "หน้าแรก (Overview)", href: "/dashboard", icon: <BarChart4 size={18} strokeWidth={1.5} /> },
    { name: "ตรวจสลิปโอนเงิน", href: "/dashboard/review", icon: <CheckSquare size={18} strokeWidth={1.5} /> },
    { name: "ประวัติการรับชำระเงิน", href: "/dashboard/history", icon: <History size={18} strokeWidth={1.5} /> },
    { name: "จัดการข้อมูลบ้าน", href: "/dashboard/houses", icon: <Home size={18} strokeWidth={1.5} /> },
    { name: "จัดการผู้ใช้งาน (แอดมิน)", href: "/dashboard/users", icon: <Users size={18} strokeWidth={1.5} /> },
    { name: "สลิปจาก LINE", href: "/dashboard/line-slips", icon: <CheckSquare size={18} strokeWidth={1.5} /> },
    { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.5} /> },
  ];

  return (
    <>
      {/* Mobile Header / Hamburger Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1F2E22] flex items-center justify-between px-4 z-50 border-b border-[#2d4732]">
        <div className="flex items-center gap-3">
          <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-8 h-8 object-contain drop-shadow-md" />
          <h2 className="font-bold text-white tracking-tight">ระบบบัญชีรายได้</h2>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-white p-2 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed md:relative top-0 left-0 h-full w-64 bg-[#1F2E22] text-[#F6F4EC] 
          border-r border-[#2d4732] flex flex-col z-50 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-[#2d4732] flex flex-col items-center text-center relative md:pt-5 pt-16">
          <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-12 h-12 object-contain mb-2 drop-shadow-md" />
          <h2 className="font-bold text-base tracking-wide">สมุดบัญชีรายได้</h2>
          <p className="font-sans text-[11px] text-[#D8D3C3]">เทศบาลเมืองนางรอง</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-3 m-0 list-none">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.li 
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                className="relative"
              >
                <Link 
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  className={`
                    relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors z-10 overflow-hidden group
                    ${isActive ? "text-[#F6F4EC]" : "text-[#A3B1A6] hover:text-[#F6F4EC]"}
                  `}
                >
                  {/* Sliding Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-white/10 rounded-xl z-[-1]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  {/* Subtle Hover Background for non-active */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl z-[-1] transition-colors duration-300" />
                  )}

                  {/* Active Border Indicator (Left) */}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#C9A227] rounded-r-full shadow-[0_0_8px_rgba(201,162,39,0.5)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <motion.span 
                    className="flex items-center relative z-10"
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {item.icon}
                  </motion.span>
                  <span className={`font-sans relative z-10 ${isActive ? "font-bold tracking-wide" : "font-medium"}`}>
                    {item.name}
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
        </nav>
        
        <div className="p-3 border-t border-[#2d4732]">
          <div className="flex items-center gap-2 mb-2 text-[#D8D3C3]">
            <User size={14} strokeWidth={1.5} />
            <p className="font-mono text-sm break-all">{userName}</p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-transparent border-none cursor-pointer p-0 font-sans flex items-center gap-2 text-[#C9A227] text-sm opacity-90 hover:opacity-100 transition-opacity"
          >
            <LogOut size={14} strokeWidth={1.5} />
            <span className="underline">ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
