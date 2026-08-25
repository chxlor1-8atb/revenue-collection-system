import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopNav from "./TopNav";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const [settings] = await db.select().from(systemSettings).limit(1);

  return (
    <div className="flex justify-center items-center h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAE9F5] to-[#F5F4FA] p-0 md:p-6 lg:p-10 relative print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      {/* Decorative background pills (approximate from video) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 print:hidden">
        <div className="absolute -top-20 -left-20 w-96 h-[600px] rounded-full bg-white/40 rotate-45 blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-[500px] h-[300px] rounded-full bg-indigo-200/20 rotate-12 blur-3xl"></div>
      </div>
      
      {/* App Frame (The White Card Container) */}
      <div className="w-full h-full max-w-[1600px] bg-white md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-none md:border border-slate-100/80 overflow-hidden flex flex-col relative z-10 print:w-full print:h-auto print:max-w-none print:border-none print:shadow-none print:rounded-none print:overflow-visible print:block">
        <div className="print:hidden"><TopNav userName={session.user?.name || "admin"} settings={settings} /></div>
        <main className="flex-1 w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-8 lg:p-12 custom-scrollbar print:p-0 print:bg-white print:overflow-visible print:h-auto print:block">
          <div className="max-w-[1400px] mx-auto w-full h-full relative print:max-w-none print:w-full print:h-auto print:block">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
