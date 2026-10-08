const fs = require('fs');
let prodPdf = fs.readFileSync('src/utils/productionPdfGenerator.ts', 'utf8');

const regex = /if\s*\(totalPieces === 1\)\s*\{\s*bboxes\.push\(\{ x: startX, y: startY, w: availW, h: availH \}\);\s*\}\s*else if\s*\(totalPieces === 2\)\s*\{\s*const h = availH \/ 2;\s*bboxes\.push\(\{ x: startX, y: startY, w: availW, h: h \}\);\s*bboxes\.push\(\{ x: startX, y: startY \+ h, w: availW, h: h \}\);\s*doc\.setDrawColor\(200\);\s*doc\.line\(startX \+ 10, startY \+ h, startX \+ availW - 10, startY \+ h\);\s*\}/;

const replaceBboxes = `if (totalPieces === 1) {
            bboxes.push({ x: startX, y: startY, w: availW, h: availH });
        } else if (totalPieces === 2) {
            if (landing.isAccessoriesOnly) {
                // Desenha lado a lado
                const w2 = availW / 2;
                bboxes.push({ x: startX, y: startY, w: w2, h: availH });
                bboxes.push({ x: startX + w2, y: startY, w: w2, h: availH });
                doc.setDrawColor(200); 
                doc.line(startX + w2, startY + 5, startX + w2, startY + availH - 5);
            } else {
                const h = availH / 2;
                bboxes.push({ x: startX, y: startY, w: availW, h: h });
                bboxes.push({ x: startX, y: startY + h, w: availW, h: h });
                doc.setDrawColor(200); 
                doc.line(startX + 10, startY + h, startX + availW - 10, startY + h);
            }
        }`;

if (prodPdf.match(regex)) {
    prodPdf = prodPdf.replace(regex, replaceBboxes);
    fs.writeFileSync('src/utils/productionPdfGenerator.ts', prodPdf);
    console.log('Regex applied!');
} else {
    console.log('Regex failed');
}
