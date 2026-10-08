const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const s1 = c.indexOf('if (data.finalLandingsPrice > 0) {');
const e1 = c.indexOf('}', s1 + 100);

if (s1 !== -1 && e1 !== -1) {
    const newBlock = `if (data.finalLandingsPrice > 0) {
        const hasAccessories = data.selectedOption?.landings?.some((l: any) => l.isAccessoriesOnly);
        const hasRealLandings = data.selectedOption?.landings?.some((l: any) => !l.isAccessoriesOnly);
        let label = 'Valor Patamares (Total)';
        
        if (hasAccessories && !hasRealLandings) {
            // Omitido conforme pedido
        } else if (hasAccessories && hasRealLandings) {
            label = 'Valor Patamares / Acessórios (Total)';
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        } else {
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        }`;
    
    c = c.substring(0, s1) + newBlock + c.substring(e1);
    fs.writeFileSync('src/utils/contractGenerator.ts', c);
    console.log('Successfully patched contractGenerator.ts block');
} else {
    console.log('Indices not found!');
}
