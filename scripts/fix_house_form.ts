import fs from 'fs';
import path from 'path';

const houseFormPath = path.resolve('src/app/dashboard/houses/HouseForm.tsx');
let houseFormContent = fs.readFileSync(houseFormPath, 'utf-8');
if (!houseFormContent.includes('defaultBillingAmount: string | null;')) {
  houseFormContent = houseFormContent.replace(
    'export type HouseData = {',
    `export type HouseData = {\n  defaultBillingAmount: string | null;`
  );
  fs.writeFileSync(houseFormPath, houseFormContent);
}

console.log('Fixed HouseForm type');
