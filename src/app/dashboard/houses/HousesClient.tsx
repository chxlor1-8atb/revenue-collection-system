"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import HouseForm, { HouseData } from "./HouseForm";
import { deleteHouse } from "./actions";

export default function HousesClient({ initialHouses }: { initialHouses: HouseData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deletingHouse, setDeletingHouse] = useState<{ id: number; houseNumber: string } | null>(null);

  const handleAdd = () => {
    setEditingHouse(undefined);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (house: HouseData) => {
    setEditingHouse(house);
    setShowForm(true);
    setError(null);
  };

  const confirmDelete = (id: number, houseNumber: string) => {
    setDeletingHouse({ id, houseNumber });
  };

  const handleDelete = async () => {
    if (!deletingHouse) return;
    setError(null);
    const res = await deleteHouse(deletingHouse.id);
    if (!res.success) {
      setError(res.error || "เกิดข้อผิดพลาดในการลบ");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setDeletingHouse(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-3xl text-[#1F2E22]">จัดการข้อมูลบ้าน</h1>
        <div className="flex gap-4">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#1F2E22] hover:bg-[#2c4030] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            เพิ่มบ้านใหม่
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 shadow-sm flex items-start gap-3">
          <div className="mt-0.5">⚠️</div>
          <div>{error}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500 uppercase tracking-wider">
                <th className="p-4">บ้านเลขที่</th>
                <th className="p-4">ชื่อเจ้าบ้าน</th>
                <th className="p-4">ชุมชน/หมู่</th>
                <th className="p-4">สมุดบัญชีบ้าน</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialHouses.map((house) => (
                <tr key={house.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{house.houseNumber}</td>
                  <td className="p-4 font-medium">{house.ownerName}</td>
                  <td className="p-4 text-slate-500">{house.zone || "-"}</td>
                  <td className="p-4">
                    <Link 
                      href={`/dashboard/houses/${house.id}`} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                      ดูข้อมูลบิล
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(house)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => confirmDelete(house.id!, house.houseNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {initialHouses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-slate-400 mb-2">🏠</div>
                    <div className="text-slate-500 font-medium">ยังไม่มีข้อมูลบ้านในระบบ</div>
                    <div className="text-sm text-slate-400 mt-1">กดปุ่ม "เพิ่มบ้านใหม่" ด้านบนเพื่อเริ่มต้น</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <HouseForm 
          initialData={editingHouse} 
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
              ยืนยันการลบ
            </h3>
            <p className="text-center text-slate-600 mb-2">
              คุณต้องการลบข้อมูลบ้านเลขที่ <strong className="text-slate-900">{deletingHouse.houseNumber}</strong> ใช่หรือไม่?
            </p>
            <p className="text-center text-xs text-red-500 mb-6 bg-red-50 p-2 rounded-lg">
              *จะลบได้ก็ต่อเมื่อไม่มีบิลค้างอยู่ในระบบเท่านั้น
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingHouse(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
