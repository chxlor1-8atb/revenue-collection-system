import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-1">สมุดบัญชีรายได้</h1>
          <p className="font-sans text-status-dark">เทศบาลเมืองนางรอง</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm mb-2">User: {session.user?.name}</p>
          <form action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/login" });
          }}>
            <button className="text-status-pending underline text-sm hover:text-red-700">ออกจากระบบ</button>
          </form>
        </div>
      </div>
      
      <div className="receipt-card">
        <h2 className="font-serif font-bold mb-4">รายการรอดำเนินการ</h2>
        <div className="perforation-line"></div>
        <div className="py-8 text-center text-status-dark text-sm">
          (ระบบจะแสดงรายการสร้าง QR และประวัติการจ่ายเงินที่นี่ใน Phase ถัดไป)
        </div>
      </div>
    </div>
  );
}
