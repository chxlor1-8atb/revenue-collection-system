import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex" style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", backgroundColor: "#fff", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-serif font-bold text-lg">สมุดบัญชีรายได้</h2>
          <p className="font-sans text-xs text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li>
              <Link href="/dashboard" style={{ display: "block", padding: "0.75rem 1.5rem", borderLeft: "3px solid transparent" }}>
                <span className="font-sans">หน้าแรก (Overview)</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/review" style={{ display: "block", padding: "0.75rem 1.5rem", borderLeft: "3px solid var(--primary)", backgroundColor: "#f9f9f9" }}>
                <span className="font-sans font-semibold text-status-verified">ตรวจสลิปโอนเงิน</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/houses" style={{ display: "block", padding: "0.75rem 1.5rem", borderLeft: "3px solid transparent" }}>
                <span className="font-sans">จัดการข้อมูลบ้าน</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)" }}>
          <p className="font-mono text-sm mb-2" style={{ wordBreak: 'break-all' }}>👤 {session.user?.name}</p>
          <form action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/login" });
          }}>
            <button className="text-status-pending underline text-sm hover:text-red-700 bg-transparent border-none cursor-pointer p-0 font-sans">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
