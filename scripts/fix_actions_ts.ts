import fs from 'fs';
import path from 'path';

const actionsFile = path.resolve('src/app/dashboard/houses/actions.ts');
let content = fs.readFileSync(actionsFile, 'utf-8');

content = content.replace(
  'import { generatePayload } from "promptpay-qr";',
  'const generatePayload = require("promptpay-qr");'
);

fs.writeFileSync(actionsFile, content);
console.log('Fixed');
