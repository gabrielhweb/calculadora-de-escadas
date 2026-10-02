const fs = require('fs');
let c = fs.readFileSync('src/utils/productionPdfGenerator.ts', 'utf8');

const targetStr = `        // LADO ESQUERDO: Patamar
        const leftX = 10;
        const leftW = 90;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(\`Patamar \${index + 1}\`, leftX + leftW / 2, currentY, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(\`Medidas: \${landing.width || 0}cm x \${landing.length || 0}cm\`, leftX + leftW / 2, currentY + 6, { align: 'center' });
        
        const maxPatamarW = leftW - 10;
        try {
            doc.addImage(patamarGenericoBase64, 'JPEG', leftX + leftW / 2 - maxPatamarW / 2, currentY + 12, maxPatamarW, patamarImgH);
        } catch(e) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(leftX + leftW / 2 - maxPatamarW / 2, currentY + 12, maxPatamarW, patamarImgH);
            doc.setTextColor(150, 150, 150);
            doc.text("IMAGEM", leftX + leftW / 2, currentY + 12 + patamarImgH / 2, { align: 'center' });
        }`;

const replacementStr = `        if (!landing.isAccessoriesOnly) {
            // LADO ESQUERDO: Patamar
            const leftX = 10;
            const leftW = 90;
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(\`Patamar \${index + 1}\`, leftX + leftW / 2, currentY, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(\`Medidas: \${landing.width || 0}cm x \${landing.length || 0}cm\`, leftX + leftW / 2, currentY + 6, { align: 'center' });
            
            const maxPatamarW = leftW - 10;
            try {
                doc.addImage(patamarGenericoBase64, 'JPEG', leftX + leftW / 2 - maxPatamarW / 2, currentY + 12, maxPatamarW, patamarImgH);
            } catch(e) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.rect(leftX + leftW / 2 - maxPatamarW / 2, currentY + 12, maxPatamarW, patamarImgH);
                doc.setTextColor(150, 150, 150);
                doc.text("IMAGEM", leftX + leftW / 2, currentY + 12 + patamarImgH / 2, { align: 'center' });
            }
        }`;

c = c.replace(targetStr, replacementStr);
// fallback for CRLF
c = c.replace(targetStr.replace(/\n/g, '\r\n'), replacementStr);

fs.writeFileSync('src/utils/productionPdfGenerator.ts', c);
console.log('Fixed productionPdfGenerator.ts Patamar hiding');
