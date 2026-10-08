const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const oldBlock = `    if (data.finalLandingsPrice > 0) {
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

// Since tabs and spaces might differ, I will use regex that matches the start and end tokens exactly
const regex = /if\s*\(data\.finalLandingsPrice\s*>\s*0\)\s*\{[\s\S]*?addText\(\`-\$\{label\}:[^\n]*\n\s*\}/;

const match = c.match(regex);
if (match) {
    const newBlock = `if (data.finalLandingsPrice > 0) {
        const hasAccessories = data.selectedOption?.landings?.some((l: any) => l.isAccessoriesOnly);
        const hasRealLandings = data.selectedOption?.landings?.some((l: any) => !l.isAccessoriesOnly);
        let label = 'Valor Patamares (Total)';
        if (hasAccessories && !hasRealLandings) {
            // Do not print total for accessories, user requested it only inline
        } else if (hasAccessories && hasRealLandings) {
            label = 'Valor Patamares / Acessórios (Total)';
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        } else {
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        }
    }`;
    c = c.replace(regex, newBlock);
    fs.writeFileSync('src/utils/contractGenerator.ts', c);
    console.log("Successfully replaced block!");
} else {
    console.log("Regex did not match!");
}
