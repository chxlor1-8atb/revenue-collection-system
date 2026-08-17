"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, GripVertical, Check, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CustomField {
  id: string;
  name: string;
  type: string; // "text"
}

interface CustomFieldsManagerProps {
  onClose: () => void;
  onUpdate: () => void; // callback after saving
}

export default function CustomFieldsManager({ onClose, onUpdate }: CustomFieldsManagerProps) {
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
      id: `field_${generateId()}`,
      name: `คอลัมน์ใหม่ ${fields.length + 1}`,
      type: 'text'
    };
    setFields([...fields, newField]);
    startEditing(newField.id, newField.name);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editingId) {
      setFields(fields.map(f => f.id === editingId ? { ...f, name: editName.trim() || f.name } : f));
      setEditingId(null);
    }
  };

  const removeField = (id: string) => {
    if (confirm("การลบคอลัมน์นี้ จะทำให้ไม่สามารถดูข้อมูลของคอลัมน์นี้ในบ้านทุกหลังได้ คุณแน่ใจหรือไม่?")) {
      setFields(fields.filter(f => f.id !== id));
    }
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">จัดการหัวตารางข้อมูล</h2>
              <p className="text-sm text-slate-500">เพิ่มหรือแก้ไขคอลัมน์พิเศษสำหรับบ้านแต่ละหลัง</p>
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
              {fields.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="text-slate-400 mb-2">📑</div>
                  <p className="text-slate-500 font-medium">ยังไม่มีคอลัมน์พิเศษ</p>
                  <p className="text-sm text-slate-400 mt-1">กดปุ่ม "+ เพิ่มคอลัมน์ใหม่" ด้านล่างเพื่อเริ่มต้น</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm group">
                    <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>
                    <div className="flex-1">
                      {editingId === field.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit()}
                            autoFocus
                            className="w-full px-2 py-1 text-sm border-b-2 border-emerald-500 outline-none font-medium"
                          />
                          <button onClick={saveEdit} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded">
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="font-medium text-slate-700">{field.name}</div>
                      )}
                    </div>
                    
                    {editingId !== field.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(field.id, field.name)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไขชื่อ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => removeField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบคอลัมน์"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              <button 
                onClick={addField}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:text-[#1F2E22] hover:border-[#1F2E22] hover:bg-slate-50 font-medium rounded-xl transition-all"
              >
                <Plus size={16} />
                เพิ่มคอลัมน์ใหม่
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
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
            {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>

      </div>
    </div>
  );
}
