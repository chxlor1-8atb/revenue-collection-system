const fs = require('fs');
const path = require('path');
function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.match(/\/house\/\$\{/)) {
                content = content.replace(/\/house\/\$\{([^}]+)\}/g, '/house/${encodeSecureId($1)}');
                if (!content.includes('import { encodeSecureId }')) {
                    content = 'import { encodeSecureId } from "@/lib/secureId";\n' + content;
                }
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + fullPath);
            }
        }
    }
}
processDir('src/app/dashboard');
