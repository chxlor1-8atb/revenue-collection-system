import fs from 'fs';
import path from 'path';

const file = path.resolve('src/app/dashboard/page.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Add systemSettings to import
content = content.replace(
  'import { transactions, invoices, houses, lineMessages } from "@/lib/schema";',
  'import { transactions, invoices, houses, lineMessages, systemSettings } from "@/lib/schema";\nimport { CalendarClock, BellRing } from "lucide-react";'
);

// Fetch settings
content = content.replace(
  'const currentYear = new Date().getFullYear();',
  `const [settings] = await db.select().from(systemSettings).limit(1);
  const currentYear = new Date().getFullYear();`
);

// Add Widget below RevenueChart
const newWidget = `
          {settings?.autoBillingDay && (
            <div className="bg-[#1F2E22] rounded-[32px] p-6 lg:p-8 text-white shadow-lg relative overflow-hidden mt-6 xl:mt-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/10">
                    <CalendarClock size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">ระบบออกบิลอัตโนมัติ (Auto-Billing)</h3>
                    <p className="text-emerald-200/80 text-sm">
                      ตั้งเวลาออกบิลวันที่ {settings.autoBillingDay} ของทุกเดือน และให้เวลาชำระ {settings.dueDateDays || 0} วัน
                    </p>
                  </div>
                </div>

                {settings.autoRemindDays && (
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <BellRing size={20} className="text-amber-400" />
                    <div>
                      <div className="text-xs text-slate-300">แจ้งเตือนทวงหนี้อัตโนมัติ</div>
                      <div className="text-sm font-semibold text-amber-400">หลังเลยกำหนด {settings.autoRemindDays} วัน</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
`;

content = content.replace(
  '<RevenueChart \n            transactions={verifiedTxs.map(tx => ({\n              amount: tx.amount,\n              date: (tx.paidAt || tx.createdAt)?.toISOString() || null\n            }))} \n          />\n        </StaggerItem>',
  `<RevenueChart 
            transactions={verifiedTxs.map(tx => ({
              amount: tx.amount,
              date: (tx.paidAt || tx.createdAt)?.toISOString() || null
            }))} 
          />
${newWidget}
        </StaggerItem>`
);

fs.writeFileSync(file, content);
console.log('Dashboard widget added');
