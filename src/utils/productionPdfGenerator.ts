import jsPDF from 'jspdf';
import { lisaEsquerdaBase64, lisaDireitaBase64, vazadaEsquerdaBase64, vazadaDireitaBase64 } from './cleanImages';

export interface ProductionPdfProps {
    totalSteps: number;
    stepHeightCm: number;
    treadDepthCm: number;
    widthCm: number;
    cutStepType: 'left' | 'right' | 'hollow_left' | 'hollow_right';
    clientName: string;
    landings?: any[];
    wallFixation?: 'left' | 'right' | 'frontal';
}

export const drawProductionPage = (doc: jsPDF, props: ProductionPdfProps) => {
    const { totalSteps, stepHeightCm, treadDepthCm, widthCm, cutStepType, clientName, landings } = props;

    const numSteps = totalSteps - (landings?.length || 0);

    const treadDepthMm = treadDepthCm > 100 ? Math.round(treadDepthCm) : Math.round(treadDepthCm * 10);
    const stepHeightMm = stepHeightCm > 100 ? Math.round(stepHeightCm) : Math.round(stepHeightCm * 10);
    const widthMm = widthCm > 200 ? Math.round(widthCm) : Math.round(widthCm * 10);
    const uShapeWidthMm = treadDepthMm;
    const isHollow = cutStepType.startsWith('hollow');

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    const safeClientName = clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO';
    const splitName = doc.splitTextToSize(safeClientName, 120);
    doc.text(splitName, 10, 20);
    
    const nameHeightOffset = (splitName.length - 1) * 8;
    
    // Título do corte
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 0, 0); 
    
    let cutText = '';
    let selectedImage = lisaEsquerdaBase64;
    
    if (cutStepType === 'left') {
        cutText = 'FUROS LADO ESQUERDO';
        selectedImage = lisaEsquerdaBase64; 
    } else if (cutStepType === 'right') {
        cutText = 'FUROS LADO DIREITO';
        selectedImage = lisaDireitaBase64;
    } else if (cutStepType === 'hollow_left') {
        cutText = 'FUROS LADO ESQUERDO (VAZADO)';
        selectedImage = vazadaEsquerdaBase64;
    } else if (cutStepType === 'hollow_right') {
        cutText = 'FUROS LADO DIREITO (VAZADO)';
        selectedImage = vazadaDireitaBase64;
    }
    
    doc.text(cutText, 10, 30 + nameHeightOffset); 

    // Inserir a Imagem Limpa de Fundo
    const imgX = 5;
    const imgY = 40;
    const imgProps = doc.getImageProperties(selectedImage);
    const imgRatio = imgProps.width / imgProps.height;
    
    let finalW = 285;
    let finalH = finalW / imgRatio;
    
    if (finalH > 150) {
        finalH = 150;
        finalW = finalH * imgRatio;
    }
    
    doc.addImage(selectedImage, 'JPEG', imgX, imgY, finalW, finalH);

    // TEXTOS DINÂMICOS
    doc.setTextColor(0, 0, 0);
    
    // Topo (Quantidade de degraus) - ACIMA DA IMAGEM PARA NÃO SOBREPOR
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('QUANTIDADE DE DEGRAUS:', 150, 28, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${numSteps}`, 150, 34, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('ESPESSURA 1/8"', 150, 39, { align: 'center' });
    
    // Lado Esquerdo (pisada na seta azul e altura na seta rosa) - posicionados junto ao corte do degrau na viga
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const pisadaText = 'pisada';
    doc.text(pisadaText, 88, 86);
    const pisadaWidth = doc.getTextWidth(pisadaText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const displayPisada = treadDepthMm + 10; // Sempre 10mm a mais que o contrato
    doc.text(`${displayPisada}mm`, 88 + pisadaWidth + 2, 86);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const alturaText = 'altura';
    doc.text(alturaText, 107, 108);
    const alturaWidth = doc.getTextWidth(alturaText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${stepHeightMm}mm`, 107 + alturaWidth + 2, 108);
    
    // Lado Direito
    if (!isHollow) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(`${uShapeWidthMm}mm`, 245, 55, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('PISADA', 245, 63, { align: 'center' });
        doc.text('DEGRAU', 245, 68, { align: 'center' });
        
        // Info Quantidade, Comprimento, Espessura
        const infoX = 220;
        const infoY = 115;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`QUANTIDADE:`, infoX, infoY);
        const qW = doc.getTextWidth(`QUANTIDADE:`);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalSteps}`, infoX + qW + 2, infoY);

        doc.text(`COMPRIMENTO:`, infoX, infoY + 10);
        const cW = doc.getTextWidth(`COMPRIMENTO:`);
        doc.setFont('helvetica', 'bold');
        doc.text(`${widthMm}mm`, infoX + cW + 2, infoY + 10);

        doc.setFont('helvetica', 'normal');
        doc.text(`ESPESSURA:`, infoX, infoY + 20);
        const eW = doc.getTextWidth(`ESPESSURA:`);
        doc.setFont('helvetica', 'bold');
        doc.text(`2,65mm`, infoX + eW + 2, infoY + 20);

    } else {
        // Comprimento na lateral inclinada esquerda da caixa 3D (onde o cliente indicou)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${widthMm}mm`, 210, 75, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('comprimento', 210, 80, { align: 'center' });

        // Pisada/largura no topo da caixa
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${treadDepthMm}mm`, 255, 48, { align: 'center' }); // Sempre igual ao contrato
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('largura', 255, 53, { align: 'center' });
        
        const infoX = 220;
        const infoY = 120;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`QUANTIDADE:`, infoX, infoY);
        const qW = doc.getTextWidth(`QUANTIDADE:`);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${totalSteps}`, infoX + qW + 2, infoY + 1);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`COMPRIMENTO:`, infoX, infoY + 8);
        const cW = doc.getTextWidth(`COMPRIMENTO:`);
        doc.setFont('helvetica', 'bold');
        doc.text(`${widthMm}mm`, infoX + cW + 2, infoY + 8);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`ESPESSURA 3,00mm (DOBRA 25mm)`, infoX, infoY + 16);
    }
};

