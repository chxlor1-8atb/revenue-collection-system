"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Download, Building2, DollarSign, ArrowUpRight, CheckCircle2, AlertTriangle, FileSpreadsheet, Calendar, Sparkles } from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import CurrencyDisplay from "@/components/CurrencyDisplay";

interface CommunityStat {
  zone: string;
  totalHouses: number;
  paidAmount: number;
  unpaidAmount: number;
  collectionRate: number;
}

interface ReportsClientProps {
  todayRevenue: number;
  totalPaidRevenue: number;
  totalUnpaidDebt: number;
  totalHouses: number;
  communityStats: CommunityStat[];
}

export default function ReportsClient({
  todayRevenue,
  totalPaidRevenue,
  totalUnpaidDebt,
  totalHouses,
  communityStats,
}: ReportsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const totalDemand = totalPaidRevenue + totalUnpaidDebt;
  const overallCollectionRate = totalDemand > 0 ? Math.round((totalPaidRevenue / totalDemand) * 100) : 0;

  const filteredCommunities = communityStats.filter(c => 
    c.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-sans pb-12 space-y-6">
      {/* 1. Page Header with Official Excel Export */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <LottieIcon src="/icons/icons8-document.json" size={52} className="shrink-0" loop autoplay />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-2xl lg:text-3xl text-slate-800 tracking-tight">
                ศูนย์รายงานการคลัง & สถิติชุมชน
              </h1>
              <span className="bg-indigo-50 text-[blue-600] text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                <BarChart3 size={12} /> สถ. กองคลัง
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รายงานสรุปบัญชีรายรับประจำวัน รายงานลูกหนี้ค้างชำระ และอัตราการจัดเก็บ 20 ชุมชน
            </p>
          </div>
        </div>

        <a
          href="/api/reports/export"
          className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          <span>ส่งออกรายงานราชการ (.xlsx)</span>
        </a>
      </div>

      {/* 2. Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>รายรับวันนี้</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">Today</span>
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={todayRevenue} size="xl" variant="default" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">บันทึกรับเงินวันนี้</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <div className="text-emerald-700 text-xs font-medium flex items-center justify-between">
            <span>รายรับสะสมทั้งหมด</span>
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={totalPaidRevenue} size="xl" variant="success" />
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">จัดเก็บเข้าคลังสำเร็จ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-2xs">
          <div className="text-amber-700 text-xs font-medium flex items-center justify-between">
            <span>ลูกหนี้ค้างชำระสะสม</span>
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={totalUnpaidDebt} size="xl" variant="warning" />
          </div>
          <div className="text-[11px] text-amber-600 mt-1">รอการชำระ/ติดตาม</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-2xs">
          <div className="text-[blue-600] text-xs font-medium flex items-center justify-between">
            <span>อัตราจัดเก็บรวม</span>
            <span className="font-bold">{overallCollectionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-[blue-600] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(overallCollectionRate, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
            <span>เป้าหมาย {totalHouses} หลัง</span>
            <span className="font-semibold text-slate-700">{overallCollectionRate}% สำเร็จ</span>
          </div>
        </div>
      </div>

      {/* 3. Community Ranking & Performance Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-[blue-600]" />
              จัดอันดับผลงานการจัดเก็บ 20 ชุมชน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">เรียงลำดับตามอัตราความสำเร็จในการจัดเก็บรายได้</p>
          </div>

          <input
            type="text"
            placeholder="ค้นหาชื่อชุมชน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[blue-600] outline-hidden"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">อันดับ</th>
                <th className="py-3 px-4">ชื่อชุมชน</th>
                <th className="py-3 px-4 text-center">ทะเบียนบ้าน</th>
                <th className="py-3 px-4 text-right">จัดเก็บแล้ว</th>
                <th className="py-3 px-4 text-right">ค้างชำระ</th>
                <th className="py-3 px-4 w-48 text-right">อัตราจัดเก็บ (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCommunities.map((c, idx) => (
                <tr key={c.zone} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                    {idx < 3 ? (
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold ${
                        idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-amber-700"
                      }`}>
                        {idx + 1}
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    ชุมชน{c.zone}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                    {c.totalHouses} หลัง
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <CurrencyDisplay amount={c.paidAmount} size="xs" variant="success" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <CurrencyDisplay amount={c.unpaidAmount} size="xs" variant="warning" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            c.collectionRate >= 80 
                              ? "bg-emerald-500" 
                              : c.collectionRate >= 50 
                                ? "bg-[blue-600]" 
                                : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(c.collectionRate, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800 w-12 text-right">{c.collectionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
