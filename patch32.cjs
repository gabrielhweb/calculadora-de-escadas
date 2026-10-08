const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

if (!c.includes('computeLandingPrice')) {
    c = c.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from './landingPricing';");
}

c = c.replace(/formatCurrencyBRL\(acc\.price \|\| 0\)/g, "formatCurrencyBRL(computeLandingPrice(acc))");
c = c.replace(/formatCurrencyBRL\(acc\.price\)/g, "formatCurrencyBRL(computeLandingPrice(acc))");

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Fixed computeLandingPrice in PDF');