import { patamarBase64 } from './patamarBase64';
import { patamarArticuladoBase64 } from './patamarArticuladoBase64';

export const drawLandingsPage = (doc: jsPDF, landings: any[], clientName: string, totalSteps?: number, wallFixation?: string) => {
    landings.forEach((landing, index) => {
        doc.addPage('a4', 'l');

        // Cabeçalho
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);
        const safeClientName = clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO';
        const splitName = doc.splitTextToSize(safeClientName, 120);
        doc.text(splitName, 10, 20);
        
        const nameLines = splitName.length;
        const nameHeightOffset = (nameLines - 1) * 10;
        
        doc.setFontSize(14);
        doc.setTextColor(255, 0, 0);
        let typeStr = '';
        if (landing.type === 'fixed') typeStr = ' (FIXO)';
        else if (landing.type === 'articulated') typeStr = ' (ARTICULADO)';
        
        doc.text(`FICHA DE PRODUÇÃO - PATAMAR ${index + 1}${typeStr}`, 10, 30 + nameHeightOffset); 

        // Indicação do lado da parede
        if (wallFixation) {
            let wallText = '';
            if (wallFixation === 'left') wallText = 'PAREDE LADO ESQUERDO (E)';
            else if (wallFixation === 'right') wallText = 'PAREDE LADO DIREITO (D)';
            else if (wallFixation === 'frontal') wallText = 'PAREDE FRONTAL';

            if (wallText) {
                doc.setFontSize(16);
                doc.setTextColor(255, 0, 0); // Mantém em vermelho para destaque igual à ficha principal
                doc.text(wallText, 287, 30 + nameHeightOffset, { align: 'right' });
            }
        } 

        const isArticulated = landing.type === 'articulated';
        const currentImage = isArticulated ? patamarArticuladoBase64 : patamarBase64;

        // Inserir a Imagem do Patamar limpa e centralizada
        const imgProps = doc.getImageProperties(currentImage);
        const imgRatio = imgProps.width / imgProps.height;
        
        // Tamanho e posicionamento centralizado
        let finalW = isArticulated ? 260 : 200;
        let finalH = finalW / imgRatio;
        
        // Limitar altura para caber na página A4 deitada (altura máxima 210mm, margem ~150mm)
        if (finalH > 150) {
            finalH = 150;
            finalW = finalH * imgRatio;
        }
        
        const imgX = (297 - finalW) / 2; // Centro da página
        const imgY = isArticulated ? 40 : 55;
        
        doc.addImage(currentImage, 'PNG', imgX, imgY, finalW, finalH);

        doc.setTextColor(0, 0, 0);
        
        // Medidas em Milímetros
        const lenMm = landing.length ? landing.length * 10 : 0;
        const widMm = landing.width ? landing.width * 10 : 0;
        const widM = landing.width ? (landing.width / 100).toFixed(2).replace('.', ',') : '0';
        const lenM = landing.length ? (landing.length / 100).toFixed(2).replace('.', ',') : '0';
        
        if (isArticulated) {
            // Textos para o Patamar Articulado (imagem lateral da escada)
            
            // LARGURA ESCADA (canto superior direito) - Posicionado para não cruzar
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`${widMm}mm`, imgX + finalW - 15, imgY + (finalH * 0.23), { align: 'right' });
            
            // PISANTE MAIOR (abaixo da largura) - Posicionado para não cruzar
            doc.text(`${lenMm}mm`, imgX + finalW - 15, imgY + (finalH * 0.33), { align: 'right' });

            // Observação ilustrativa (canto superior esquerdo, espaço em branco)
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38); // Vermelho escuro para destacar
            doc.text('OBS: QUANTIDADE DE DEGRAUS ILUSTRATIVA', imgX + 5, imgY + (finalH * 0.15));
            doc.text('CONSIDERAR A QUANTIDADE SOLICITADA', imgX + 5, imgY + (finalH * 0.21));
            doc.setTextColor(0, 0, 0);

            // Rodapé (Quantidade e Espessura no canto inferior direito)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('QUANTIDADE DE DEGRAUS:', imgX + finalW - 10, imgY + finalH - 20, { align: 'right' });
            
            const stepsCount = totalSteps || 0;
            const qtdText = `${stepsCount} DEGRAUS + 1 PATAMAR (${widM}m x ${lenM}m)`;
            doc.setFont('helvetica', 'bold');
            doc.text(qtdText, imgX + finalW - 10, imgY + finalH - 12, { align: 'right' });
            
            doc.setFont('helvetica', 'normal');
            doc.text('ESPESSURA: 3mm', imgX + finalW - 10, imgY + finalH - 4, { align: 'right' });
            
        } else {
            // Textos originais para o Patamar Fixo
            // Comprimento (topo esquerdo, afastado para cima e esquerda)
            doc.setFont('helvetica', 'normal');
            doc.text('COMPRIMENTO: ', imgX + 25, imgY + 28);
            const compW = doc.getTextWidth('COMPRIMENTO: ');
            doc.setFont('helvetica', 'bold');
            doc.text(`${lenMm}mm`, imgX + 25 + compW, imgY + 28);
            
            // Largura (inferior esquerdo, afastado para esquerda e baixo)
            doc.setFont('helvetica', 'normal');
            doc.text('LARGURA: ', imgX + 15, imgY + 115);
            const largW = doc.getTextWidth('LARGURA: ');
            doc.setFont('helvetica', 'bold');
            doc.text(`${widMm}mm`, imgX + 15 + largW, imgY + 115);
            
            // Aba (direita central, afastado para a direita)
            doc.setFont('helvetica', 'normal');
            doc.text('ABA: ', imgX + 165, imgY + 70);
            const abaW = doc.getTextWidth('ABA: ');
            doc.setFont('helvetica', 'bold');
            doc.text('100mm', imgX + 165 + abaW, imgY + 70);
            
            // Rodapé (Xadrez e Quantidade, afastados para baixo)
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text('XADREZ 3,00', 297 / 2, imgY + 140, { align: 'center' });
            
            doc.text('QUANTIDADE:', (297 / 2) - 10, imgY + 150, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text('1', (297 / 2) + 22, imgY + 150, { align: 'center' });
        }
    });
};

