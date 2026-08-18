"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import SlipReviewForm from "./SlipReviewForm";
import { FileSignature, Loader2, QrCode } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReviewClient() {
  const [activeTab, setActiveTab] = useState<"pending" | "waiting">("pending");

  // Poll every 3 seconds
  const { data, error, isLoading, mutate } = useSWR('/api/transactions/review', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const pending = data?.pending || [];
  const waiting = data?.waiting || [];

  // If there are waiting transactions but no pending, user might want to see them.
  // We don't force switch to avoid annoying the user if they are reviewing something.

  return (
    <div className="pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-bold text-3xl text-[#1F2E22]">ตรวจสลิปโอนเงิน</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pending" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <FileSignature size={14} />
          รอตรวจสอบสลิป
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("waiting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "waiting" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <QrCode size={14} />
          กำลังทำรายการ
          {waiting.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{waiting.length}</span>
          )}
        </button>
      </div>
      
      {/* 1. กำลังทำรายการ (Waiting for Slip) */}
      {activeTab === "waiting" && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6 bg-white/60 p-4 rounded-xl border border-amber-200/60 shadow-sm backdrop-blur-sm">
            <div className="relative p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl border border-amber-300 shadow-inner">
              <QrCode className="text-amber-700" size={26} />
              <div className="absolute -top-1 -right-1">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-amber-200"></span>
                 </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-amber-950">กำลังทำรายการชำระเงิน</h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">{waiting.length} รายการ</span>
              </div>
              <p className="text-sm text-amber-700 mt-0.5 font-medium">ผู้ใช้งานกำลังสแกนจ่ายคิวอาร์โค้ด รอระบบอัปเดตสลิปอัตโนมัติ</p>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-slate-200 rounded w-2/3 mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/4 ml-auto"></div>
                </div>
              ))}
            </div>
          ) : waiting.length === 0 ? (
            <div className="bg-white/50 rounded-xl p-8 border border-amber-100 text-center text-amber-700 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-amber-200">
                <QrCode size={24} className="text-amber-400" />
              </div>
              <p className="font-medium text-amber-800">ไม่มีผู้ใช้งานกำลังทำรายการในขณะนี้</p>
              <p className="text-sm text-amber-600/70 mt-1">รายการที่กำลังสแกนจ่ายแต่ยังไม่แนบสลิปจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {waiting.map((tx: any, index: number) => {
                const houses = [...new Set(tx.invoices.map((i: any) => i.houseNumber))];
                return (
                  <div key={tx.id} className="relative overflow-hidden bg-white rounded-xl p-4 border-2 border-amber-100 shadow-sm flex flex-col gap-3 animate-in slide-in-from-bottom-6 fade-in duration-700 hover:border-amber-300 transition-colors" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    {/* Animated top bar to simulate loading */}
                    <div className="absolute top-0 left-0 h-1 bg-amber-400 w-full animate-pulse"></div>
                    
                    <div className="flex items-center justify-between relative z-10 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 ring-4 ring-amber-50/50">
                          <QrCode size={20} className="text-amber-600" />
                          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">รหัสรายการ #{tx.id}</span>
                          <span className="font-bold text-slate-700 text-sm">บ้านเลขที่ {houses.join(", ")}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="block font-mono font-bold text-lg text-amber-600">{parseFloat(tx.amount).toFixed(2)} ฿</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white rounded-lg p-2.5 px-3 border border-amber-100/60 mt-1">
                      <span className="text-[11px] text-amber-700 flex items-center gap-2 font-medium">
                        <Loader2 size={14} className="animate-spin text-amber-500" /> 
                        กำลังรอผู้ใช้แนบสลิป
                      </span>
                      <div className="flex gap-1.5 opacity-80">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {/* 2. รอดำเนินการ (Pending Review) */}
      {activeTab === "pending" && (
        <div>
          {isLoading ? (
            <div className="space-y-6 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm animate-pulse flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 bg-slate-200 rounded-2xl h-64"></div>
                  <div className="w-full md:w-2/3 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-10 bg-slate-200 rounded w-full mt-8"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-slate-200 text-center py-20 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <FileSignature size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีรายการรอตรวจสอบ</h2>
              <p className="text-slate-500 max-w-md">เยี่ยมมาก! คุณได้ตรวจสอบสลิปการโอนเงินที่ค้างอยู่ทั้งหมดเรียบร้อยแล้ว</p>
            </div>
          ) : (
            <div className="space-y-6 mt-2">
              {pending.map((tx: any, index: number) => (
                <div key={tx.id} className="animate-in slide-in-from-bottom-6 fade-in duration-700" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}>
                  <SlipReviewForm 
                    transaction={tx} 
                    onReviewed={() => mutate()} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
