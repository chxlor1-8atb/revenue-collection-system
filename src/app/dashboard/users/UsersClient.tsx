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
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col font-sans mb-8">
        {/* Header & Toolbar */}
        <div className="p-4 sm:p-6 lg:p-8 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-bold text-2xl text-slate-800 tracking-tight">ผู้ดูแลระบบ</h1>
              <p className="text-slate-500 mt-1 text-[length:13px]">จัดการสิทธิ์การเข้าใช้งานระบบ</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => toggleViewMode("detailed")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "detailed" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List size={14} />
                  <span className="hidden sm:inline">ละเอียด</span>
                </button>
                <button
                  onClick={() => toggleViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">การ์ด</span>
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm ml-auto sm:ml-0"
              >
                <Plus size={14} />
                เพิ่มผู้ใช้งาน
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === "grid" ? (
          <div className="p-4 sm:p-6 lg:p-8 pt-0 bg-slate-50/50 min-h-[400px]">
            {initialUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-slate-700 font-bold mb-1">ไม่พบผู้ใช้งาน</h3>
                <p className="text-slate-500 text-sm">คลิก "เพิ่มผู้ใช้งาน" เพื่อเพิ่มผู้ดูแลระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {initialUsers.map((user, idx) => (
                  <div 
                    key={user.id} 
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group animate-in zoom-in-95 fade-in fill-mode-both"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <KeyRound size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-800 text-sm truncate" title={user.username}>{user.username}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        user.role === 'admin' ? 'bg-[#EEF0FF] text-[#5B58F2]' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <Shield size={10} />
                        {user.role.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Edit2 size={12} /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.username)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors"
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
          <div className="overflow-x-auto p-4 sm:p-8 lg:p-10 pt-0">
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
                {isPending && initialUsers.length === 0 ? (
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
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-bottom-6 fade-in duration-700 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
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
                        <div className="flex items-center justify-end gap-1">
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

