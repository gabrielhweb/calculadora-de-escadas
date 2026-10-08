const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

c = c.replace(/if \(data\.finalLandingsPrice > 0\) \{[\s\S]*?addText\(\`-\$\{label\}: \$\{formatCurrencyBRL\(data\.finalLandingsPrice\)\}\`, 11, false, 'left'\);\n      \}/, `if (data.finalLandingsPrice > 0) {
        const hasAccessories = data.selectedOption?.landings?.some(l => l.isAccessoriesOnly);
        const hasRealLandings = data.selectedOption?.landings?.some(l => !l.isAccessoriesOnly);
        let label = 'Valor Patamares (Total)';
        
        if (hasAccessories && !hasRealLandings) {
            // Ocultado a pedido do usuário
        } else if (hasAccessories && hasRealLandings) {
            label = 'Valor Patamares / Acessórios (Total)';
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        } else {
            addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
        }
    }`);

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Fixed block');
