"use client";

import { useState } from "react";
import { Plus, Edit2, CheckCircle2, Shield, Trash2, KeyRound } from "lucide-react";
import UserForm, { AdminUserData } from "./UserForm";
import ConfirmModal from "@/components/ConfirmModal";
import { deleteAdminUser } from "./actions";
import { useRouter } from "next/navigation";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: number; username: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleAdd = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      role: user.role
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id: number, username: string) => {
    setDeleteConfirmId({ id, username });
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteAdminUser(deleteConfirmId.id);
      router.refresh();
      setDeleteConfirmId(null);
    } catch (e) {
      alert("ไม่สามารถลบผู้ใช้งานได้");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-3xl text-[#1F2E22] font-sans">จัดการผู้ใช้งานระบบ</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm font-sans"
        >
          <Plus size={16} />
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-semibold w-12 text-center">#</th>
                <th className="p-4 font-semibold">ชื่อผู้ใช้ (Username)</th>
                <th className="p-4 font-semibold">สิทธิ์การใช้งาน (Role)</th>
                <th className="p-4 font-semibold">วันที่เพิ่ม</th>
                <th className="p-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {initialUsers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center text-slate-400 text-sm">{idx + 1}</td>
                  <td className="p-4 font-medium flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <KeyRound size={14} />
                    </div>
                    {user.username}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      <Shield size={12} />
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.username)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    ยังไม่มีข้อมูลผู้ใช้งานในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <UserForm
          initialData={editingUser}
          onClose={() => setShowForm(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
        isLoading={isDeleting}
        title="ลบผู้ใช้งานระบบ"
        description={
          <>คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งาน <span className="font-bold text-slate-900">{deleteConfirmId?.username}</span> ?</>
        }
        warningText="ผู้ใช้งานนี้จะไม่สามารถเข้าสู่ระบบได้อีก"
        confirmText="ใช่, ลบผู้ใช้"
      />
    </div>
  );
}
