import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/dashboard/houses/HousesClient.tsx');
let content = fs.readFileSync(file, 'utf-8');

// 1. Imports
content = content.replace(
  'import { deleteHouse, createInitialInvoice } from "./actions";',
  'import { deleteHouse, createInitialInvoice, sendLineReminder } from "./actions";'
);
content = content.replace(
  'import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Upload, QrCode, X, Settings, Home, Loader2, FileText, CheckCircle2 } from "lucide-react";',
  'import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Upload, QrCode, X, Settings, Home, Loader2, FileText, CheckCircle2, FilePlus, Send, Copy, Check } from "lucide-react";'
);

// 2. States
content = content.replace(
  'const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string } | null>(null);',
  `const [initialBillPrompt, setInitialBillPrompt] = useState<{ isOpen: boolean; houseId: number; monthYear: string; amount: string; isManual?: boolean } | null>(null);
  const [sendingLine, setSendingLine] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);`
);

// 3. QR Modal Actions
const qrModalActions = `            <a
              href={qrModal.qrDataUrl}
              download={\`qrcode_house_\${qrModal.houseNumber.replace(/\\//g, '-')}.png\`}
              className="w-full py-3 bg-[#1F2E22] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#1F2E22]/20 mb-3"
            >
              <Download size={18} />
              บันทึกรูป QR Code
            </a>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrModal.url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {copiedLink ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              {copiedLink ? 'คัดลอกลิงก์สำเร็จ' : 'คัดลอกลิงก์ชำระเงิน'}
            </button>`;

content = content.replace(
  /<a\s+href=\{qrModal\.qrDataUrl\}[\s\S]*?<\/a>/,
  qrModalActions
);

// 4. Action Icons in Table
const iconsBlock = `                      <button
                        onClick={() => openQrModal(house)}
                        className="p-2 text-slate-400 hover:text-[#5B58F2] hover:bg-slate-100 rounded-lg transition-colors"
                        title="QR Code & ลิงก์ชำระเงิน"
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setInitialBillPrompt({
                            isOpen: true,
                            houseId: house.id!,
                            monthYear: new Date().toISOString().slice(0, 7),
                            amount: house.defaultBillingAmount || "20.00",
                            isManual: true
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="สร้างบิลค้างชำระ (แมนนวล)"
                      >
                        <FilePlus size={14} />
                      </button>
                      {(house as any).lineUserId ? (
                        <button
                          onClick={async () => {
                            if (!confirm(\`ต้องการส่งแจ้งเตือนยอดค้างชำระไปที่ LINE ของบ้านเลขที่ \${house.houseNumber} หรือไม่?\`)) return;
                            setSendingLine(house.id!);
                            const res = await sendLineReminder(house.id!, window.location.origin);
                            setSendingLine(null);
                            if (res.success) {
                              setSuccessMsg("ส่งแจ้งเตือนทาง LINE สำเร็จ!");
                            } else {
                              setError(res.error || "เกิดข้อผิดพลาด: " + (res.error || ""));
                            }
                          }}
                          disabled={sendingLine === house.id}
                          className="p-2 text-[#00B900] opacity-80 hover:opacity-100 hover:bg-slate-100 rounded-lg transition-colors"
                          title="ส่งแจ้งเตือนบิลค้างชำระผ่าน LINE"
                        >
                          {sendingLine === house.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      ) : (
                         <div className="w-[30px]" />
                      )}
                      <button
                        onClick={() => handleEdit(house)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="แก้ไขข้อมูลบ้าน"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(house.id!, house.houseNumber)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="ลบข้อมูลบ้าน"
                      >
                        <Trash2 size={14} />
                      </button>`;

content = content.replace(
  /<button\s+onClick=\{\(\) => openQrModal\(house\)\}[\s\S]*?<Trash2 size=\{14\} \/>\s*<\/button>/,
  iconsBlock
);

// 5. Bill Prompt Modals text updates
content = content.replace(
  /<h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">\s*<FileText className="text-blue-600" size=\{20\} \/>\s*สร้างบิลตั้งต้น\s*<\/h3>/,
  `<h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                {initialBillPrompt.isManual ? "สร้างบิลค้างชำระแบบแมนนวล" : "สร้างบิลตั้งต้น"}
              </h3>`
);

content = content.replace(
  /<p className="text-slate-600 mb-6 leading-relaxed">\s*คุณต้องการสร้างบิลตั้งต้นหรือยอดยกมา สำหรับบ้านที่เพิ่งเพิ่มเข้าไปใหม่นี้เลยหรือไม่\?\s*<\/p>/,
  `<p className="text-slate-600 mb-6 leading-relaxed">
                {initialBillPrompt.isManual ? "ระบุยอดเงินและประจำเดือนที่ต้องการสร้างบิลค้างชำระ (เพิ่มยอดหนี้) ให้กับบ้านหลังนี้" : "คุณต้องการสร้างบิลตั้งต้นหรือยอดยกมา สำหรับบ้านที่เพิ่งเพิ่มเข้าไปใหม่นี้เลยหรือไม่?"}
              </p>`
);

content = content.replace(
  /\{isGeneratingBill \? \(\s*<><Loader2 size=\{16\} className="animate-spin mr-2" \/> กำลังสร้าง...<\/>\s*\) : "สร้างบิลตั้งต้น"\}/,
  `{isGeneratingBill ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> กำลังสร้าง...</>
                  ) : initialBillPrompt.isManual ? "สร้างบิลทันที" : "สร้างบิลตั้งต้น"}`
);

fs.writeFileSync(file, content);
console.log('Done!');
