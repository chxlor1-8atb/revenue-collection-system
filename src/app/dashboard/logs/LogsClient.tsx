"use client";

import { useState } from "react";
import { Shield, Search, User, Filter, Calendar, Eye, ChevronLeft, ChevronRight, X, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import { useRouter, useSearchParams } from "next/navigation";

interface AuditLogItem {
  id: number;
  userName: string;
  userRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string | Date | null;
}

interface LogsClientProps {
  initialLogs: AuditLogItem[];
  totalLogs: number;
  currentPage: number;
  totalPages: number;
}

export default function LogsClient({
  initialLogs,
  totalLogs,
  currentPage,
  totalPages,
}: LogsClientProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredLogs = initialLogs.filter((log) => {
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesSearch =
      searchTerm === "" ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">อนุมัติ</span>;
      case "REJECT":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">ปฏิเสธ</span>;
      case "CREATE":
        return <span className="bg-indigo-50 text-[#5B58F2] border border-indigo-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">สร้างใหม่</span>;
      case "UPDATE":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">แก้ไข</span>;
      case "DELETE":
      case "VOID":
        return <span className="bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">ลบ / ยกเลิก</span>;
      case "BROADCAST":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200/60 px-2.5 py-0.5 rounded-md font-bold text-[10px]">บรอดแคสต์</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold text-[10px]">{action}</span>;
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/dashboard/logs?page=${newPage}`);
    }
  };

  return (
    <div className="font-sans pb-12 space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <LottieIcon src="/icons/icons8-document.json" size={52} className="shrink-0" loop autoplay />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-2xl lg:text-3xl text-slate-800 tracking-tight">
                ประวัติการทำงานของระบบ (Audit Logs)
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                {totalLogs.toLocaleString()} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              บันทึกประวัติการกระทำของเจ้าหน้าที่ ตรวจสอบความโปร่งใสย้อนหลังตามมาตรฐานงานราชการ
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filters & Table Container */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "APPROVE", label: "อนุมัติรับเงิน" },
              { key: "REJECT", label: "ปฏิเสธสลิป" },
              { key: "CREATE", label: "เพิ่มข้อมูล" },
              { key: "UPDATE", label: "แก้ไข" },
              { key: "VOID", label: "ยกเลิกใบเสร็จ" },
              { key: "BROADCAST", label: "แจ้งเตือน LINE" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterAction(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === f.key
                    ? "bg-[#5B58F2] text-white shadow-2xs"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="ค้นหาเจ้าหน้าที่, บ้านเลขที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">วัน-เวลา</th>
                <th className="py-3 px-4">เจ้าหน้าที่ / ผู้กระทำ</th>
                <th className="py-3 px-3 text-center">กิจกรรม</th>
                <th className="py-3 px-4">หมวดหมู่เป้าหมาย</th>
                <th className="py-3 px-4">รายละเอียด</th>
                <th className="py-3 px-3 text-center">ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบรายการประวัติการทำงาน
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-normal font-mono">({log.userRole})</span>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      <span className="font-mono text-slate-800">{log.entityType}</span>
                      {log.entityId && <span className="text-slate-400 text-[11px] ml-1">#{log.entityId}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs text-[11px]">
                      {typeof log.details === "object" ? (
                        <span>
                          {log.details.houseNumber && `บ้านเลขที่ ${log.details.houseNumber} `}
                          {log.details.amount && `ยอดเงิน ฿${log.details.amount} `}
                          {log.details.receiptCode && `(${log.details.receiptCode})`}
                          {!log.details.houseNumber && !log.details.amount && JSON.stringify(log.details)}
                        </span>
                      ) : (
                        String(log.details)
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-[#5B58F2] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="ดูรายละเอียดเชิงลึก"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            หน้า <strong>{currentPage}</strong> จาก <strong>{totalPages}</strong> (ทั้งหมด {totalLogs} รายการ)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#5B58F2]" />
                <h3 className="font-bold text-slate-800 text-sm">รายละเอียดประวัติกิจกรรม #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">ผู้ดำเนินการ:</span>
                <span className="font-bold text-slate-800">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">การกระทำ (Action):</span>
                <span>{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">หมวดหมู่ (Entity):</span>
                <span className="font-mono text-slate-800">{selectedLog.entityType} {selectedLog.entityId ? `#${selectedLog.entityId}` : ""}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">วัน-เวลา:</span>
                <span className="font-mono text-slate-800">{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("th-TH") : "-"}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1">ข้อมูลเชิงลึก (Payload Details):</div>
              <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 custom-scrollbar">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
