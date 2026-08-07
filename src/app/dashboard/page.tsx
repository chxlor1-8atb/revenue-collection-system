import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";

export default async function DashboardPage() {
  return (
    <div>
      <h1 className="font-serif font-bold text-3xl mb-6 text-[#1F2E22]">ภาพรวม (Overview)</h1>
      
      <div className="receipt-card">
        <h2 className="font-serif font-bold mb-4">สถิติเบื้องต้น</h2>
        <div className="perforation-line"></div>
        <div className="py-8 text-center text-status-dark text-sm">
          (กราฟและสถิติรายได้จะแสดงที่นี่)
        </div>
      </div>
    </div>
  );
}
