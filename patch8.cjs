const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

const target = `if (hasOnlyAccessories) {
                desc = "Orçamento de Guarda-corpos e/ou Portões avulsos.\\n";
            } else {`;

const replacement = `if (hasOnlyAccessories) {
                const hasGates = inputData.landings.some((l: any) => l.hasGate);
                const hasGuardrails = inputData.landings.some((l: any) => l.hasGuardrail && !l.hasGate);
                if (hasGates && hasGuardrails) {
                    desc = "Orçamento de Guarda-corpos e Portões avulsos.\\n";
                } else if (hasGates) {
                    desc = "Orçamento de Portões avulsos.\\n";
                } else {
                    desc = "Orçamento de Guarda-corpos avulsos.\\n";
                }
            } else {`;

c = c.replace(target, replacement);
// fallback for CRLF
c = c.replace(target.replace(/\n/g, '\r\n'), replacement);

fs.writeFileSync('src/utils.ts', c);
console.log('Fixed utils.ts dynamic text');
