import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import PwaRegister from "@/components/PwaRegister";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "เทศบาลเมืองนางรอง - จ่ายค่าขยะ",
  description: "ระบบจัดเก็บรายได้ออนไลน์ เทศบาลเมืองนางรอง",
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "จ่ายค่าขยะ",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`h-full antialiased ${ibmPlexSansThai.variable} ${ibmPlexMono.variable} bg-slate-50 text-slate-900`}
    >
      <body className="min-h-full flex flex-col font-sans" style={{ paddingTop: 'env(titlebar-area-height, 0px)' }}>
        <div className="fixed top-0 left-0 right-0 h-[env(titlebar-area-height,0px)] z-50 titlebar-drag" />
        <PwaRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
