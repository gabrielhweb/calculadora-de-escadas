const fs = require('fs');

// 1. Update ProposalDocument.tsx
let pd = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');
pd = pd.replace(
    "opt.landings.forEach((landing) => {\\n                const lM =",
    "opt.landings.forEach((landing) => {\\n                if (landing.isAccessoriesOnly) {\\n                    let desc = '';\\n                    if (landing.hasGate) {\\n                         desc = `- Portãozinho Avulso de ${landing.gateLength}cm x ${landing.gateHeight}cm`;\\n                    } else {\\n                         desc = `- Guarda-Corpo Avulso (${landing.guardrailFormat || 'normal'}) com ${landing.guardrailHeight}cm alt.`;\\n                    }\\n                    const price = formatCurrencyBRL(landing.price);\\n                    const availableWidth = pageWidth - (pageMargin * 2) - 40; \\n                    const splitDesc = doc.splitTextToSize(desc, availableWidth);\\n                    doc.text(splitDesc, pageMargin, currentY);\\n                    doc.text(price, pageWidth - pageMargin, currentY, { align: 'right' });\\n                    currentY += (splitDesc.length * 5) + 1;\\n                    return;\\n                }\\n\\n                const lM ="
);

pd = pd.replace(
    "pois irregularidades podem comprometer a instalação e o perfeito funcionamento da escada.",
    "pois irregularidades podem comprometer a instalação."
);

const capStr = 'doc.text("Capacidade máxima", pageMargin, currentY);\n    currentY += 6;\n    doc.setFont(\'helvetica\', \'normal\');\n    doc.text("Por degrau: 180 kg (cento e oitenta quilogramas)", pageMargin, currentY);\n    currentY += 5;\n    doc.text("Total da escada: 360 kg (trezentos e sessenta quilogramas)", pageMargin, currentY);\n    currentY += 10;';

const newCapStr = 'if (inputData.quoteType !== \'guardrail\' && !inputData.isAdendo) {\n        doc.text("Capacidade máxima", pageMargin, currentY);\n        currentY += 6;\n        doc.setFont(\'helvetica\', \'normal\');\n        doc.text("Por degrau: 180 kg (cento e oitenta quilogramas)", pageMargin, currentY);\n        currentY += 5;\n        doc.text("Total da escada: 360 kg (trezentos e sessenta quilogramas)", pageMargin, currentY);\n        currentY += 10;\n    }';

pd = pd.replace(capStr, newCapStr);
// wait, we might have CRLF, let's use regex to replace capacity
const capRegex = /doc\.text\("Capacidade máxima", pageMargin, currentY\);[\s\S]*?currentY \+= 10;/;
pd = pd.replace(capRegex, newCapStr);

fs.writeFileSync('src/components/ProposalDocument.tsx', pd);
console.log('Fixed ProposalDocument');

let utils = fs.readFileSync('src/utils.ts', 'utf8');

const oldUtils = `        if (inputData.landings && inputData.landings.length > 0) {
            inputData.landings.forEach((landing: any) => {
                if (landing.hasGate && landing.isAccessoriesOnly) {
                    desc += \`- Portãozinho Avulso de \${landing.gateLength}cm x \${landing.gateHeight}cm.\\n\`;
                } else if (landing.hasGuardrail && landing.isAccessoriesOnly) {
                    desc += \`- Guarda-Corpo Avulso (\${landing.guardrailFormat || 'normal'}) com \${landing.guardrailHeight}cm de altura.\\n\`;
                } else {
                    desc += \`- Patamar Auxiliar (\${landing.width}x\${landing.length}cm) com base em aço carbono.\\n\`;
                    if (landing.hasGate) desc += \`  + Inclui Portãozinho \${landing.gateLength}x\${landing.gateHeight}cm.\\n\`;
                    if (landing.hasGuardrail) desc += \`  + Inclui Guarda-Corpo (\${landing.guardrailFormat || 'normal'}).\\n\`;
                }
            });
        }`;

const newUtils = `        if (inputData.landings && inputData.landings.length > 0) {
            const hasOnlyAccessories = inputData.landings.every((l: any) => l.isAccessoriesOnly);
            if (hasOnlyAccessories) {
                desc = "Orçamento de Guarda-corpos e/ou Portões avulsos.\\n";
            } else {
                inputData.landings.forEach((landing: any) => {
                    if (!landing.isAccessoriesOnly) {
                        desc += \`- Patamar Auxiliar (\${landing.width}x\${landing.length}cm) com base em aço carbono.\\n\`;
                        if (landing.hasGate) desc += \`  + Inclui Portãozinho \${landing.gateLength}x\${landing.gateHeight}cm.\\n\`;
                        if (landing.hasGuardrail) desc += \`  + Inclui Guarda-Corpo (\${landing.guardrailFormat || 'normal'}).\\n\`;
                    }
                });
            }
        }`;

utils = utils.replace(oldUtils, newUtils);
// CRLF fallback
utils = utils.replace(oldUtils.replace(/\n/g, '\r\n'), newUtils);
fs.writeFileSync('src/utils.ts', utils);
console.log('Fixed utils.ts');
