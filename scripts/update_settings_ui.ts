import fs from 'fs';
import path from 'path';

// 1. SettingsForm.tsx
const formFile = path.resolve('src/app/dashboard/settings/SettingsForm.tsx');
let formContent = fs.readFileSync(formFile, 'utf-8');

formContent = formContent.replace(
  'initialPromptPay: string;',
  `initialPromptPay: string;
  initialAutoBillingDay: number | null;
  initialDueDateDays: number | null;
  initialAutoRemindDays: number | null;`
).replace(
  'initialPromptPay,',
  'initialPromptPay,\n  initialAutoBillingDay,\n  initialDueDateDays,\n  initialAutoRemindDays,'
).replace(
  'const [promptPayId, setPromptPayId] = useState(initialPromptPay);',
  `const [promptPayId, setPromptPayId] = useState(initialPromptPay);
  const [autoBillingDay, setAutoBillingDay] = useState<string>(initialAutoBillingDay?.toString() || "");
  const [dueDateDays, setDueDateDays] = useState<string>(initialDueDateDays?.toString() || "");
  const [autoRemindDays, setAutoRemindDays] = useState<string>(initialAutoRemindDays?.toString() || "");`
).replace(
  'body: JSON.stringify({ id: collectorId, name, promptPayId }),',
  'body: JSON.stringify({ id: collectorId, name, promptPayId, autoBillingDay: autoBillingDay ? parseInt(autoBillingDay) : null, dueDateDays: dueDateDays ? parseInt(dueDateDays) : null, autoRemindDays: autoRemindDays ? parseInt(autoRemindDays) : null }),'
).replace(
  '</form>',
  `        
        <div className="pt-6 border-t border-slate-200 mt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">ตั้งค่าระบบบิลและทวงหนี้อัตโนมัติ</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                วันที่ออกบิลอัตโนมัติ (วันที่ของทุกเดือน)
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={autoBillingDay}
                onChange={(e) => setAutoBillingDay(e.target.value)}
                placeholder="เช่น 25 (เว้นว่างถ้าไม่ต้องการให้ออกบิลอัตโนมัติ)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">ระบบจะส่งแจ้งเตือน LINE ทันทีที่ออกบิล (แนะนำ 1-28)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                จำนวนวันครบกำหนดชำระ (Due Date)
              </label>
              <input
                type="number"
                min="1"
                value={dueDateDays}
                onChange={(e) => setDueDateDays(e.target.value)}
                placeholder="เช่น 10 (หมายถึงให้เวลาจ่าย 10 วันนับจากวันออกบิล)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                จำนวนวันที่เลยกำหนด แล้วให้ทวงหนี้ (Auto-Remind)
              </label>
              <input
                type="number"
                min="1"
                value={autoRemindDays}
                onChange={(e) => setAutoRemindDays(e.target.value)}
                placeholder="เช่น 3 (หมายถึงเลยกำหนด 3 วันแล้วให้บอททวงหนี้)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </form>`
);
fs.writeFileSync(formFile, formContent);

// 2. page.tsx
const pageFile = path.resolve('src/app/dashboard/settings/page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf-8');

pageContent = pageContent.replace(
  'initialPromptPay={settings.promptPayId}',
  `initialPromptPay={settings.promptPayId}
          initialAutoBillingDay={settings.autoBillingDay}
          initialDueDateDays={settings.dueDateDays}
          initialAutoRemindDays={settings.autoRemindDays}`
).replace(
  'initialPromptPay="เบอร์พร้อมเพย์"',
  `initialPromptPay="เบอร์พร้อมเพย์"
          initialAutoBillingDay={null}
          initialDueDateDays={null}
          initialAutoRemindDays={null}`
);
fs.writeFileSync(pageFile, pageContent);

// 3. route.ts
const routeFile = path.resolve('src/app/api/settings/promptpay/route.ts');
let routeContent = fs.readFileSync(routeFile, 'utf-8');
routeContent = routeContent.replace(
  'const { id, name, promptPayId } = await req.json();',
  'const { id, name, promptPayId, autoBillingDay, dueDateDays, autoRemindDays } = await req.json();'
).replace(
  '{ accountName: name, promptPayId }',
  '{ accountName: name, promptPayId, autoBillingDay, dueDateDays, autoRemindDays }'
);
fs.writeFileSync(routeFile, routeContent);

console.log('Settings UI updated');
