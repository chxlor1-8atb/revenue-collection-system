"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, GripVertical, Check, Settings2, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  required: boolean;
  isSystem: boolean;
  isHidden: boolean;
  placeholder?: string;
}

interface CustomFieldsManagerProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function CustomFieldsManager({ onClose, onUpdate }: CustomFieldsManagerProps) {
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary edit state
  const [editForm, setEditForm] = useState<Partial<CustomField>>({});

  useEffect(() => {
    fetch('/api/settings/house-fields')
      .then(res => res.json())
      .then(data => {
        setFields(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addField = () => {
    const newField: CustomField = {
      id: `custom_${generateId()}`,
      name: `คอลัมน์ใหม่ ${fields.length + 1}`,
      type: 'text',
      placeholder: 'กรอกข้อมูล...',
      required: false,
      isSystem: false,
      isHidden: false
    };
    setFields([...fields, newField]);
    startEditing(newField);
  };

  const startEditing = (field: CustomField) => {
    setEditingId(field.id);
    setEditForm({ ...field });
  };

  const saveEdit = () => {
    if (editingId) {
      setFields(fields.map(f => f.id === editingId ? { ...f, ...editForm, name: editForm.name?.trim() || f.name } : f));
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const removeField = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (field?.isSystem) {
      alert("ไม่สามารถลบฟิลด์ระบบได้ (แต่สามารถซ่อนได้)");
      return;
    }
    setFieldToDelete(id);
  };

  const toggleHidden = (id: string) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        // Some system fields might be required to stay visible, but we allow hiding anything for now except maybe houseNumber/ownerName
        if (f.id === 'houseNumber' || f.id === 'ownerName') {
           alert('ฟิลด์นี้จำเป็นต้องแสดงผลเสมอ');
           return f;
        }
        return { ...f, isHidden: !f.isHidden };
      }
      return f;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/house-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        onUpdate();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">เครื่องมือสร้างฟอร์มบ้าน (Form Builder)</h2>
              <p className="text-sm text-slate-500">จัดการข้อมูลที่ต้องการจัดเก็บ เพิ่ม/ลด หรือแก้ไขคำอธิบายได้อิสระ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">กำลังโหลด...</div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${field.isHidden ? 'border-slate-200 opacity-60' : 'border-slate-300'}`}>
                  {editingId === field.id ? (
                    <div className="p-4 bg-blue-50/50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อหัวข้อ (Label)</label>
                          <input 
                            type="text" 
                            value={editForm.name || ""}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">คำอธิบายในกล่อง (Placeholder)</label>
                          <input 
                            type="text" 
                            value={editForm.placeholder || ""}
                            onChange={e => setEditForm({ ...editForm, placeholder: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editForm.required || false}
                              onChange={e => setEditForm({ ...editForm, required: e.target.checked })}
                              disabled={field.id === 'houseNumber' || field.id === 'ownerName'}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            บังคับต้องกรอก (Required)
                          </label>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <button onClick={cancelEdit} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            ยกเลิก
                          </button>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                            <Check size={14} /> ตกลง
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 group">
                      <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${field.isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{field.name}</span>
                          {field.isSystem && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[length:10px] font-medium bg-slate-100 text-slate-500">
                              <Lock size={10} /> ระบบ
                            </span>
                          )}
                          {field.required && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[length:10px] font-medium bg-red-50 text-red-600">
                              จำเป็น
                            </span>
                          )}
                        </div>
                        {field.placeholder && (
                          <span className="text-xs text-slate-400 truncate mt-0.5">{field.placeholder}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleHidden(field.id)}
                          className={`p-1.5 rounded-lg transition-colors ${field.isHidden ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}`}
                          title={field.isHidden ? "คลิกเพื่อแสดงผล" : "คลิกเพื่อซ่อน"}
                        >
                          {field.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        
                        <button 
                          onClick={() => startEditing(field)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไขการตั้งค่า"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {!field.isSystem && (
                          <button 
                            onClick={() => removeField(field.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบทิ้ง"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button 
                onClick={addField}
                className="w-full flex items-center justify-center gap-2 py-4 mt-4 border-2 border-dashed border-slate-300 text-slate-500 hover:text-[#1F2E22] hover:border-[#1F2E22] hover:bg-slate-50 font-medium rounded-xl transition-all"
              >
                <Plus size={16} />
                เพิ่มช่องข้อมูลใหม่
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 py-2.5 px-4 font-medium text-white bg-[#1F2E22] hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกและนำไปใช้งาน"}
          </button>
        </div>

      </div>
    </div>
  );
}
