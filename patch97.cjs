const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');
c = c.replace(
    'formatCurrencyBRL(data.stairSideBarPrice)',
    'formatCurrencyBRL(data.stairSideBarPrice || 0)'
);
fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log("Fixed undefined parameter");
