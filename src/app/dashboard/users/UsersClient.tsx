"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, CheckCircle2, Shield, Trash2, KeyRound } from "lucide-react";
import UserForm, { AdminUserData } from "./UserForm";
import ConfirmModal from "@/components/ConfirmModal";
import { deleteAdminUser } from "./actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TablePagination from "@/components/TablePagination";

export default function UsersClient({ 
  initialUsers,
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0
}: { 
  initialUsers: any[];
  currentPage?: number;
  totalPages?: number;
  totalUsers?: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: number; username: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

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
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-bold text-2xl text-slate-800 tracking-tight">ผู้ดูแลระบบ</h1>
          <p className="text-slate-500 mt-1 text-[length:13px]">จัดการสิทธิ์การเข้าใช้งานระบบ</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus size={14} />
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden font-sans">
        <div className="overflow-x-auto p-4 sm:p-8 lg:p-10 pb-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider w-12 text-center">ลำดับ</th>
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider">ชื่อผู้ใช้</th>
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider">สิทธิ์การใช้งาน</th>
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider">วันที่สร้าง</th>
                <th className="px-4 py-3 text-[length:11px] font-semibold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-200 rounded mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-6 w-16 bg-slate-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                initialUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}>
                  <td className="px-4 py-4 text-center text-slate-400 text-[length:13px]">{idx + 1}</td>
                  <td className="px-4 py-4 font-semibold text-slate-800 text-[length:13px] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                      <KeyRound size={12} />
                    </div>
                    {user.username}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[length:10px] font-bold ${
                      user.role === 'admin' 
                        ? 'bg-[#EEF0FF] text-[#5B58F2]' 
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <Shield size={10} />
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[length:13px] text-slate-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-[#5B58F2] hover:bg-slate-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.username)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
              
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500 font-medium">
                    ไม่พบผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={20}
          onPageChange={handlePageChange}
        />
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
