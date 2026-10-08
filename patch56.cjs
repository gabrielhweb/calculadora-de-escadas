const fs = require('fs');
let cg = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

cg = cg.replace(/Patamar \$\{patamarIdx\}/g, 'Patamar');

fs.writeFileSync('src/utils/contractGenerator.ts', cg);
console.log('Removed Patamar numbers');
