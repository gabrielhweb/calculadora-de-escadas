const fs = require('fs');

let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

if (!c.includes('computeLandingPrice')) {
    c = c.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from './landingPricing';");
}

// 1. In `contractGenerator.ts`, we have the `allAccs` printing loop:
// addText(`-Guarda-Corpo ${accIdx}: ${gLength}cm (C) x ${gHeight}cm (A) - Valor: ${formatCurrencyBRL(acc.price || 0)}`, 11, false, 'left');
// We need to replace `acc.price || 0` with `computeLandingPrice(acc)`.
c = c.replace(/formatCurrencyBRL\(acc\.price \|\| 0\)/g, "formatCurrencyBRL(computeLandingPrice(acc))");
c = c.replace(/formatCurrencyBRL\(acc\.price\)/g, "formatCurrencyBRL(computeLandingPrice(acc))");

// 2. Remove the "Valor Acessórios Avulsos (Total)" block.
// The code looks like this:
// let label = 'Valor Patamares (Total)';
// if (hasAccessories && !hasRealLandings) {
//     label = 'Valor Acessórios Avulsos (Total)';
// }
// addText(`-${label}: ${formatCurrencyBRL(data.finalLandingsPrice)}`, 11, false, 'left');

const blockToReplace = `      if (data.finalLandingsPrice > 0) {
          const hasAccessories = data.selectedOption?.landings?.some(l => l.isAccessoriesOnly);
          const hasRealLandings = data.selectedOption?.landings?.some(l => !l.isAccessoriesOnly);
          let label = 'Valor Patamares (Total)';
          if (hasAccessories && !hasRealLandings) {
              label = 'Valor Acessórios Avulsos (Total)';
          } else if (hasAccessories && hasRealLandings) {
              label = 'Valor Patamares / Acessórios (Total)';
          }
          addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
      }`;

const newBlock = `      if (data.finalLandingsPrice > 0) {
          const hasAccessories = data.selectedOption?.landings?.some(l => l.isAccessoriesOnly);
          const hasRealLandings = data.selectedOption?.landings?.some(l => !l.isAccessoriesOnly);
          let label = 'Valor Patamares (Total)';
          
          if (hasAccessories && !hasRealLandings) {
              // The user asked to REMOVE the "Valor Acessórios Avulsos (Total)" line 
              // because the individual prices are already printed next to the item!
              // So we print nothing here.
          } else if (hasAccessories && hasRealLandings) {
              label = 'Valor Patamares / Acessórios (Total)';
              addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
          } else {
              addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
          }
      }`;

if (c.includes(blockToReplace)) {
    c = c.replace(blockToReplace, newBlock);
} else {
    console.log("Could not find the block to replace in contractGenerator.ts");
}

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Patched contractGenerator.ts');
