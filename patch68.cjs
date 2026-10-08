const fs = require('fs');

// 1. Fix ProposalDocument.tsx page break threshold
let pd = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');
pd = pd.replace('if (currentY > 200) { doc.addPage(); currentY = 20; }', 'if (currentY > 150) { doc.addPage(); currentY = 20; }');
fs.writeFileSync('src/components/ProposalDocument.tsx', pd);
console.log('Fixed ProposalDocument page break threshold');

// 2. Fix productionPdfGenerator.ts huge drawing size
let prodPdf = fs.readFileSync('src/utils/productionPdfGenerator.ts', 'utf8');

// Replace availH for accessories only to save vertical space
const targetAvailH = `let availH = Math.min(140, 280 - currentY - 20);`;
const replaceAvailH = `let availH = landing.isAccessoriesOnly ? Math.min(75, 280 - currentY - 20) : Math.min(140, 280 - currentY - 20);`;
prodPdf = prodPdf.replace(targetAvailH, replaceAvailH);

// Also we want to allow pieces to be drawn side-by-side if there's only 2 pieces and they are accessoriesOnly!
const targetBboxes = `if (totalPieces === 1) {
            bboxes.push({ x: startX, y: startY, w: availW, h: availH });
        } else if (totalPieces === 2) {
            const h = availH / 2;
            bboxes.push({ x: startX, y: startY, w: availW, h: h });
            bboxes.push({ x: startX, y: startY + h, w: availW, h: h });
            doc.setDrawColor(200); doc.line(startX + 10, startY + h, startX + availW - 10, startY + h);`;

const replaceBboxes = `if (totalPieces === 1) {
            bboxes.push({ x: startX, y: startY, w: availW, h: availH });
        } else if (totalPieces === 2) {
            if (landing.isAccessoriesOnly) {
                // Se for avulso, desenha lado a lado para economizar espaço
                const w2 = availW / 2;
                bboxes.push({ x: startX, y: startY, w: w2, h: availH });
                bboxes.push({ x: startX + w2, y: startY, w: w2, h: availH });
                doc.setDrawColor(200); doc.line(startX + w2, startY + 5, startX + w2, startY + availH - 5);
            } else {
                const h = availH / 2;
                bboxes.push({ x: startX, y: startY, w: availW, h: h });
                bboxes.push({ x: startX, y: startY + h, w: availW, h: h });
                doc.setDrawColor(200); doc.line(startX + 10, startY + h, startX + availW - 10, startY + h);
            }
        `;

if (prodPdf.includes(targetBboxes)) {
    prodPdf = prodPdf.replace(targetBboxes, replaceBboxes);
}

// Reduce scale max for a single piece if it's accessories only so it doesn't get huge
const targetScale = `const scale = Math.min(maxW / Math.max(p.length, 50), maxH / Math.max(p.outerH, 50));`;
const replaceScale = `// Se for peça isolada avulsa, limita a largura pra não ficar um desenho gigantesco na página inteira
            let finalMaxW = maxW;
            if (landing.isAccessoriesOnly && totalPieces === 1) finalMaxW = Math.min(maxW, 90);
            const scale = Math.min(finalMaxW / Math.max(p.length, 50), maxH / Math.max(p.outerH, 50));`;

prodPdf = prodPdf.replace(targetScale, replaceScale);

fs.writeFileSync('src/utils/productionPdfGenerator.ts', prodPdf);
console.log('Fixed productionPdfGenerator drawing size');
