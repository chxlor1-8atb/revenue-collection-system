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
  themeColor: "#0F172A",
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className="h-full antialiased font-sans bg-slate-50 text-slate-900"
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
