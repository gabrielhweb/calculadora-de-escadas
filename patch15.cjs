const fs = require('fs');

let c = fs.readFileSync('src/utils/technicalPdfGenerator.ts', 'utf8');

c = c.replace(/const landings = inputData\.landings \|\| \[\];/g, "const landings = (inputData.landings || []).filter(l => !l.isAccessoriesOnly);");

fs.writeFileSync('src/utils/technicalPdfGenerator.ts', c);
console.log('Fixed technicalPdfGenerator.ts');
