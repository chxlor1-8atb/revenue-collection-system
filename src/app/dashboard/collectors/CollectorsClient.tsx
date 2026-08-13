"use client";

import { useState } from "react";
import { Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";
import CollectorForm, { CollectorData } from "./CollectorForm";
import { toggleCollectorActive } from "./actions";

export default function CollectorsClient({ initialCollectors }: { initialCollectors: CollectorData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCollector, setEditingCollector] = useState<CollectorData | undefined>(undefined);

  const handleAdd = () => {
    setEditingCollector(undefined);
    setShowForm(true);
  };

  const handleEdit = (collector: CollectorData) => {
    setEditingCollector(collector);
    setShowForm(true);
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    if (confirm(`คุณต้องการ ${currentActive ? 'ปิด' : 'เปิด'} การใช้งานพนักงานคนนี้ใช่หรือไม่?`)) {
      await toggleCollectorActive(id, !currentActive);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-3xl text-[#1F2E22]">จัดการพนักงานรับเงิน</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          เพิ่มพนักงาน
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500 uppercase tracking-wider">
                <th className="p-4">ชื่อพนักงาน</th>
                <th className="p-4">เบอร์พร้อมเพย์</th>
                <th className="p-4">Telegram ID</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialCollectors.map((collector) => (
                <tr key={collector.id} className={`hover:bg-slate-50 transition-colors ${!collector.active ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="p-4 font-medium">{collector.name}</td>
                  <td className="p-4 font-mono text-sm">{collector.promptPayId}</td>
                  <td className="p-4 font-mono text-sm text-slate-500">{collector.telegramChatId || '-'}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggleActive(collector.id!, !!collector.active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        collector.active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {collector.active ? (
                        <><CheckCircle2 size={12} /> เปิดใช้งาน</>
                      ) : (
                        <><XCircle size={12} /> ปิดใช้งาน</>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleEdit(collector)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
              
              {initialCollectors.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    ยังไม่มีข้อมูลพนักงานในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CollectorForm 
          initialData={editingCollector} 
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)} 
        />
      )}
    </div>
  );
}
