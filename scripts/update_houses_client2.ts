import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/dashboard/houses/HousesClient.tsx');
let content = fs.readFileSync(file, 'utf-8');

// 1. Update State interface
content = content.replace(
  'const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string; isManual?: boolean } | null>(null);',
  'const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string; isManual?: boolean; type?: string; title?: string } | null>(null);'
);

// 2. Add Invoice Type Dropdown and Title Input
const oldInputs = `              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประจำเดือน <span className="text-red-500">*</span></label>
                  <MonthPicker
                    value={initialBillPrompt.monthYear}
                    onChange={(val) => setInitialBillPrompt(prev => prev ? { ...prev, monthYear: val } : null)}
                    disabled={isGeneratingBill}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยอดเงิน (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={initialBillPrompt.amount}
                    onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, amount: e.target.value } : null)}
                    disabled={isGeneratingBill}
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>`;

const newInputs = `              <div className="space-y-4 mb-6">
                {initialBillPrompt.isManual && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทบิล <span className="text-red-500">*</span></label>
                    <select
                      value={initialBillPrompt.type || 'monthly'}
                      onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, type: e.target.value } : null)}
                      disabled={isGeneratingBill}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3 bg-white"
                    >
                      <option value="monthly">ค่าขยะรายเดือนปกติ</option>
                      <option value="arrears">ยอดยกมา (ค้างชำระจากระบบเก่า)</option>
                      <option value="custom">บิลพิเศษ (ระบุชื่อรายการเอง)</option>
                    </select>
                  </div>
                )}
                
                {initialBillPrompt.type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรายการ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={initialBillPrompt.title || ''}
                      onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
                      disabled={isGeneratingBill}
                      placeholder="เช่น ค่าเก็บที่นอน, ค่าปรับ ฯลฯ"
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {initialBillPrompt.type === 'arrears' ? 'บันทึกลงประจำเดือน' : 'ประจำเดือน'} <span className="text-red-500">*</span>
                  </label>
                  <MonthPicker
                    value={initialBillPrompt.monthYear}
                    onChange={(val) => setInitialBillPrompt(prev => prev ? { ...prev, monthYear: val } : null)}
                    disabled={isGeneratingBill}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยอดเงิน (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={initialBillPrompt.amount}
                    onChange={(e) => setInitialBillPrompt(prev => prev ? { ...prev, amount: e.target.value } : null)}
                    disabled={isGeneratingBill}
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>`;

content = content.replace(oldInputs, newInputs);

// 3. Update create call
content = content.replace(
  'const res = await createInitialInvoice(initialBillPrompt.houseId, initialBillPrompt.monthYear, initialBillPrompt.amount);',
  'const res = await createInitialInvoice(initialBillPrompt.houseId, initialBillPrompt.monthYear, initialBillPrompt.amount, initialBillPrompt.type || "monthly", initialBillPrompt.title || null);'
);

fs.writeFileSync(file, content);
console.log('HousesClient updated');
