const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

c = c.replace(/const accPrice = acc\.price \? formatCurrencyBRL\(computeLandingPrice\(acc\)\) : 'R\$ 0,00';/g, "const accPrice = formatCurrencyBRL(computeLandingPrice(acc));");

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Fixed accPrice logic');
