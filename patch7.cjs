const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');

const target = "            opt.landings.forEach((landing) => {\\n                const lM = (landing.length / 100).toFixed(2).replace('.', ',');";
const replacement = `            opt.landings.forEach((landing) => {
                if (landing.isAccessoriesOnly) {
                    let desc = '';
                    if (landing.hasGate) {
                         desc = \`- Portãozinho Avulso de \${landing.gateLength}cm x \${landing.gateHeight}cm\`;
                    } else {
                         desc = \`- Guarda-Corpo Avulso (\${landing.guardrailFormat || 'normal'}) com \${landing.guardrailHeight}cm alt.\`;
                    }
                    const price = formatCurrencyBRL(landing.price);
                    const availableWidth = pageWidth - (pageMargin * 2) - 40; 
                    const splitDesc = doc.splitTextToSize(desc, availableWidth);
                    doc.text(splitDesc, pageMargin, currentY);
                    doc.text(price, pageWidth - pageMargin, currentY, { align: 'right' });
                    currentY += (splitDesc.length * 5) + 1;
                    return;
                }

                const lM = (landing.length / 100).toFixed(2).replace('.', ',');`;

c = c.replace("opt.landings.forEach((landing) => {\n                const lM = (landing.length / 100).toFixed(2).replace('.', ',');", replacement);

// Fallback for CRLF
c = c.replace("opt.landings.forEach((landing) => {\r\n                const lM = (landing.length / 100).toFixed(2).replace('.', ',');", replacement);

fs.writeFileSync('src/components/ProposalDocument.tsx', c);
console.log('Fixed ProposalDocument');
