"use client";

import { useState } from "react";
import { addHouse, updateHouse } from "./actions";
import { X, Save, Home, User, MapPin } from "lucide-react";

import { AlignLeft } from "lucide-react";
import { CustomField } from "./CustomFieldsManager";

export type HouseData = {
  id?: number;
  houseNumber: string;
  ownerName: string;
  zone: string | null;
  road: string | null;
  customFields?: Record<string, any>;
};

export default function HouseForm({ 
  initialData, 
  customFieldsSchema = [],
  onClose,
  onSuccess 
}: { 
  initialData?: HouseData, 
  customFieldsSchema?: CustomField[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Extract custom fields from formData
    const customFieldsObj: Record<string, any> = {};
    customFieldsSchema.forEach(field => {
      const val = formData.get(`custom_${field.id}`);
      if (val) {
        customFieldsObj[field.id] = val.toString().trim();
      }
      formData.delete(`custom_${field.id}`);
    });
    // Append the JSON string of custom fields back to formData
    formData.append('customFields', JSON.stringify(customFieldsObj));
    
    try {
      let res;
      if (initialData?.id) {
        res = await updateHouse(initialData.id, formData);
      } else {
        res = await addHouse(formData);
      }

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <Home className="text-blue-600" size={20} />
            {initialData ? 'แก้ไขข้อมูลบ้าน' : 'เพิ่มข้อมูลบ้านใหม่'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                บ้านเลขที่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="houseNumber"
                  required
                  defaultValue={initialData?.houseNumber}
                  className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                  placeholder="เช่น 123/45"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อเจ้าบ้าน / ผู้รับผิดชอบ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="ownerName"
                  required
                  defaultValue={initialData?.ownerName}
                  className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                  placeholder="เช่น สมศรี ใจดี"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชุมชน / หมู่ (ตัวเลือก)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="zone"
                  defaultValue={initialData?.zone || ""}
                  className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                  placeholder="เช่น หมู่ 1 ซอย 5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ถนน (ตัวเลือก)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="road"
                  defaultValue={initialData?.road || ""}
                  className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                  placeholder="เช่น ถนนสุขุมวิท"
                />
              </div>
            </div>

            {customFieldsSchema.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.name}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlignLeft size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name={`custom_${field.id}`}
                    defaultValue={initialData?.customFields?.[field.id] || ""}
                    className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                    placeholder={`กรอก${field.name}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} />
                  บันทึกข้อมูล
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
