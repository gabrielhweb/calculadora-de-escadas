const fs = require('fs');

let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

// 1. Fix the accessories listing
const targetAccessories = `      // Listar os acessórios avulsos (Guarda-Corpo/Portão)
      const accessories = data.selectedOption.landings.filter(l => l.isAccessoriesOnly);
      if (accessories.length > 0 && data.inputData.quoteType !== 'guardrail') {
          accessories.forEach((acc, idx) => {
              if (acc.hasGate) {
                  addText(\`-Portão \${idx + 1}: \${(acc.gateLength || 100) / 100}m (C) x \${(acc.gateHeight || 90) / 100}m (A)\`, 11, false, 'left');
              } else if (acc.hasGuardrail) {
                  addText(\`-Guarda-Corpo \${idx + 1}: \${(acc.guardrailLength || 100) / 100}m (C) x \${(acc.guardrailHeight || 90) / 100}m (A)\`, 11, false, 'left');
              }
          });
      }`;

const replacementAccessories = `      // Listar os acessórios avulsos (Guarda-Corpo/Portão)
      let accessories: any[] = [];
      if (data.inputData.quoteType === 'guardrail' && data.inputData.standaloneGuardrails) {
          accessories = data.inputData.standaloneGuardrails;
      } else if (data.selectedOption.landings) {
          accessories = data.selectedOption.landings.filter(l => l.isAccessoriesOnly);
      }

      if (accessories.length > 0) {
          accessories.forEach((acc, idx) => {
              const accPrice = acc.price ? formatCurrencyBRL(acc.price) : 'R$ 0,00';
              if (acc.hasGate) {
                  addText(\`-Portão \${idx + 1}: \${acc.gateLength || acc.length || 100}cm (C) x \${acc.gateHeight || acc.height || 90}cm (A) - Valor: \${accPrice}\`, 11, false, 'left');
              } else if (acc.hasGuardrail || data.inputData.quoteType === 'guardrail') {
                  const gLen = acc.guardrailLength || acc.length || 100;
                  const gHei = acc.guardrailHeight || acc.height || 90;
                  addText(\`-Guarda-Corpo \${idx + 1}: \${gLen}cm (C) x \${gHei}cm (A) - Valor: \${accPrice}\`, 11, false, 'left');
              }
          });
      }`;

if (c.includes(targetAccessories)) {
    c = c.replace(targetAccessories, replacementAccessories);
} else {
    c = c.replace(targetAccessories.replace(/\n/g, '\r\n'), replacementAccessories);
}

// 2. Fix the summary label
const targetSummary = `  if (data.finalLandingsPrice > 0) {
        const hasAccessories = data.selectedOption?.landings?.some(l => l.isAccessoriesOnly);
        const label = hasAccessories ? 'Valor Patamares / Acessórios (Total)' : 'Valor Patamares (Total)';
        addText(\`-\${label}: \${formatCurrencyBRL(data.finalLandingsPrice)}\`, 11, false, 'left');
    }`;

const replacementSummary = `  if (data.finalLandingsPrice > 0) {
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

if (c.includes(targetSummary)) {
    c = c.replace(targetSummary, replacementSummary);
} else {
    c = c.replace(targetSummary.replace(/\n/g, '\r\n'), replacementSummary);
}

// 3. Optional: Fix the quoteType === 'guardrail' logic where it printed "Valor Guarda-Corpos/Portões: R$ " without individual.
// Since we now print the individual accessories for quoteType === 'guardrail', the grouped value is fine!
const targetGuardrailLabel = `addText(\`-Valor Guarda-Corpos/Portões (\${lengthText}): \${formatCurrencyBRL(data.finalStairPrice)}\`, 11, false, 'left');`;
const replacementGuardrailLabel = `addText(\`-Valor Total Guarda-Corpos/Portões (\${lengthText}): \${formatCurrencyBRL(data.finalStairPrice)}\`, 11, false, 'left');`;
if (c.includes(targetGuardrailLabel)) {
    c = c.replace(targetGuardrailLabel, replacementGuardrailLabel);
} else {
    c = c.replace(targetGuardrailLabel.replace(/\n/g, '\r\n'), replacementGuardrailLabel);
}

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Fixed contractGenerator.ts completely');
