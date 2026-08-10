import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex w-full" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <Sidebar userName={session.user?.name || "admin"} />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2.5rem 2rem", overflowY: "auto", position: "relative", zIndex: 10 }}>
        {children}
      </main>
    </div>
  );
}
