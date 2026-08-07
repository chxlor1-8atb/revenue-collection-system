"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "หน้าแรก (Overview)", href: "/dashboard", icon: "📊" },
    { name: "ตรวจสลิปโอนเงิน", href: "/dashboard/review", icon: "✅" },
    { name: "ประวัติการรับชำระเงิน", href: "/dashboard/history", icon: "💰" },
    { name: "จัดการข้อมูลบ้าน", href: "/dashboard/houses", icon: "🏠" },
    { name: "จัดการพนักงาน", href: "/dashboard/collectors", icon: "🧑‍💼" },
    { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <aside style={{ width: "250px", backgroundColor: "#fff", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" style={{ width: "3rem", height: "3rem", objectFit: "contain", marginBottom: "0.5rem" }} />
        <h2 className="font-serif font-bold text-lg">สมุดบัญชีรายได้</h2>
        <p className="font-sans text-xs text-status-dark">เทศบาลเมืองนางรอง</p>
      </div>
      
      <nav style={{ flex: 1, padding: "1rem 0" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
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
                    borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                    backgroundColor: isActive ? "#f9f9f9" : "transparent"
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  <span className={`font-sans ${isActive ? "font-semibold text-status-verified" : "text-gray-700"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <p className="font-mono text-sm mb-2" style={{ wordBreak: 'break-all' }}>👤 {userName}</p>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-status-pending underline text-sm hover:text-red-700 bg-transparent border-none cursor-pointer p-0 font-sans"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
