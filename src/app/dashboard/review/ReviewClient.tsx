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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-3xl text-[#1F2E22]">ตรวจสลิปโอนเงิน</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-200 rounded-xl">
              <QrCode className="text-slate-900" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900">กำลังทำรายการชำระเงิน ({waiting.length})</h2>
              <p className="text-sm text-amber-700">มีผู้ใช้งานกำลังสแกนจ่ายคิวอาร์โค้ด รอระบบตัดยอดอัตโนมัติภายใน 3 นาที</p>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {waiting.length === 0 ? (
            <div className="bg-white/50 rounded-xl p-8 border border-amber-100 text-center text-amber-700">
              ไม่มีผู้ใช้งานกำลังทำรายการในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {waiting.map((tx: any) => {
                const houses = [...new Set(tx.invoices.map((i: any) => i.houseNumber))];
                return (
                  <div key={tx.id} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm flex items-center justify-between">
                     <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">รหัสรายการ #{tx.id}</span>
                        <span className="font-bold text-slate-700">บ้านเลขที่ {houses.join(", ")}</span>
                     </div>
                     <div className="text-right">
                        <span className="block font-mono font-bold text-lg text-amber-600">{parseFloat(tx.amount).toFixed(2)} ฿</span>
                        <span className="text-[length:10px] text-amber-500 flex items-center gap-1 justify-end mt-1">
                          <Loader2 size={10} className="animate-spin" /> รอสลิป...
                        </span>
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
          {isLoading && !data ? (
            <div className="ledger-card text-center py-16 flex flex-col items-center justify-center">
              <Loader2 size={48} className="animate-spin mb-4 text-emerald-500 opacity-70" />
              <p className="text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="ledger-card text-center py-16 flex flex-col items-center justify-center mt-2">
              <FileSignature size={48} strokeWidth={1} color="#C9A227" className="mb-4 opacity-70" />
              <p className="text-lg text-gray-500">ไม่มีรายการรอตรวจสอบในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-6 mt-2">
              {pending.map((tx: any) => (
                <SlipReviewForm 
                  key={tx.id} 
                  transaction={tx} 
                  onReviewed={() => mutate()} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
