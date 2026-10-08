const fs = require('fs');
let l = fs.readFileSync('src/utils/landingPricing.ts', 'utf8');

const regexL = /const area = \(num\(l\.length, 0\) \* num\(l\.width, 0\)\) \/ 1000;\s*const computedChapa = Math\.round\(area \* num\(l\.weightPerSqm, 29\)\);/;

const replaceL = `const length = num(l.length, 0) + 20;
    const width = num(l.width, 0) + 20;
    const area = (length / 100) * (width / 100);
    const weightKg = area * 0.00334 * 7850;
    const computedChapa = Math.round(weightKg * num(l.weightPerSqm, 29));`;

l = l.replace(regexL, replaceL);
fs.writeFileSync('src/utils/landingPricing.ts', l);
console.log('Fixed landingPricing with regex');
