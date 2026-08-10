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
  LogOut,
  FolderOpen
} from "lucide-react";

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "หน้าแรก (Overview)", href: "/dashboard", icon: <BarChart4 size={18} strokeWidth={1.5} /> },
    { name: "ตรวจสลิปโอนเงิน", href: "/dashboard/review", icon: <CheckSquare size={18} strokeWidth={1.5} /> },
    { name: "ประวัติการรับชำระเงิน", href: "/dashboard/history", icon: <History size={18} strokeWidth={1.5} /> },
    { name: "จัดการข้อมูลบ้าน", href: "/dashboard/houses", icon: <Home size={18} strokeWidth={1.5} /> },
    { name: "จัดการพนักงาน", href: "/dashboard/collectors", icon: <Users size={18} strokeWidth={1.5} /> },
    { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.5} /> },
  ];

  return (
    <aside style={{ width: "260px", backgroundColor: "#0f172a", color: "#f8fafc", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column" }} className="font-sans">
      <div style={{ padding: "1.75rem 1.5rem", borderBottom: "1px solid #1e293b", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
        
        {/* Clean Admin badge */}
        <div style={{ position: "absolute", top: "12px", left: "12px", fontSize: "0.6rem", fontWeight: 700, fontFamily: "var(--font-mono)", border: "1px solid #0d9488", color: "#14b8a6", padding: "1px 5px", borderRadius: "4px", background: "rgba(13, 148, 136, 0.1)" }}>
          ADMIN
        </div>

        <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" style={{ width: "3.2rem", height: "3.2rem", objectFit: "contain", marginBottom: "0.75rem" }} />
        <h2 className="font-serif font-bold text-base" style={{ letterSpacing: "0.02em", color: "white" }}>สมุดบัญชีรายได้</h2>
        <p className="font-sans text-[10px]" style={{ color: "#94a3b8" }}>เทศบาลเมืองนางรอง</p>
      </div>
      
      <nav style={{ flex: 1, padding: "1.5rem 0.75rem" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  style={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 0.875rem", 
                    borderRadius: "6px",
                    backgroundColor: isActive ? "rgba(13, 148, 136, 0.15)" : "transparent",
                    color: isActive ? "#2dd4bf" : "#94a3b8",
                    transition: "all 0.15s"
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <span style={{ display: "flex", alignItems: "center", color: isActive ? "#2dd4bf" : "#64748b" }}>{item.icon}</span>
                  <span className={`font-sans text-xs ${isActive ? "font-semibold" : "font-normal"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #1e293b", background: "rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#f8fafc" }}>
          <User size={13} className="text-teal-400" />
          <p className="font-mono text-[10px] font-semibold" style={{ wordBreak: 'break-all' }}>{userName}</p>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="bg-transparent border-none cursor-pointer p-0 font-sans flex items-center gap-1"
          style={{ color: "#f87171", fontSize: "0.75rem", opacity: 0.9 }}
        >
          <LogOut size={12} />
          <span className="underline hover:text-red-400 transition-colors">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
