const fs = require('fs');

let c = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');

const targetSoma = `        // Patamares
        if (opt.landings.length > 0) {
            // Se tiver múltiplos, mostra a soma primeiro, alinhada à direita
            if (opt.landings.length > 1) {
                // Mantém um pequeno recuo visual apenas se for um grupo, mas alinhado corretamente
                doc.text(\`  • Soma de \${opt.landings.length} Patamares:\`, pageMargin, currentY);
                doc.text(formatCurrencyBRL(landingsPrice), pageWidth - pageMargin, currentY, { align: 'right' });
                currentY += 6;
            }`;

const replacementSoma = `        // Patamares e Acessórios
        if (opt.landings.length > 0) {
            // Se tiver múltiplos, mostra a soma primeiro, alinhada à direita
            if (opt.landings.length > 1) {
                const hasReal = opt.landings.some((l:any) => !l.isAccessoriesOnly);
                const hasAcc = opt.landings.some((l:any) => l.isAccessoriesOnly);
                let labelSoma = \`  • Soma de \${opt.landings.length} Patamares:\`;
                if (!hasReal && hasAcc) {
                    labelSoma = \`  • Soma de \${opt.landings.length} Acessórios/Guarda-corpos:\`;
                } else if (hasReal && hasAcc) {
                    labelSoma = \`  • Soma de \${opt.landings.length} Itens (Patamares e Acessórios):\`;
                }
                
                doc.text(labelSoma, pageMargin, currentY);
                doc.text(formatCurrencyBRL(landingsPrice), pageWidth - pageMargin, currentY, { align: 'right' });
                currentY += 6;
            }`;

if (c.includes(targetSoma)) {
    c = c.replace(targetSoma, replacementSoma);
} else {
    c = c.replace(targetSoma.replace(/\n/g, '\r\n'), replacementSoma);
}

fs.writeFileSync('src/components/ProposalDocument.tsx', c);
console.log('Fixed ProposalDocument.tsx soma');
