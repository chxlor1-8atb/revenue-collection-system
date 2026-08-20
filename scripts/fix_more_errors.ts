import fs from 'fs';
import path from 'path';

// 1. Fix route.ts
const routePath = path.resolve('src/app/api/settings/promptpay/route.ts');
let routeContent = fs.readFileSync(routePath, 'utf-8');
routeContent = routeContent.replace(
  'const { id, name, promptPayId } = await request.json();',
  'const { id, name, promptPayId, autoBillingDay, dueDateDays, autoRemindDays } = await request.json();'
);
fs.writeFileSync(routePath, routeContent);

// 2. Fix TopNav.tsx
const topNavPath = path.resolve('src/app/dashboard/TopNav.tsx');
let topNavContent = fs.readFileSync(topNavPath, 'utf-8');
topNavContent = topNavContent.replace(
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
fs.writeFileSync(topNavPath, topNavContent);

// 3. Fix HousesClient.tsx HouseData interface
const housesClientPath = path.resolve('src/app/dashboard/houses/HousesClient.tsx');
let housesContent = fs.readFileSync(housesClientPath, 'utf-8');
housesContent = housesContent.replace(
  'interface HouseData {',
  `interface HouseData {\n  defaultBillingAmount: string | null;`
);
fs.writeFileSync(housesClientPath, housesContent);
console.log('Fixed more errors');
