const fs = require('fs');

// 1. CountdownTimer.tsx
let code1 = fs.readFileSync('src/components/CountdownTimer.tsx', 'utf8');
code1 = code1.replace(
  'pusherClient = getPusherClient();',
  'pusherClient = await getPusherClient();'
);
code1 = code1.replace(
  'useEffect(() => {',
  'useEffect(() => {\n    const setupPusher = async () => {'
);
code1 = code1.replace(
  /return \(\) => \{[^}]*pusherClient\.unsubscribe[^}]*\};/,
  (match) => match + '\n    };\n    setupPusher();'
);
fs.writeFileSync('src/components/CountdownTimer.tsx', code1);

// 2. InvoiceSelectionForm.tsx
let code2 = fs.readFileSync('src/components/InvoiceSelectionForm.tsx', 'utf8');
code2 = code2.replace(
  'const pusher = getPusherClient();',
  'const pusher = await getPusherClient();'
);
code2 = code2.replace(
  'useEffect(() => {',
  'useEffect(() => {\n    const setupPusher = async () => {'
);
code2 = code2.replace(
  /return \(\) => \{[^}]*pusher\.unsubscribe[^}]*\};/,
  (match) => match + '\n    };\n    setupPusher();'
);
fs.writeFileSync('src/components/InvoiceSelectionForm.tsx', code2);
