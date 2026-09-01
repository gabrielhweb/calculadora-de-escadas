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
}

export const drawProductionPage = (doc: jsPDF, props: ProductionPdfProps) => {
    const { totalSteps, stepHeightCm, treadDepthCm, widthCm, cutStepType, clientName } = props;

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
    doc.text(`${totalSteps}`, 150, 34, { align: 'center' });
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

export const drawLandingsPage = (doc: jsPDF, landings: any[], clientName: string) => {
    landings.forEach((landing, index) => {
        doc.addPage('a4', 'l');

        // Cabeçalho
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);
        const safeClientName = clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO';
        const splitName = doc.splitTextToSize(safeClientName, 120);
        doc.text(splitName, 10, 20);
        
        const nameHeightOffset = (splitName.length - 1) * 8;
        
        doc.setFontSize(14);
        doc.setTextColor(255, 0, 0); 
        doc.text(`FICHA DE PRODUÇÃO - PATAMAR ${index + 1}`, 10, 30 + nameHeightOffset); 

        // Inserir a Imagem do Patamar
        const imgX = 20;
        const imgY = 40;
        const imgProps = doc.getImageProperties(patamarBase64);
        const imgRatio = imgProps.width / imgProps.height;
        
        let finalH = 140;
        let finalW = finalH * imgRatio;
        
        doc.addImage(patamarBase64, 'JPEG', imgX, imgY, finalW, finalH);

        doc.setTextColor(0, 0, 0);
        
        // Posições baseadas na imagem (valores aproximados)
        // Comprimento (topo esquerdo)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${landing.length ? landing.length * 10 : 0}mm`, imgX + 80, imgY + 13);
        
        // Largura (inferior esquerdo)
        doc.text(`${landing.width ? landing.width * 10 : 0}mm`, imgX + 45, imgY + 125);
        
        // Quantidade (inferior centro)
        doc.text(`1`, imgX + 135, imgY + 137);

        // O usuário disse: "onde esta escrito aba podemos deixar sem valor por enquanto"
        // Então não escrevemos nada perto de "aba"
    });
};

export const generateProductionPDF = (props: ProductionPdfProps) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    drawProductionPage(doc, props);
    
    if (props.landings && props.landings.length > 0) {
        drawLandingsPage(doc, props.landings, props.clientName);
    }
    
    doc.save(`FICHA_PRODUCAO_${props.cutStepType.toUpperCase()}_${props.clientName.replace(/\s+/g, '_')}.pdf`);
};
