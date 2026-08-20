import fs from 'fs';
import path from 'path';

// Fix HousesClient.tsx
const housesClientPath = path.resolve('src/app/dashboard/houses/HousesClient.tsx');
let housesContent = fs.readFileSync(housesClientPath, 'utf-8');
if (!housesContent.includes('defaultBillingAmount: string | null;')) {
  housesContent = housesContent.replace(
    'interface HouseData {',
    `interface HouseData {\n  defaultBillingAmount: string | null;`
  );
  fs.writeFileSync(housesClientPath, housesContent);
}

// Fix TopNav.tsx
const topNavPath = path.resolve('src/app/dashboard/TopNav.tsx');
let topNavContent = fs.readFileSync(topNavPath, 'utf-8');
topNavContent = topNavContent.replace(
  'initialPromptPay={settings?.promptPayId || "เบอร์พร้อมเพย์"}',
  `initialPromptPay={settings?.promptPayId || "เบอร์พร้อมเพย์"}
                  initialAutoBillingDay={settings?.autoBillingDay || null}
                  initialDueDateDays={settings?.dueDateDays || null}
                  initialAutoRemindDays={settings?.autoRemindDays || null}`
);
fs.writeFileSync(topNavPath, topNavContent);

console.log('Fixed TopNav and HousesClient interface');
