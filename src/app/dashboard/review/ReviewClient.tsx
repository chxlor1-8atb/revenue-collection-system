"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import SlipReviewForm from "./SlipReviewForm";
import { FileSignature, Loader2, QrCode } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReviewClient() {
  // Poll every 3 seconds
  const { data, error, isLoading, mutate } = useSWR('/api/transactions/review', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const pending = data?.pending || [];
  const waiting = data?.waiting || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-3xl text-[#1F2E22]">ตรวจสลิปโอนเงิน</h1>
        <div className="flex items-center gap-2">
           <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
           </span>
           <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Realtime Sync</span>
        </div>
      </div>
      
      {/* 1. กำลังทำรายการ (Waiting for Slip) */}
      {waiting.length > 0 && (
        <div className="mb-8 bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
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
                        <span className="text-[10px] text-amber-500 flex items-center gap-1 justify-end mt-1">
                          <Loader2 size={10} className="animate-spin" /> รอสลิป...
                        </span>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. รอดำเนินการ (Pending Review) */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <h2 className="text-xl font-bold text-[#1F2E22]">รายการรอตรวจสอบสลิป ({pending.length})</h2>
      </div>

      {isLoading && !data ? (
        <div className="ledger-card text-center py-16 flex flex-col items-center justify-center">
          <Loader2 size={48} className="animate-spin mb-4 text-emerald-500 opacity-70" />
          <p className="text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="ledger-card text-center py-16 flex flex-col items-center justify-center">
          <FileSignature size={48} strokeWidth={1} color="#C9A227" className="mb-4 opacity-70" />
          <p className="text-lg text-gray-500">ไม่มีรายการรอตรวจสอบในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-6">
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
  );
}
