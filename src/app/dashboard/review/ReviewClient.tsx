"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import SlipReviewForm from "./SlipReviewForm";
import { FileSignature, Loader2, QrCode, CheckCircle2, Clock, Sparkles, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReviewClient() {
  const [activeTab, setActiveTab] = useState<"pending" | "waiting">("pending");

  // Poll every 3 seconds
  const { data, error, isLoading, mutate, isValidating } = useSWR('/api/transactions/review', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const pending = data?.pending || [];
  const waiting = data?.waiting || [];

  return (
    <div className="font-sans space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B58F2] to-[#7E7BFF] flex items-center justify-center text-white shadow-md shadow-[#5B58F2]/25 shrink-0">
            <FileSignature size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">รายการตรวจสอบสลิป</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                เชื่อมต่อระบบสด (Live Sync)
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">ตรวจสอบและยืนยันยอดเงินที่ผู้ใช้งานโอนผ่าน QR Code</p>
          </div>
        </div>

        {/* Manual Refresh & Quick Counter */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            aria-label="รีเฟรชข้อมูล"
            className="h-10 px-3.5 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            title="รีเฟรชข้อมูลทันที"
          >
            <RefreshCw size={14} className={isValidating ? "animate-spin text-[#5B58F2]" : "text-slate-500"} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl w-fit border border-slate-200/60">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pending"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSignature size={15} className={activeTab === "pending" ? "text-[#5B58F2]" : "text-slate-400"} />
          <span>รอตรวจสอบสลิป</span>
          {pending.length > 0 ? (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {pending.length}
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("waiting")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "waiting"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <QrCode size={15} className={activeTab === "waiting" ? "text-amber-600" : "text-slate-400"} />
          <span>กำลังทำรายการ</span>
          {waiting.length > 0 ? (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {waiting.length}
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
              0
            </span>
          )}
        </button>
      </div>
      
      {/* 1. กำลังทำรายการ (Waiting for Slip / Scanning) */}
      {activeTab === "waiting" && (
        <div className="space-y-4">
          <div className="bg-amber-50/90 rounded-2xl border border-amber-200/80 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <QrCode size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950">ผู้ใช้งานกำลังสแกนจ่าย QR Code ({waiting.length} รายการ)</h2>
                <p className="text-xs text-amber-700 mt-0.5">ระบบจะตรวจจับและอัปเดตสลิปเข้ามาในระบบอัตโนมัติทันทีที่แนบ</p>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : waiting.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 border border-amber-100 text-amber-500">
                <QrCode size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">ไม่มีผู้ใช้งานกำลังสแกนจ่ายในขณะนี้</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                เมื่อมีผู้ใช้เปิดหน้า QR Code ชำระเงิน รายการจะปรากฏที่นี่แบบเรียลไทม์
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waiting.map((tx: any, index: number) => {
                const houses = [...new Set(tx.invoices?.map((i: any) => i.houseNumber))];
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-5 border border-amber-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

                    <div>
                      <div className="flex items-center justify-between mb-3 pt-1">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          #{tx.id}
                        </span>
                        <span className="font-mono font-bold text-lg text-amber-600">
                          ฿{parseFloat(tx.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <div className="text-xs text-slate-400 font-medium">บ้านเลขที่</div>
                        <div className="font-bold text-slate-800 text-sm">
                          {houses.length > 0 ? houses.join(", ") : "ไม่ระบุ"}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 bg-amber-50/60 -mx-5 -mb-5 p-3 px-5 rounded-b-2xl">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Loader2 size={13} className="animate-spin text-amber-500" />
                        กำลังรอแนบสลิป
                      </span>
                      <span className="text-[11px] text-amber-600/80">
                        {new Date(tx.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. รอดำเนินการ (Pending Review) */}
      {activeTab === "pending" && (
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4 bg-slate-200 rounded-2xl h-72"></div>
                  <div className="lg:col-span-8 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-24 bg-slate-200 rounded w-full"></div>
                    <div className="h-12 bg-slate-200 rounded w-full mt-6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 text-center py-16 px-6 flex flex-col items-center justify-center shadow-xs">
              <div className="w-18 h-18 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">ไม่มีรายการสลิปค้างตรวจสอบ</h2>
              <p className="text-slate-500 text-xs max-w-sm">
                ยอดเยี่ยมมาก! คุณได้ตรวจสอบสลิปการโอนเงินที่แจ้งเข้ามาครบถ้วนหมดแล้ว
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pending.map((tx: any, index: number) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.08 }}
                >
                  <SlipReviewForm 
                    transaction={tx} 
                    onReviewed={() => mutate()} 
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
