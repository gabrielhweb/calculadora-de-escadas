const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const s1 = c.indexOf('// --- LÓGICA DE PATAMARES ---');
const block = c.substring(c.indexOf('<div className="flex gap-4 items-center bg-gray-100', s1), c.indexOf('// --- SEÇÃO G.C.', s1));
fs.writeFileSync('dump.txt', block);
console.log('Dumped to dump.txt');
