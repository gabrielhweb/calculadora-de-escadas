const fs = require('fs');
let c = fs.readFileSync('src/utils/fixDatabase.ts', 'utf16le');
if (!c.includes('export const fixAllContractsAndQueue')) {
    c = fs.readFileSync('src/utils/fixDatabase.ts', 'utf8');
}
c = c.replace(/""/g, '"');
fs.writeFileSync('src/utils/fixDatabase.ts', c, 'utf8');
