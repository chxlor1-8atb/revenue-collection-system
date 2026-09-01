"use client";

import { useState } from "react";
import { addHouse, updateHouse } from "./actions";
import { X, Save, Home, User, MapPin, AlignLeft, Banknote, Sparkles, Check } from "lucide-react";
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
  defaultBillingAmount: string | null;
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

  // Default Billing Amount live state
  const [billingAmount, setBillingAmount] = useState<string>(
    initialData?.defaultBillingAmount ? String(parseFloat(initialData.defaultBillingAmount)) : ""
  );

  const effectiveBillingAmount = billingAmount && billingAmount.trim() !== "" && !isNaN(parseFloat(billingAmount))
    ? parseFloat(billingAmount)
    : 20;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Ensure defaultBillingAmount is always populated with effective amount (default 20.00)
    formData.set("defaultBillingAmount", effectiveBillingAmount.toFixed(2));

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
      case 'defaultBillingAmount': return <Banknote size={16} className="text-slate-400" />;
      case 'zone': 
      case 'moo':
      case 'soi':
      case 'road': return <MapPin size={16} className="text-slate-400" />;
      default: return <AlignLeft size={16} className="text-slate-400" />;
    }
  };

  const visibleFields = customFieldsSchema.filter(f => !f.isHidden);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] border border-slate-200/90">
        
        {/* Header */}
        <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-[blue-600] flex items-center justify-center font-bold">
              <Home size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {initialData ? 'แก้ไขข้อมูลบ้าน' : 'เพิ่มข้อมูลบ้านใหม่'}
              </h3>
              <p className="text-xs text-slate-500">ทะเบียนบ้านและลูกบ้าน เทศบาลเมืองนางรอง</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 shrink-0">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {visibleFields.map(field => {
              // Special Enhanced Renderer for defaultBillingAmount
              if (field.id === "defaultBillingAmount") {
                return (
                  <div key={field.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Banknote size={15} className="text-[blue-600]" />
                        {field.name}
                      </label>
                      
                      {/* Live Amount Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        effectiveBillingAmount === 20 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}>
                        {effectiveBillingAmount === 20 ? "🟢 มาตรฐาน 20 บาท/เดือน" : `⭐ พิเศษ ${effectiveBillingAmount} บาท/เดือน`}
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400">ลัดเลือก:</span>
                      {[
                        { label: "20 บาท (บ้านทั่วไป)", val: "20" },
                        { label: "40 บาท (ร้านค้า)", val: "40" },
                        { label: "60 บาท", val: "60" },
                        { label: "100 บาท (โรงงาน)", val: "100" }
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setBillingAmount(preset.val)}
                          className={`text-[10px] font-semibold px-2 py-0.8 rounded-lg border transition-all cursor-pointer ${
                            effectiveBillingAmount === parseFloat(preset.val)
                              ? "bg-[blue-600] text-white border-[blue-600] shadow-2xs"
                              : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Input Field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        ฿
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        name="defaultBillingAmount"
                        value={billingAmount}
                        onChange={(e) => setBillingAmount(e.target.value)}
                        className="pl-8 pr-16 block w-full rounded-xl border-slate-200 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white py-2.5 border focus:border-[blue-600] focus:ring-2 focus:ring-[blue-600]/20 outline-hidden transition-all"
                        placeholder="20.00 (เว้นว่าง = ค่าเริ่มต้น 20 บาท)"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-medium">
                        บาท/เดือน
                      </div>
                    </div>

                    {/* Live Clear Confirmation Note */}
                    <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[blue-600]" />
                        <span>ยอดที่จะเรียกเก็บจากบ้านหลังนี้:</span>
                      </span>
                      <strong className="font-mono text-xs font-black text-indigo-700">
                        ฿{effectiveBillingAmount.toFixed(2)} / เดือน
                      </strong>
                    </div>
                  </div>
                );
              }

              // Determine initial value for standard fields
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                          className="pl-9 block w-full rounded-xl border-slate-200 text-xs sm:text-sm text-slate-800 py-2.5 border focus:border-[blue-600] focus:ring-2 focus:ring-[blue-600]/20 outline-hidden transition-all"
                          placeholder={field.placeholder || ""}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[blue-600] to-indigo-600 hover:from-[#4A47D1] hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>บันทึกข้อมูลบ้าน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
