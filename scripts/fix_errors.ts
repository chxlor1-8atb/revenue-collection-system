import fs from 'fs';
import path from 'path';

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\\\${/g, '${');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\\n/g, '\\n');
  fs.writeFileSync(filePath, content);
}

fixFile(path.resolve('src/app/api/cron/billing/route.ts'));
fixFile(path.resolve('src/app/api/cron/dunning/route.ts'));

// Now fix actions.ts
let actionsFile = path.resolve('src/app/dashboard/houses/actions.ts');
let actionsContent = fs.readFileSync(actionsFile, 'utf-8');
actionsContent = actionsContent.replace('import { formatThaiMonthYear } from "@/lib/utils";', `
function formatThaiMonthYear(monthYear: string) {
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length !== 2) return monthYear;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthYear;
  return \`\${thaiMonths[month]} \${year + 543}\`;
}
`);
fs.writeFileSync(actionsFile, actionsContent);

// Also need formatThaiMonthYear in billing and dunning
function addUtil(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace("import { formatThaiMonthYear } from '@/lib/utils';", `
function formatThaiMonthYear(monthYear: string) {
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length !== 2) return monthYear;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthYear;
  return \`\${thaiMonths[month]} \${year + 543}\`;
}`);
  fs.writeFileSync(filePath, content);
}

addUtil(path.resolve('src/app/api/cron/billing/route.ts'));
addUtil(path.resolve('src/app/api/cron/dunning/route.ts'));
console.log('Fixed');
