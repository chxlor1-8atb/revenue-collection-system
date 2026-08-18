"use client";

import { useState } from "react";
import { addHouse, updateHouse } from "./actions";
import { X, Save, Home, User, MapPin, AlignLeft } from "lucide-react";
import { CustomField } from "./CustomFieldsManager";
import CustomSelect from "@/components/CustomSelect";

function SelectFieldWrapper({ name, defaultValue, options, placeholder, icon }: any) {
  const [val, setVal] = useState(defaultValue || "");
  return (
    <CustomSelect 
      name={name}
      value={val}
      onChange={setVal}
      options={options}
      placeholder={placeholder}
      icon={icon}
    />
  );
}

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
  onSuccess: (houseId?: number) => void
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
      if (!field.isSystem) {
        const val = formData.get(`custom_${field.id}`);
        if (val) {
          customFieldsObj[field.id] = val.toString().trim();
        }
        formData.delete(`custom_${field.id}`);
      }
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
        onSuccess(res.houseId);
      } else {
        setError(res.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForField = (id: string) => {
    switch (id) {
      case 'houseNumber': return <Home size={16} className="text-slate-400" />;
      case 'ownerName': return <User size={16} className="text-slate-400" />;
      case 'zone': 
      case 'moo':
      case 'soi':
      case 'road': return <MapPin size={16} className="text-slate-400" />;
      default: return <AlignLeft size={16} className="text-slate-400" />;
    }
  };

  const visibleFields = customFieldsSchema.filter(f => !f.isHidden);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 shrink-0">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {visibleFields.map(field => {
              // Determine initial value based on whether it's a system field or custom field
              let defaultValue = "";
              if (initialData) {
                if (field.isSystem) {
                  defaultValue = (initialData as any)[field.id] || "";
                } else {
                  defaultValue = initialData.customFields?.[field.id] || "";
                }
              }

              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    {field.type === "select" ? (
                      <SelectFieldWrapper
                        name={field.isSystem ? field.id : `custom_${field.id}`}
                        defaultValue={defaultValue}
                        options={field.options?.map((opt: string) => ({ value: opt, label: opt })) || []}
                        placeholder={field.placeholder}
                        icon={getIconForField(field.id)}
                      />
                    ) : (
                      <>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {getIconForField(field.id)}
                        </div>
                        <input
                          type={field.type || "text"}
                          name={field.isSystem ? field.id : `custom_${field.id}`}
                          required={field.required}
                          defaultValue={defaultValue}
                          className="pl-10 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border"
                          placeholder={field.placeholder || ""}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end gap-3 shrink-0">
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