export const generateProductionPDF = (props: ProductionPdfProps) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    drawProductionPage(doc, props);
    
    if (props.landings && props.landings.length > 0) {
        drawLandingsPage(doc, props.landings, props.clientName, props.totalSteps, props.wallFixation);
        drawGuardrailsPage(doc, props.landings, props.clientName);
    }
    
    doc.save(`FICHA_PRODUCAO_${props.cutStepType.toUpperCase()}_${props.clientName.replace(/\s+/g, '_')}.pdf`);
};

export const drawGuardrailsPage = (doc: jsPDF, landings: any[], clientName: string) => {
    let drawCount = 0;
    
    landings.forEach((landing: any, index: number) => {
        if (!landing.hasGuardrail && !landing.hasGate) return;

        let isGate = !!landing.hasGate;
        const format = landing.guardrailFormat || 'straight';
        const numSides = isGate ? 1 : (format === 'U' ? 3 : format === 'L' ? 2 : 1);

        for (let sideIndex = 1; sideIndex <= numSides; sideIndex++) {
            if (drawCount % 2 === 0) {
                doc.addPage('a4', 'p');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                const safeClientName = clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO';
                doc.text(doc.splitTextToSize(safeClientName, 190), 10, 15);
            }
            
            const yOffset = (drawCount % 2 === 0) ? 25 : 155;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(255, 0, 0);
            
            let titleStr = isGate
                ? (landing.gateIsBipartido ? 'PROJETO DE PORTÃO (BIPARTIDO)' : 'PROJETO DE PORTÃO')
                : 'PROJETO DE GUARDA-CORPO';
            let subtitle = ` - PATAMAR ${index + 1}`;
            if (!isGate && numSides > 1) {
                subtitle += ` (LADO ${sideIndex})`;
            }
            doc.text(`${titleStr}${subtitle}`, 10, yOffset);

            let gLength = 0;
            let gHeight = landing.guardrailHeight || 90;
            let gBarsOverride;

            if (isGate) {
                gLength = landing.gateLength || 100;
                gHeight = landing.gateHeight || 90;
                gBarsOverride = landing.gateBarsOverride;
            } else {
                if (sideIndex === 1) {
                    gLength = landing.guardrailLength || 0;
                    gBarsOverride = landing.guardrailBarsOverride;
                } else if (sideIndex === 2) {
                    gLength = landing.guardrailLength2 || 0;
                    gBarsOverride = landing.guardrailBarsOverride2;
                } else if (sideIndex === 3) {
                    gLength = landing.guardrailLength3 || 0;
                    gBarsOverride = landing.guardrailBarsOverride3;
                }
            }

            let gGapOverride;
            if (isGate) {
                gGapOverride = landing.gateGapOverride;
            } else {
                if (sideIndex === 1) gGapOverride = landing.guardrailGapOverride;
                else if (sideIndex === 2) gGapOverride = landing.guardrailGapOverride2;
                else if (sideIndex === 3) gGapOverride = landing.guardrailGapOverride3;
            }

            let gBars = gBarsOverride;
            if (!gBars && gGapOverride && gGapOverride > 0) {
                const innerL = Math.max(0, gLength - 4);
                const gapsCalc = (innerL + 3) / (gGapOverride + 3);
                gBars = Math.max(2, Math.round(gapsCalc) + 1);
            }
            if (!gBars) {
                gBars = Math.max(2, Math.round((gLength - 4) / 15) + 1);
            }
            let numInnerBars = Math.max(0, gBars - 2);
            let gapCm = (gGapOverride && gGapOverride > 0) 
                ? gGapOverride 
                : (numInnerBars >= 0 ? ((gLength - 4 - (numInnerBars * 3)) / (numInnerBars + 1)) : 0);

            // Fixo no patamar (+10 nas pontas)
            let isFixed = false;
            if (!isGate && landing.guardrailFixedToLanding) {
                if (numSides === 1) {
                    isFixed = true;
                } else {
                    isFixed = (landing.guardrailFixedSides || []).includes(sideIndex);
                }
            }
            const outerHeight = isFixed ? gHeight + 10 : gHeight;
            const innerHeight = gHeight - 13;

            const startX = 40;
            const startY = yOffset + 15;
            const drawW = 120;
            const drawH = 60;

            if (isGate) {
                doc.setFontSize(14);
                doc.setTextColor(200, 200, 200);
                doc.text('PORTÃO', startX + drawW / 2, startY - 15, { align: 'center' });
            }

            doc.setLineWidth(1);
            doc.setDrawColor(0, 0, 0);
            doc.line(startX, startY - 7, startX + drawW, startY - 7);
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text(gLength + 'cm', startX + drawW / 2, startY - 9, { align: 'center' });

            doc.setDrawColor(0, 0, 0);
            doc.line(startX + 5, startY + drawH + 7, startX + drawW - 5, startY + drawH + 7);
            doc.setTextColor(0, 0, 0);
            doc.text((gLength - 4) + 'cm', startX + drawW / 2, startY + drawH + 11, { align: 'center' });

            doc.setDrawColor(0, 0, 0);
            doc.line(startX + drawW + 7, startY, startX + drawW + 7, startY + drawH);
            doc.setTextColor(0, 0, 0);
            doc.text(outerHeight + 'cm', startX + drawW + 10, startY + drawH / 2);
            if (isFixed) {
                doc.setFontSize(7);
                doc.text('(+10cm na ponta)', startX + drawW + 10, startY + drawH / 2 + 4);
                doc.setFontSize(9);
            }

            doc.setDrawColor(0, 0, 0);
            doc.line(startX - 10, startY + 4, startX - 10, startY + drawH);
            doc.setTextColor(0, 0, 0);
            doc.text(innerHeight + 'cm', startX - 12, startY + drawH / 2, { align: 'right' });

            doc.setFillColor(31, 41, 55);
            doc.rect(startX, startY, drawW, 3, 'F');
            doc.rect(startX + 3, startY + drawH - 3, drawW - 6, 3, 'F');
            
            const visualExtraH = isFixed ? 7 : 0;
            doc.rect(startX, startY, 3, drawH + 10 + visualExtraH, 'F');
            doc.rect(startX + drawW - 3, startY, 3, drawH + 10 + visualExtraH, 'F');

            for (let i = 0; i < numInnerBars; i++) {
                const step = (drawW - 6) / (numInnerBars + 1);
                const x = startX + 3 + step * (i + 1) - 1.5;
                doc.rect(x, startY + 4, 2, drawH - 7, 'F');
            }

            if (numInnerBars > 0) {
                doc.setDrawColor(236, 72, 153);
                doc.setLineDashPattern([2, 2], 0);
                const gapStartX = startX + 3;
                const gapEndX = startX + 3 + (drawW - 6) / (numInnerBars + 1) - 1.5;
                doc.line(gapStartX, startY + drawH / 2, gapEndX, startY + drawH / 2);
                doc.setLineDashPattern([], 0);
                doc.setTextColor(236, 72, 153);
                doc.text(gapCm.toFixed(1) + 'cm', (gapStartX + gapEndX) / 2, startY + drawH / 2 - 2, { align: 'center' });
            }

            if (isGate) {
                doc.setFillColor(107, 114, 128);
                doc.circle(startX - 1, startY + 10, 2, 'F');
                doc.circle(startX - 1, startY + drawH - 10, 2, 'F');
                doc.rect(startX + drawW - 4, startY + drawH / 2 - 4, 6, 8, 'F');
            }

            const listX = 10;
            const listY = startY + drawH + 20;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text('Lista de Cortes:', listX, listY);
            doc.setFontSize(10);
            doc.text('1x Tubo Superior de ' + gLength + 'cm', listX, listY + 6);
            doc.text('1x Tubo Inferior de ' + (gLength - 4) + 'cm', listX, listY + 11);
            doc.text('2x Tubos Laterais (Pontas) de ' + outerHeight + 'cm' + (isFixed ? ' (inclui +10cm)' : ''), listX, listY + 16);
            doc.text(numInnerBars + 'x Tubos Internos de ' + innerHeight + 'cm', listX, listY + 21);
            doc.setTextColor(236, 72, 153); 
            doc.text('Afastamento (folga) das barras: ' + gapCm.toFixed(1) + 'cm', listX, listY + 26);
            
            doc.setTextColor(79, 70, 229); // Indigo 600
            const totalMeters = (gLength + (gLength - 4) + (2 * outerHeight) + (numInnerBars * innerHeight)) / 100;
            doc.text('Comprimento Linear Total: ' + totalMeters.toFixed(2) + 'm', listX, listY + 31);
            
            drawCount++;
        }
    });
};

