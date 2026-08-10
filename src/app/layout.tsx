import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  themeColor: "#f8fafc",
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
