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
    <aside style={{ width: "250px", backgroundColor: "#1F2E22", color: "#F6F4EC", borderRight: "1px solid #2d4732", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #2d4732", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
        

        <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" style={{ width: "3.5rem", height: "3.5rem", objectFit: "contain", marginBottom: "0.75rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        <h2 className="font-serif font-bold text-lg" style={{ letterSpacing: "0.02em" }}>สมุดบัญชีรายได้</h2>
        <p className="font-sans text-xs" style={{ color: "#D8D3C3" }}>เทศบาลเมืองนางรอง</p>
      </div>
      
      <nav style={{ flex: 1, padding: "1.5rem 0" }}>
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
                    padding: "0.75rem 1.5rem", 
                    borderLeft: isActive ? "3px solid #C9A227" : "3px solid transparent",
                    backgroundColor: isActive ? "rgba(255,255,255,0.03)" : "transparent",
                    color: isActive ? "#F6F4EC" : "#A3B1A6",
                    transition: "all 0.2s"
                  }}
                  className="hover:bg-white/5 hover:text-[#F6F4EC]"
                >
                  <span style={{ display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                  <span className={`font-sans ${isActive ? "font-semibold" : "font-normal"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2d4732" }}>
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
