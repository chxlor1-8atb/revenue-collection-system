import type { Metadata } from "next";
import "./globals.css";

import PwaRegister from "@/components/PwaRegister";
import { Viewport } from "next";

export const metadata: Metadata = {
  title: "เทศบาลเมืองนางรอง - จ่ายค่าขยะ",
  description: "ระบบจัดเก็บรายได้ออนไลน์ เทศบาลเมืองนางรอง",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "จ่ายค่าขยะ",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className="h-full antialiased font-sans bg-slate-50 text-slate-900"
    >
      <body className="min-h-full flex flex-col" style={{ paddingTop: 'env(titlebar-area-height, 0px)' }}>
        <div className="fixed top-0 left-0 right-0 h-[env(titlebar-area-height,0px)] z-50 titlebar-drag" />
        <PwaRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
