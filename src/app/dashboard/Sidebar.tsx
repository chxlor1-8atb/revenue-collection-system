"use client";

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
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "หน้าแรก (Overview)", href: "/dashboard", icon: <BarChart4 size={18} strokeWidth={1.5} /> },
    { name: "ตรวจสลิปโอนเงิน", href: "/dashboard/review", icon: <CheckSquare size={18} strokeWidth={1.5} /> },
    { name: "ประวัติการรับชำระเงิน", href: "/dashboard/history", icon: <History size={18} strokeWidth={1.5} /> },
    { name: "จัดการข้อมูลบ้าน", href: "/dashboard/houses", icon: <Home size={18} strokeWidth={1.5} /> },
    { name: "จัดการพนักงาน", href: "/dashboard/collectors", icon: <Users size={18} strokeWidth={1.5} /> },
    { name: "สลิปจาก LINE", href: "/dashboard/line-slips", icon: <CheckSquare size={18} strokeWidth={1.5} /> },
    { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.5} /> },
  ];

  return (
    <aside style={{ width: "250px", backgroundColor: "#1F2E22", color: "#F6F4EC", borderRight: "1px solid #2d4732", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem", borderBottom: "1px solid #2d4732", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
        

        <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" style={{ width: "3rem", height: "3rem", objectFit: "contain", marginBottom: "0.5rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        <h2 className="font-bold text-base" style={{ letterSpacing: "0.02em" }}>สมุดบัญชีรายได้</h2>
        <p className="font-sans text-[11px]" style={{ color: "#D8D3C3" }}>เทศบาลเมืองนางรอง</p>
      </div>
      
      <nav style={{ flex: 1, padding: "1rem 0" }}>
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
      
      <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid #2d4732" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#D8D3C3" }}>
          <User size={14} strokeWidth={1.5} />
          <p className="font-mono text-sm" style={{ wordBreak: 'break-all' }}>{userName}</p>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="bg-transparent border-none cursor-pointer p-0 font-sans flex items-center gap-2"
          style={{ color: "#C9A227", fontSize: "0.875rem", opacity: 0.9 }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span className="underline">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