import { patamarGenericoBase64 } from './patamarGenericoBase64';

const drawProposalPiece = (doc: jsPDF, box: { x: number, y: number, w: number, h: number }, p: any) => {
    const isGate = !!p.isGate;
    const titleText = p.title;
    const gL = Number(p.length) || 0;
    const gH = Number(p.outerH || p.height) || 90;
    const innerH = Number(p.innerH) || (gH - 13);
    const isFixed = !!p.isFixed;
    const outerHeight = isFixed ? gH + 10 : gH;

    let gBars = p.override;
    const gGap = p.gapOverride;

    if (!gBars && gGap && gGap > 0) {
        const innerL = Math.max(0, gL - 4);
        const gapsCalc = (innerL + 3) / (gGap + 3);
        gBars = Math.max(2, Math.round(gapsCalc) + 1);
    }
    if (!gBars) {
        gBars = Math.max(2, Math.round((gL - 4) / 15) + 1);
    }
    const numInnerBars = Math.max(0, gBars - 2);
    const gapCm = (gGap && gGap > 0)
        ? gGap
        : (numInnerBars >= 0 ? ((gL - 4 - (numInnerBars * 3)) / (numInnerBars + 1)) : 0);

    // Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(titleText, box.x + box.w / 2, box.y + 4, { align: 'center' });

    // Subtitle
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${gL}cm de comprimento x ${outerHeight}cm de altura - Vãos: ${gapCm.toFixed(1)}cm`, box.x + box.w / 2, box.y + 8.5, { align: 'center' });

    // Dimensions for drawing area
    const margin = { top: 18, bottom: 16, left: 14, right: 14 };
    const maxDrawW = box.w - margin.left - margin.right;
    const maxDrawH = box.h - margin.top - margin.bottom;

    const scale = Math.min(maxDrawW / Math.max(gL, 40), maxDrawH / Math.max(outerHeight, 40));
    const drawW = gL * scale;
    const drawH = outerHeight * scale;

    const px = box.x + (box.w - drawW) / 2;
    const py = box.y + margin.top + (maxDrawH - drawH) / 2;

    // 1. Green top line & text
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.line(px, py - 2.5, px + drawW, py - 2.5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(`${gL}cm`, px + drawW / 2, py - 3.5, { align: 'center' });

    // 2. Orange bottom line & text
    doc.setDrawColor(249, 115, 22);
    doc.setLineWidth(0.5);
    doc.line(px + 2, py + drawH + 3, px + drawW - 2, py + drawH + 3);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(249, 115, 22);
    doc.text(`${gL - 4}cm`, px + drawW / 2, py + drawH + 6.5, { align: 'center' });

    // 3. Red right line & text (Height)
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.line(px + drawW + 3, py, px + drawW + 3, py + drawH);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text(`${outerHeight}cm`, px + drawW + 4.5, py + drawH / 2 + 1, { align: 'left' });
    if (isFixed) {
        doc.setFontSize(5.5);
        doc.text('(+10cm)', px + drawW + 4.5, py + drawH / 2 + 4, { align: 'left' });
    }

    // 4. Blue left line & text (Inner height)
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(px - 3, py + 2, px - 3, py + drawH);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`${innerH}cm`, px - 4.5, py + drawH / 2 + 1, { align: 'right' });

    // 5. Structure frame (Dark slate #1f2937)
    doc.setFillColor(31, 41, 55);
    doc.rect(px, py, drawW, 1.8, 'F');
    doc.rect(px + 1.8, py + drawH - 2.2, drawW - 3.6, 1.8, 'F');
    const footH = isFixed ? 3.5 : 2;
    doc.rect(px, py, 1.8, drawH + footH, 'F');
    doc.rect(px + drawW - 1.8, py, 1.8, drawH + footH, 'F');

    // Inner vertical tubes
    // A espessura acompanha o espaçamento: em peças longas (ex.: 6m) tubos de 1.5mm fixos
    // ficavam colados uns nos outros e o desenho virava um bloco preto.
    const step = (drawW - 3.6) / (numInnerBars + 1);
    const barW = Math.max(0.3, Math.min(1.5, step * 0.4));
    for (let b = 1; b <= numInnerBars; b++) {
        const bx = px + 1.8 + b * step - barW / 2;
        doc.rect(bx, py + 1.8, barW, drawH - 4.0, 'F');
    }

    // 6. Gate Hinges & Latch (if isGate)
    if (isGate) {
        doc.setFillColor(107, 114, 128);
        doc.circle(px - 0.8, py + 4, 1.0, 'F');
        doc.circle(px - 0.8, py + drawH - 5, 1.0, 'F');
        doc.rect(px + drawW, py + drawH / 2 - 1.5, 1.5, 3.0, 'F');
    }

    // 7. Pink dashed gap line & text
    if (numInnerBars > 0) {
        const gapStartX = px + 1.8;
        const gapEndX = px + 1.8 + step - 0.75;
        const midY = py + drawH / 2;
        doc.setDrawColor(236, 72, 153);
        doc.setLineWidth(0.4);
        doc.setLineDashPattern([1.5, 1], 0);
        doc.line(gapStartX, midY, gapEndX, midY);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(236, 72, 153);
        doc.text(`${gapCm.toFixed(1)}cm`, (gapStartX + gapEndX) / 2, midY - 1.2, { align: 'center' });
    }

    // 8. Bottom caption text
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(236, 72, 153);
    doc.text(`Espaçamento entre os tubos: ${gapCm.toFixed(1)}cm`, box.x + box.w / 2, box.y + box.h - 1.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
};

export const drawProposalSummaryPage = (doc: jsPDF, landings: any[], startY: number = 20): number => {
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
        doc.text(`Patamar ${index + 1}`, leftX + leftW / 2, currentY, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Medidas: ${landing.width || 0}cm x ${landing.length || 0}cm`, leftX + leftW / 2, currentY + 6, { align: 'center' });
        
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
            if (!hasG && hasGate) titleText = landing.gateIsBipartido ? 'Portão (Bipartido)' : 'Portão';
            doc.text(titleText, rightX + rightW / 2, currentY, { align: 'center' });
        }

        const pieces: any[] = [];
        if (hasG) {
            const format = landing.guardrailFormat || 'straight';
            const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
            for (let i = 1; i <= numSides; i++) {
                let gL = 0;
                let gBarsOverride;
                let gGapOverride;
                if (i===1) { 
                    gL = landing.guardrailLength || 0; 
                    gBarsOverride = landing.guardrailBarsOverride; 
                    gGapOverride = landing.guardrailGapOverride; 
                }
                else if (i===2) { 
                    gL = landing.guardrailLength2 || 0; 
                    gBarsOverride = landing.guardrailBarsOverride2; 
                    gGapOverride = landing.guardrailGapOverride2; 
                }
                else if (i===3) { 
                    gL = landing.guardrailLength3 || 0; 
                    gBarsOverride = landing.guardrailBarsOverride3; 
                    gGapOverride = landing.guardrailGapOverride3; 
                }
                
                let isFixed = false;
                if (landing.guardrailFixedToLanding) {
                    isFixed = numSides === 1 ? true : (landing.guardrailFixedSides || []).includes(i);
                }
                const gH = landing.guardrailHeight || 90;
                const outerH = isFixed ? gH + 10 : gH;
                const innerH = gH - 13;
                
                let title = `Lado ${i}`;
                if (numSides === 1) {
                    title = landing.guardrailSide ? `Guarda-Corpo (${landing.guardrailSide})` : 'Guarda-Corpo';
                } else if (numSides === 2) {
                    if (landing.guardrailSide?.toLowerCase().includes('esquerdo')) {
                        title = i === 1 ? 'Guarda-Corpo (Esquerdo)' : 'Guarda-Corpo (Frontal)';
                    } else if (landing.guardrailSide?.toLowerCase().includes('direito')) {
                        title = i === 1 ? 'Guarda-Corpo (Direito)' : 'Guarda-Corpo (Frontal)';
                    } else {
                        title = i === 1 ? 'Guarda-Corpo (Lateral)' : 'Guarda-Corpo (Frontal)';
                    }
                } else if (numSides === 3) {
                    if (i === 1) title = 'Guarda-Corpo (Esquerdo)';
                    else if (i === 2) title = 'Guarda-Corpo (Frontal)';
                    else if (i === 3) title = 'Guarda-Corpo (Direito)';
                }
                
                title = `Imagem ${pieces.length + 1}: ${title}`;
                if (isFixed) title += ' (Fixo)';
                
                pieces.push({ type: 'guardrail', title, length: gL, outerH, innerH, isFixed, override: gBarsOverride, gapOverride: gGapOverride });
            }
        }
        if (hasGate) {
            const gateTitle = landing.gateIsBipartido ? 'Portão (Bipartido)' : 'Portão';
            pieces.push({ 
                type: 'gate', 
                title: `Imagem ${pieces.length + 1}: ${gateTitle}`, 
                length: landing.gateLength || 100, 
                outerH: landing.gateHeight || 90, 
                innerH: (landing.gateHeight || 90) - 13, 
                override: landing.gateBarsOverride, 
                gapOverride: landing.gateGapOverride 
            });
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
            drawProposalPiece(doc, box, {
                title: p.title,
                length: p.length,
                outerH: p.outerH,
                innerH: p.innerH,
                isGate: p.type === 'gate',
                isFixed: p.isFixed,
                override: p.override,
                gapOverride: p.gapOverride
            });
        });
    });

    // ----------------------------------------------------
    // PROCESSAR ACESSÓRIOS AVULSOS (Agrupados lado a lado)
    // ----------------------------------------------------
    if (accessories.length > 0) {
        let currentY = finalY;
        const availH = 80; // Altura fixa reduzida para avulsos

        // Cada lado do guarda-corpo (L = 2 lados, U = 3 lados) e cada portão vira um desenho próprio;
        // antes só o 1º lado aparecia.
        const accPieces: any[] = [];
        accessories.forEach((acc: any) => {
            if (acc.hasGuardrail) {
                const format = acc.guardrailFormat || 'normal';
                const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
                const gH = acc.guardrailHeight || 90;
                const isFixed = !!acc.guardrailFixedToLanding;
                const sides = [
                    { len: acc.guardrailLength, bars: acc.guardrailBarsOverride, gap: acc.guardrailGapOverride },
                    { len: acc.guardrailLength2, bars: acc.guardrailBarsOverride2, gap: acc.guardrailGapOverride2 },
                    { len: acc.guardrailLength3, bars: acc.guardrailBarsOverride3, gap: acc.guardrailGapOverride3 },
                ].slice(0, numSides);
                sides.forEach((s, idx) => {
                    accPieces.push({
                        title: numSides > 1 ? `Guarda-Corpo em ${format} - ${idx + 1}º lado` : 'Guarda-Corpo',
                        length: s.len || 0,
                        outerH: isFixed ? gH + 10 : gH,
                        innerH: gH - 13,
                        isGate: false,
                        isFixed,
                        override: s.bars,
                        gapOverride: s.gap
                    });
                });
            }
            if (acc.hasGate) {
                const isBipartido = acc.gateIsBipartido || acc.isBipartido;
                const gH = acc.gateHeight || 90;
                accPieces.push({
                    title: isBipartido ? 'Portão (Bipartido)' : 'Portão',
                    length: acc.gateLength || 100,
                    outerH: gH,
                    innerH: gH - 13,
                    isGate: true,
                    isFixed: false,
                    override: acc.gateBarsOverride,
                    gapOverride: acc.gateGapOverride
                });
            }
        });

        // Peças longas ocupam a largura toda da página; as curtas vão em pares lado a lado
        const fullW = 190;
        const isLong = (p: any) => (Number(p.length) || 0) >= 250;
        for (let i = 0; i < accPieces.length; ) {
            if (currentY + availH + 20 > 280) {
                doc.addPage('a4', 'p');
                currentY = 20;
            } else {
                currentY += 10;
            }

            const p1 = accPieces[i];
            const p2 = accPieces[i + 1];

            if (isLong(p1)) {
                drawProposalPiece(doc, { x: 10, y: currentY, w: fullW, h: availH }, p1);
                i += 1;
            } else if (p2 && !isLong(p2)) {
                drawProposalPiece(doc, { x: 10, y: currentY, w: 95, h: availH }, p1);
                drawProposalPiece(doc, { x: 105, y: currentY, w: 95, h: availH }, p2);
                i += 2;
            } else {
                drawProposalPiece(doc, { x: 10 + fullW / 4, y: currentY, w: fullW / 2, h: availH }, p1);
                i += 1;
            }

            currentY += availH + 10;
        }
        finalY = currentY;
    }

    return finalY;
};

export const generateGuardrailsOnlyPDF = (landings: any[], clientName: string) => {
    const hasAny = landings.some(l => l.hasGuardrail || l.hasGate);
    if (!hasAny) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Create pages, but remove the first blank one if it exists
    // Actually drawGuardrailsPage just adds pages. So we can delete the first empty page after calling it.
    drawGuardrailsPage(doc, landings, clientName);
    doc.deletePage(1);

    doc.save(`PROJETO_GUARDA_CORPO_${clientName.replace(/\s+/g, '_')}.pdf`);
};

