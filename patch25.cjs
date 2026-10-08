const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from '../utils/landingPricing';");

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed import');
