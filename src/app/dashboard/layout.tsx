import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <Sidebar userName={session.user?.name || "admin"} />

      {/* Main Content */}
      <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-8 lg:p-10 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
