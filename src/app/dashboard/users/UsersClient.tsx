"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Edit2, Shield, Trash2, KeyRound, List, LayoutGrid } from "lucide-react";
import UserForm, { AdminUserData } from "./UserForm";
import ConfirmModal from "@/components/ConfirmModal";
import { deleteAdminUser } from "./actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TablePagination from "@/components/TablePagination";

export default function UsersClient({ 
  initialUsers,
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  limit = 10
}: { 
  initialUsers: any[];
  currentPage?: number;
  totalPages?: number;
  totalUsers?: number;
  limit?: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: number; username: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [viewMode, setViewMode] = useState<"detailed" | "grid">("grid");

  useEffect(() => {
    const saved = localStorage.getItem("users_view_mode");
    if (saved === "detailed" || saved === "grid") setViewMode(saved);
  }, []);

  const toggleViewMode = (mode: "detailed" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("users_view_mode", mode);
  };

  const updateUrlParams = (page: number, newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');

    if (newLimit !== 10) params.set('limit', newLimit.toString());
    else params.delete('limit');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams(page, limit);
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col font-sans mb-8">
        {/* Header & Toolbar */}
        <div className="p-6 lg:p-7 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icons8-user.gif" alt="ผู้ดูแลระบบ" className="w-12 h-12 object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-2xl text-slate-900 tracking-tight">ผู้ดูแลระบบ</h1>
                <span className="bg-[#EEF0FF] text-[#5B58F2] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D5D9FF]">
                  {totalUsers} บัญชี
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">จัดการสิทธิ์การเข้าใช้งานระบบและบัญชีเจ้าหน้าที่</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => toggleViewMode("detailed")}
                aria-label="มุมมองละเอียด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "detailed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List size={14} /> ละเอียด
              </button>
              <button
                onClick={() => toggleViewMode("grid")}
                aria-label="มุมมองการ์ด"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={14} /> การ์ด
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5B58F2]/25 cursor-pointer"
            >
              <Plus size={15} />
              เพิ่มผู้ใช้งาน
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === "grid" ? (
          <div className="p-6 lg:p-8 bg-slate-50/30 min-h-[400px]">
            {initialUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
                  <Shield size={32} />
                </div>
                <h3 className="text-slate-800 font-bold mb-1">ไม่พบผู้ใช้งาน</h3>
                <p className="text-slate-500 text-xs">คลิก "เพิ่มผู้ใช้งาน" เพื่อเพิ่มผู้ดูแลระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {initialUsers.map((user, idx) => (
                  <div 
                    key={user.id} 
                    className="bg-white border border-slate-200/90 hover:border-[#5B58F2]/40 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#5B58F2] flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-slate-900 text-sm truncate" title={user.username}>{user.username}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              สร้างเมื่อ {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                          user.role === 'admin' 
                            ? 'bg-[#EEF0FF] text-[#5B58F2] border-[#D5D9FF]' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <Shield size={10} />
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.username)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} /> ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 lg:p-8 pt-0 overflow-x-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-16 text-center">ลำดับ</th>
                    <th className="px-5 py-3.5">ชื่อผู้ใช้</th>
                    <th className="px-5 py-3.5">สิทธิ์การใช้งาน</th>
                    <th className="px-5 py-3.5">วันที่สร้าง</th>
                    <th className="px-5 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isPending && initialUsers.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 w-4 bg-slate-200 rounded mx-auto"></div></td>
                        <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-4"><div className="h-6 w-16 bg-slate-200 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (
                    initialUsers.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 text-center text-slate-400 text-xs font-mono">{idx + 1}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5B58F2] font-bold text-xs">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          {user.username}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            user.role === 'admin' 
                              ? 'bg-[#EEF0FF] text-[#5B58F2] border-[#D5D9FF]' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            <Shield size={11} />
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-slate-400 hover:text-[#5B58F2] hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id, user.username)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
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
          </div>
        )}
        
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={(newLimit) => updateUrlParams(1, newLimit)}
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

