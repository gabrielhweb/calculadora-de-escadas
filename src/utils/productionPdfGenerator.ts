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

    const treadDepthMm = Math.round(treadDepthCm * 10);
    const stepHeightMm = Math.round(stepHeightCm * 10);
    const widthMm = Math.round(widthCm * 10);
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
    
    // Lado Esquerdo (pisada e altura)
    // Movidos para posições absolutas seguras
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const pisadaText = 'pisada';
    doc.text(pisadaText, 130, 80);
    const pisadaWidth = doc.getTextWidth(pisadaText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const displayPisada = isHollow ? treadDepthMm : treadDepthMm + 10;
    doc.text(`${displayPisada}mm`, 130 + pisadaWidth + 2, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const alturaText = 'altura';
    doc.text(alturaText, 130, 115);
    const alturaWidth = doc.getTextWidth(alturaText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${stepHeightMm}mm`, 130 + alturaWidth + 2, 115);
    
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
        // Textos lado direito para vazado (baseado no PDF CELSO)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        
        // 600mm comprimento na lateral esquerda da caixa
        doc.text(`${widthMm}mm`, 210, 85, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('comprimento', 210, 90, { align: 'right' });

        // 180mm largura no topo da caixa
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${treadDepthMm - 10}mm`, 255, 48, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('largura', 255, 53, { align: 'center' });
        
        const infoX = 220;
        const infoY = 125;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`QUANTIDADE:`, infoX, infoY);
        const qW = doc.getTextWidth(`QUANTIDADE:`);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${totalSteps}`, infoX + qW + 2, infoY + 1);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`ESPESSURA 3,00mm`, infoX, infoY + 10);
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
    landings.forEach((landing: any, index: number) => {
        if (!landing.hasGuardrail && !landing.hasGate) return;

        let isGate = !!landing.hasGate;
        const format = landing.guardrailFormat || 'straight';
        const numSides = isGate ? 1 : (format === 'U' ? 3 : format === 'L' ? 2 : 1);

        for (let sideIndex = 1; sideIndex <= numSides; sideIndex++) {
            doc.addPage('a4', 'l');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(0, 0, 0);
            const safeClientName = clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO';
            doc.text(doc.splitTextToSize(safeClientName, 120), 10, 20);
            doc.setFontSize(14);
            doc.setTextColor(255, 0, 0);
            
            let titleStr = isGate ? 'PROJETO DE PORTÃO' : 'PROJETO DE GUARDA-CORPO';
            let subtitle = ` - PATAMAR ${index + 1}`;
            if (!isGate && numSides > 1) {
                subtitle += ` (LADO ${sideIndex})`;
            }
            doc.text(`${titleStr}${subtitle}`, 10, 30);

            let gLength = 0;
            let gHeight = landing.guardrailHeight || 90;
            let gBarsOverride: number | undefined;

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

            let gBars = gBarsOverride || Math.max(2, Math.round((gLength - 6) / 15) + 1);
            let numInnerBars = Math.max(0, gBars - 2);
            let gapCm = numInnerBars >= 0 ? ((gLength - 4 - (numInnerBars * 3)) / (numInnerBars + 1)) : 0;

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

            const startX = 60;
            const startY = 60;
            const drawW = 180;
            const drawH = 100;

            if (isGate) {
                doc.setFontSize(16);
                doc.setTextColor(200, 200, 200);
                doc.text('PORTÃO', startX + drawW / 2, startY - 25, { align: 'center' });
            }

            doc.setLineWidth(1);
            doc.setDrawColor(34, 197, 94);
            doc.line(startX, startY - 10, startX + drawW, startY - 10);
            doc.setFontSize(10);
            doc.setTextColor(34, 197, 94);
            doc.text(gLength + 'cm', startX + drawW / 2, startY - 12, { align: 'center' });

            doc.setDrawColor(249, 115, 22);
            doc.line(startX + 5, startY + drawH + 10, startX + drawW - 5, startY + drawH + 10);
            doc.setTextColor(249, 115, 22);
            doc.text((gLength - 4) + 'cm', startX + drawW / 2, startY + drawH + 15, { align: 'center' });

            doc.setDrawColor(239, 68, 68);
            doc.line(startX + drawW + 10, startY, startX + drawW + 10, startY + drawH);
            doc.setTextColor(239, 68, 68);
            doc.text(outerHeight + 'cm', startX + drawW + 15, startY + drawH / 2);
            if (isFixed) {
                doc.setFontSize(8);
                doc.text('(+10cm na ponta)', startX + drawW + 15, startY + drawH / 2 + 5);
                doc.setFontSize(10);
            }

            doc.setDrawColor(59, 130, 246);
            doc.line(startX - 15, startY + 5, startX - 15, startY + drawH);
            doc.setTextColor(59, 130, 246);
            doc.text(innerHeight + 'cm', startX - 18, startY + drawH / 2, { align: 'right' });

            doc.setFillColor(31, 41, 55);
            doc.rect(startX, startY, drawW, 4, 'F');
            doc.rect(startX + 4, startY + drawH - 4, drawW - 8, 4, 'F');
            
            const visualExtraH = isFixed ? 10 : 0;
            doc.rect(startX, startY, 4, drawH + 15 + visualExtraH, 'F');
            doc.rect(startX + drawW - 4, startY, 4, drawH + 15 + visualExtraH, 'F');

            for (let i = 0; i < numInnerBars; i++) {
                const step = (drawW - 8) / (numInnerBars + 1);
                const x = startX + 4 + step * (i + 1) - 1.5;
                doc.rect(x, startY + 5, 3, drawH - 9, 'F');
            }

            if (numInnerBars > 0) {
                doc.setDrawColor(236, 72, 153);
                doc.setLineDashPattern([2, 2], 0);
                const gapStartX = startX + 4;
                const gapEndX = startX + 4 + (drawW - 8) / (numInnerBars + 1) - 1.5;
                doc.line(gapStartX, startY + drawH / 2, gapEndX, startY + drawH / 2);
                doc.setLineDashPattern([], 0);
                doc.setTextColor(236, 72, 153);
                doc.text(gapCm.toFixed(1) + 'cm', (gapStartX + gapEndX) / 2, startY + drawH / 2 - 2, { align: 'center' });
            }

            if (isGate) {
                doc.setFillColor(107, 114, 128);
                doc.circle(startX - 2, startY + 15, 3, 'F');
                doc.circle(startX - 2, startY + drawH - 15, 3, 'F');
                doc.rect(startX + drawW - 6, startY + drawH / 2 - 5, 8, 12, 'F');
            }

            const listX = 10;
            const listY = 180;
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Lista de Cortes:', listX, listY);
            doc.setFontSize(12);
            doc.setTextColor(34, 197, 94); doc.text('1x Tubo Superior de ' + gLength + 'cm', listX, listY + 8);
            doc.setTextColor(249, 115, 22); doc.text('1x Tubo Inferior de ' + (gLength - 4) + 'cm', listX, listY + 14);
            doc.setTextColor(239, 68, 68); doc.text('2x Tubos Laterais (Pontas) de ' + outerHeight + 'cm' + (isFixed ? ' (inclui +10cm)' : ''), listX, listY + 20);
            doc.setTextColor(59, 130, 246); doc.text(numInnerBars + 'x Tubos Internos de ' + innerHeight + 'cm', listX, listY + 26);
            doc.setTextColor(236, 72, 153); doc.text('Afastamento (folga) das barras: ' + gapCm.toFixed(1) + 'cm', listX, listY + 32);
        }
    });
};

import { patamarGenericoBase64 } from './patamarGenericoBase64';

export const drawProposalSummaryPage = (doc: jsPDF, landings: any[]) => {
    landings.forEach((landing: any, index: number) => {
        let hasG = landing.hasGuardrail;
        let hasGate = landing.hasGate;
        if (!hasG && !hasGate && !landing.length && !landing.width) return;

        doc.addPage('a4', 'p');
        const pageWidth = 210;
        const pageHeight = 297;
        let currentY = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Patamar ${index + 1}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Medidas: ${landing.width || 0}cm x ${landing.length || 0}cm`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        const patamarImgH = 60;
        // Desenha a imagem base64
        try {
            // Calculamos um aspect ratio razoável para a imagem
            // Se a imagem for 16:9, por exemplo. Mas aqui forçaremos a altura e largura será proporcional ou fixa.
            // A largura disponível é pageWidth - 40 (margens). Vamos centrar.
            const maxW = pageWidth - 60; 
            doc.addImage(patamarGenericoBase64, 'JPEG', pageWidth / 2 - maxW / 2, currentY, maxW, patamarImgH);
        } catch(e) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(20, currentY, pageWidth - 40, patamarImgH);
            doc.setTextColor(150, 150, 150);
            doc.text("IMAGEM DO PATAMAR AQUI", pageWidth / 2, currentY + patamarImgH / 2, { align: 'center' });
        }
        currentY += patamarImgH + 15;

        if (!hasG && !hasGate) return;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Guarda-Corpo e Portão', pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        const pieces: any[] = [];
        if (hasG) {
            const format = landing.guardrailFormat || 'straight';
            const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
            for (let i = 1; i <= numSides; i++) {
                let gL = 0;
                if (i===1) gL = landing.guardrailLength || 0;
                else if (i===2) gL = landing.guardrailLength2 || 0;
                else if (i===3) gL = landing.guardrailLength3 || 0;
                
                let isFixed = false;
                if (landing.guardrailFixedToLanding) {
                    isFixed = numSides === 1 ? true : (landing.guardrailFixedSides || []).includes(i);
                }
                const gH = landing.guardrailHeight || 90;
                const outerH = isFixed ? gH + 10 : gH;
                const innerH = gH - 13;
                
                let title = `Lado ${i}`;
                if (numSides === 1) {
                    title = landing.guardrailSide ? `G.C. (${landing.guardrailSide})` : 'Guarda-Corpo';
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
                
                title = `Imagem ${pieces.length + 1}: ${title}`;
                
                pieces.push({ type: 'guardrail', title, length: gL, outerH, innerH, isFixed });
            }
        }
        if (hasGate) {
            pieces.push({ type: 'gate', title: `Imagem ${pieces.length + 1}: Portão`, length: landing.gateLength || 100, outerH: landing.gateHeight || 90, innerH: (landing.gateHeight || 90) - 13 });
        }

        const totalPieces = pieces.length;
        if (totalPieces === 0) return;

        const availH = pageHeight - currentY - 20; 
        const availW = pageWidth - 20; 
        const startX = 10;
        const startY = currentY;

        const bboxes: any[] = [];
        if (totalPieces === 1) {
            bboxes.push({ x: startX, y: startY, w: availW, h: availH });
        } else if (totalPieces === 2) {
            const w = availW / 2;
            bboxes.push({ x: startX, y: startY, w: w, h: availH });
            bboxes.push({ x: startX + w, y: startY, w: w, h: availH });
            doc.setDrawColor(200); doc.line(startX + w, startY, startX + w, startY + availH);
        } else if (totalPieces === 3) {
            const h = availH / 2;
            const w2 = availW / 2;
            bboxes.push({ x: startX, y: startY, w: availW, h: h });
            bboxes.push({ x: startX, y: startY + h, w: w2, h: h });
            bboxes.push({ x: startX + w2, y: startY + h, w: w2, h: h });
            doc.setDrawColor(200); 
            doc.line(startX, startY + h, startX + availW, startY + h); 
            doc.line(startX + w2, startY + h, startX + w2, startY + availH); 
        } else if (totalPieces >= 4) {
            const w = availW / 2;
            const h = availH / 2;
            bboxes.push({ x: startX, y: startY, w: w, h: h });
            bboxes.push({ x: startX + w, y: startY, w: w, h: h });
            bboxes.push({ x: startX, y: startY + h, w: w, h: h });
            bboxes.push({ x: startX + w, y: startY + h, w: w, h: h });
            doc.setDrawColor(200); 
            doc.line(startX, startY + h, startX + availW, startY + h);
            doc.line(startX + w, startY, startX + w, startY + availH);
        }

        pieces.forEach((p, idx) => {
            const box = bboxes[idx];
            if (!box) return;
            const padding = 10;
            
            const maxW = box.w - padding * 2;
            const maxH = box.h - 32; // Aumentado para usar mais o espaço vertical

            // Calculate proportional size
            const scale = Math.min(maxW / Math.max(p.length, 50), maxH / Math.max(p.outerH, 50));
            const drawW = p.length * scale;
            const drawH = p.outerH * scale;

            // Center in the box
            const px = box.x + (box.w - drawW) / 2;
            const py = box.y + 18 + (maxH - drawH) / 2;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0,0,0);
            doc.text(p.title, box.x + box.w / 2, py - 10, { align: 'center' });

            // Espessuras bem mais finas para os desenhos do orçamento não ficarem "borrados"
            const outThick = 1.5;
            const inThick = 0.8;
            const horizThick = 1.2;

            // DIMENSÕES (Linhas Coloridas)
            // Topo (Verde)
            doc.setLineWidth(0.5);
            doc.setDrawColor(34, 197, 94);
            doc.line(px, py - 3, px + drawW, py - 3);
            doc.setFontSize(8);
            doc.setTextColor(34, 197, 94);
            doc.text(p.length + 'cm', px + drawW / 2, py - 4, { align: 'center' });

            // Base (Laranja)
            doc.setDrawColor(249, 115, 22);
            doc.line(px + outThick, py + drawH + 4, px + drawW - outThick, py + drawH + 4);
            doc.setTextColor(249, 115, 22);
            doc.text((p.length - 4) + 'cm', px + drawW / 2, py + drawH + 7, { align: 'center' });

            // Laterais (Vermelho)
            doc.setDrawColor(239, 68, 68);
            doc.line(px - 3, py, px - 3, py + drawH);
            doc.line(px + drawW + 3, py, px + drawW + 3, py + drawH);
            doc.setTextColor(239, 68, 68);
            doc.text(p.outerH + 'cm', px - 4, py + drawH / 2 + 1, { align: 'right' });
            doc.text(p.outerH + 'cm', px + drawW + 4, py + drawH / 2 + 1, { align: 'left' });

            // DESENHO DA ESTRUTURA (Preto)
            doc.setFillColor(31, 41, 55);
            // Barra superior
            doc.rect(px, py, drawW, horizThick, 'F');
            // Barra inferior
            doc.rect(px + outThick, py + drawH - horizThick, drawW - outThick * 2, horizThick, 'F');
            // Postes laterais (Pontas)
            doc.rect(px, py, outThick, drawH + 2, 'F');
            doc.rect(px + drawW - outThick, py, outThick, drawH + 2, 'F');
            
            // Barras internas
            const gBars = Math.max(2, Math.round((p.length - 6) / 15) + 1);
            const numInner = Math.max(0, gBars - 2);
            const gapCm = numInner >= 0 ? ((p.length - 4 - (numInner * 3)) / (numInner + 1)) : 0;
            const step = (drawW - outThick * 2) / (numInner + 1);

            for (let i = 0; i < numInner; i++) {
                const barX = px + outThick + step * (i + 1) - (inThick / 2);
                doc.rect(barX, py + horizThick, inThick, drawH - horizThick * 2, 'F');
            }

            // Folga (Distância entre os ferros) escrita como texto embaixo
            if (numInner > 0) {
                const gapText = `Folga interna: ${gapCm.toFixed(1)}cm`;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(236, 72, 153);
                doc.text(gapText, px + drawW / 2, py + drawH + 11, { align: 'center' });
            }

            // Detalhes do Portão
            if (p.type === 'gate') {
                doc.setFillColor(107, 114, 128);
                // Dobradiças
                doc.circle(px - 1, py + drawH * 0.2, 1.5, 'F');
                doc.circle(px - 1, py + drawH * 0.8, 1.5, 'F');
                // Fechadura
                doc.rect(px + drawW - outThick - 1.5, py + drawH / 2 - 4, outThick + 2, 8, 'F');
            }
        });
    });
};

export const generateGuardrailsOnlyPDF = (landings: any[], clientName: string) => {
    const hasAny = landings.some(l => l.hasGuardrail || l.hasGate);
    if (!hasAny) return;

    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Create pages, but remove the first blank one if it exists
    // Actually drawGuardrailsPage just adds pages. So we can delete the first empty page after calling it.
    drawGuardrailsPage(doc, landings, clientName);
    doc.deletePage(1);

    doc.save(`PROJETO_GUARDA_CORPO_${clientName.replace(/\s+/g, '_')}.pdf`);
};
