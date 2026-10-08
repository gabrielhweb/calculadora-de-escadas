const fs = require('fs');
let prodPdf = fs.readFileSync('src/utils/productionPdfGenerator.ts', 'utf8');

const regex = /export const drawProposalSummaryPage = \(doc: jsPDF, landings: any\[\], startY: number = 20\): number => \{\s*let finalY = startY;\s*landings\.forEach\(\(landing: any, index: number\) => \{[\s\S]*?finalY = startY \+ availH \+ 15;[\s\S]*?\}\);\s*return finalY;\s*\};/;

const replacement = `export const drawProposalSummaryPage = (doc: jsPDF, landings: any[], startY: number = 20): number => {
    let finalY = startY;

    // AGRUPAR ACESSÓRIOS AVULSOS
    const structuralLandings = landings.filter((l: any) => !l.isAccessoriesOnly);
    let accessories = landings.filter((l: any) => l.isAccessoriesOnly);
    
    // Processar os estruturais normalmente
    structuralLandings.forEach((landing: any, index: number) => {
        let hasG = landing.hasGuardrail;
        let hasGate = landing.hasGate;
        if (!hasG && !hasGate && !landing.length && !landing.width) return;

        const pageWidth = 210;
        let currentY = finalY;

        if (currentY + 90 > 280) {
            doc.addPage('a4', 'p');
            currentY = 20;
        } else {
            currentY += 10;
        }
        
        let availH = Math.min(140, 280 - currentY - 20);
        const patamarImgH = Math.min(60, availH - 25);

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

        const rightX = 105;
        const rightW = 95;

        if (hasG || hasGate) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            let titleText = 'Guarda-Corpo e Portão';
            if (hasG && !hasGate) titleText = 'Guarda-Corpo';
            if (!hasG && hasGate) titleText = 'Portão';
            doc.text(titleText, rightX + rightW / 2, currentY, { align: 'center' });
        }

        const pieces: any[] = [];
        if (hasG) {
            const format = landing.guardrailFormat || 'straight';
            const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
            for (let i = 1; i <= numSides; i++) {
                let gL = 0;
                let gBarsOverride;
                if (i===1) { gL = landing.guardrailLength || 0; gBarsOverride = landing.guardrailBarsOverride; }
                else if (i===2) { gL = landing.guardrailLength2 || 0; gBarsOverride = landing.guardrailBarsOverride2; }
                else if (i===3) { gL = landing.guardrailLength3 || 0; gBarsOverride = landing.guardrailBarsOverride3; }
                
                let isFixed = false;
                if (landing.guardrailFixedToLanding) {
                    isFixed = numSides === 1 ? true : (landing.guardrailFixedSides || []).includes(i);
                }
                const gH = landing.guardrailHeight || 90;
                const outerH = isFixed ? gH + 10 : gH;
                const innerH = gH - 13;
                
                let title = \`Lado \${i}\`;
                if (numSides === 1) {
                    title = landing.guardrailSide ? \`G.C. (\${landing.guardrailSide})\` : 'Guarda-Corpo';
                } else if (numSides === 2) {
                    if (landing.guardrailSide?.toLowerCase().includes('esquerdo')) {
                        title = i === 1 ? 'G.C. (Esquerdo)' : 'G.C. (Frontal)';
                    } else if (landing.guardrailSide?.toLowerCase().includes('direito')) {
                        title = i === 1 ? 'G.C. (Direito)' : 'G.C. (Frontal)';
                    } else {
                        title = i === 1 ? 'G.C. (Lateral)' : 'G.C. (Frontal)';
                    }
                } else if (numSides === 3) {
                    if (i === 1) title = 'G.C. (Esquerdo)';
                    else if (i === 2) title = 'G.C. (Frontal)';
                    else if (i === 3) title = 'G.C. (Direito)';
                }
                
                title = \`Imagem \${pieces.length + 1}: \${title}\`;
                if (isFixed) title += ' (Fixo)';
                
                pieces.push({ type: 'guardrail', title, length: gL, outerH, innerH, isFixed, override: gBarsOverride });
            }
        }
        if (hasGate) {
            pieces.push({ type: 'gate', title: \`Imagem \${pieces.length + 1}: Portão\`, length: landing.gateLength || 100, outerH: landing.gateHeight || 90, innerH: (landing.gateHeight || 90) - 13, override: landing.gateBarsOverride });
        }

        const totalPieces = pieces.length;
        const bboxes: any[] = [];
        
        const startX = rightX;
        const startY = currentY + 6;
        const availW = rightW;

        if (totalPieces === 1) {
            bboxes.push({ x: startX, y: startY, w: availW, h: availH });
        } else if (totalPieces === 2) {
            const h = availH / 2;
            bboxes.push({ x: startX, y: startY, w: availW, h: h });
            bboxes.push({ x: startX, y: startY + h, w: availW, h: h });
            doc.setDrawColor(200); doc.line(startX + 10, startY + h, startX + availW - 10, startY + h);
        } else if (totalPieces === 3) {
            const w2 = availW / 2;
            const h = availH / 2;
            bboxes.push({ x: startX, y: startY, w: w2, h: h });
            bboxes.push({ x: startX + w2, y: startY, w: w2, h: h });
            bboxes.push({ x: startX, y: startY + h, w: availW, h: h });
            doc.setDrawColor(200); 
            doc.line(startX + 10, startY + h, startX + availW - 10, startY + h); 
            doc.line(startX + w2, startY + 5, startX + w2, startY + h - 5); 
        } else if (totalPieces >= 4) {
            const w = availW / 2;
            const h = availH / 2;
            bboxes.push({ x: startX, y: startY, w: w, h: h });
            bboxes.push({ x: startX + w, y: startY, w: w, h: h });
            bboxes.push({ x: startX, y: startY + h, w: w, h: h });
            bboxes.push({ x: startX + w, y: startY + h, w: w, h: h });
            doc.setDrawColor(200); 
            doc.line(startX + 10, startY + h, startX + availW - 10, startY + h);
            doc.line(startX + w, startY + 5, startX + w, startY + availH - 5);
        }

        finalY = startY + availH + 15;

        pieces.forEach((p, idx) => {
            const box = bboxes[idx];
            if (!box) return;
            const padding = 10;
            const maxW = box.w - padding * 2;
            const maxH = box.h - 32;
            const scale = Math.min(maxW / Math.max(p.length, 50), maxH / Math.max(p.outerH, 50));
            const drawW = p.length * scale;
            const drawH = p.outerH * scale;

            const px = box.x + (box.w - drawW) / 2;
            const py = box.y + 18 + (maxH - drawH) / 2;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0,0,0);
            doc.text(p.title, box.x + box.w / 2, py - 10, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(\`\${p.length}cm (C) x \${p.outerH}cm (A)\`, box.x + box.w / 2, py - 6, { align: 'center' });

            doc.setDrawColor(40, 50, 60);
            doc.setLineWidth(1.5);
            doc.rect(px, py, drawW, drawH);
            
            const numBars = p.override > 0 ? p.override : Math.max(1, Math.floor(p.length / 15));
            const spacing = drawW / (numBars + 1);
            doc.setLineWidth(0.8);
            for (let b = 1; b <= numBars; b++) {
                const bx = px + b * spacing;
                doc.line(bx, py, bx, py + drawH);
            }
        });
    });

    // ----------------------------------------------------
    // PROCESSAR ACESSÓRIOS AVULSOS (Agrupados lado a lado)
    // ----------------------------------------------------
    if (accessories.length > 0) {
        let currentY = finalY;
        const availH = 80; // Altura fixa reduzida para avulsos

        // Dividir acessórios em pares para colocar lado a lado
        for (let i = 0; i < accessories.length; i += 2) {
            if (currentY + availH + 20 > 280) {
                doc.addPage('a4', 'p');
                currentY = 20;
            } else {
                currentY += 10;
            }

            const acc1 = accessories[i];
            const acc2 = accessories[i + 1]; // Pode ser undefined

            const drawAcc = (acc: any, box: any) => {
                const isGate = acc.hasGate;
                const format = acc.guardrailFormat || 'straight';
                const titleText = isGate ? 'Portão' : 'Guarda-Corpo';

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(titleText, box.x + box.w / 2, box.y, { align: 'center' });

                const gL = isGate ? acc.gateLength || 100 : acc.guardrailLength || 0;
                const gH = isGate ? acc.gateHeight || 90 : acc.guardrailHeight || 90;
                const gBars = isGate ? acc.gateBarsOverride : acc.guardrailBarsOverride;
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(\`\${gL}cm (C) x \${gH}cm (A)\`, box.x + box.w / 2, box.y + 4, { align: 'center' });

                const padding = 10;
                const maxW = box.w - padding * 2;
                const maxH = box.h - 20;

                const scale = Math.min(maxW / Math.max(gL, 50), maxH / Math.max(gH, 50));
                const drawW = gL * scale;
                const drawH = gH * scale;

                const px = box.x + (box.w - drawW) / 2;
                const py = box.y + 12 + (maxH - drawH) / 2;

                doc.setDrawColor(40, 50, 60);
                doc.setLineWidth(1.5);
                doc.rect(px, py, drawW, drawH);
                
                const numBars = gBars > 0 ? gBars : Math.max(1, Math.floor(gL / 15));
                const spacing = drawW / (numBars + 1);
                doc.setLineWidth(0.8);
                for (let b = 1; b <= numBars; b++) {
                    const bx = px + b * spacing;
                    doc.line(bx, py, bx, py + drawH);
                }
            };

            const fullW = 190;
            if (acc2) {
                // Tem dois, desenha lado a lado
                drawAcc(acc1, { x: 10, y: currentY, w: 95, h: availH });
                drawAcc(acc2, { x: 105, y: currentY, w: 95, h: availH });
            } else {
                // Tem só um, desenha no meio, mas com largura máxima controlada
                drawAcc(acc1, { x: 10 + fullW / 4, y: currentY, w: fullW / 2, h: availH });
            }

            currentY += availH + 10;
        }
        finalY = currentY;
    }

    return finalY;
};`;

if (prodPdf.match(regex)) {
    prodPdf = prodPdf.replace(regex, replacement);
    fs.writeFileSync('src/utils/productionPdfGenerator.ts', prodPdf);
    console.log('Regex applied properly for grouping!');
} else {
    console.log('Regex failed');
}
