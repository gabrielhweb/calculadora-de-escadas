import jsPDF from 'jspdf';

export interface ProductionPdfProps {
    totalSteps: number;
    stepHeightCm: number;
    treadDepthCm: number;
    widthCm: number;
    cutStepType: 'left' | 'right' | 'hollow';
    clientName: string;
}

export const drawProductionPage = (doc: jsPDF, props: ProductionPdfProps) => {
    const { totalSteps, stepHeightCm, treadDepthCm, widthCm, cutStepType, clientName } = props;

    // Convert to mm and round
    const treadDepthMm = Math.round(treadDepthCm * 10);
    const stepHeightMm = Math.round(stepHeightCm * 10);
    const widthMm = Math.round(widthCm * 10);
    const uShapeWidthMm = treadDepthMm - 10;

    // Cabeçalho (Header)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(0, 0, 0);
    doc.text(clientName ? clientName.toUpperCase() : 'CLIENTE NÃO INFORMADO', 10, 20);
    
    // Título em vermelho
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 0, 0); // RED
    let cutText = '';
    if (cutStepType === 'left') cutText = 'FUROS LADO ESQUERDO';
    if (cutStepType === 'right') cutText = 'FUROS LADO DIREITO';
    if (cutStepType === 'hollow') cutText = 'DEGRAU VAZADO';
    doc.text(cutText, 70, 28); 
    
    // Textos centrais superiores
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('QUANTIDADE DE DEGRAUS:', 120, 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalSteps}`, 180, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.text('ESPESSURA 1/8"', 120, 22);
    
    // Linha Divisória
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(195, 10, 195, 200);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4); 

    // Função auxiliar para desenhar o corpo da escada (Stringer)
    const drawStringer = (x: number, y: number, hasHoles: boolean, isDetailed: boolean) => {
        const pdx = 35;  // Pisada dx
        const pdy = 17.5;  // Pisada dy (inclinação 0.5)
        const adx = 0;   // Altura dx
        const ady = 35;  // Altura dy (vertical)
        
        const p0 = { x, y };
        const p1 = { x: p0.x + pdx, y: p0.y + pdy };
        const p2 = { x: p1.x + adx, y: p1.y + ady };
        const p3 = { x: p2.x + pdx, y: p2.y + pdy };
        const p4 = { x: p3.x + adx, y: p3.y + ady };
        
        const h1 = { x: p4.x - 12, y: p4.y - 6 }; // Hook lip
        const h2 = { x: h1.x, y: h1.y - 15 };       // Hook tip
        
        // Bottom left corner (fechando o polígono de forma paralela à pisada)
        const botLeft = { x: p0.x, y: h2.y - 0.5 * (h2.x - p0.x) };
        
        // Outer shape
        doc.line(p0.x, p0.y, p1.x, p1.y);
        doc.line(p1.x, p1.y, p2.x, p2.y);
        doc.line(p2.x, p2.y, p3.x, p3.y);
        doc.line(p3.x, p3.y, p4.x, p4.y);
        doc.line(p4.x, p4.y, h1.x, h1.y);
        doc.line(h1.x, h1.y, h2.x, h2.y);
        doc.line(h2.x, h2.y, botLeft.x, botLeft.y);
        doc.line(botLeft.x, botLeft.y, p0.x, p0.y);
        
        // Furos
        if (hasHoles) {
            const circleRadius = 1.2;
            doc.circle(p1.x - 5, p1.y + 10, circleRadius, 'S');
            doc.circle(p3.x - 5, p3.y + 10, circleRadius, 'S');
        }
        
        // Detalhes (Dobras e Textos)
        if (isDetailed) {
            // Inner lines (folds)
            const ix = 1.5;
            const iy = -2;
            doc.line(p0.x + ix, p0.y + 2, botLeft.x + ix, botLeft.y + iy); // left vertical
            doc.line(botLeft.x + ix, botLeft.y + iy, h2.x + ix, h2.y + iy); // bottom diagonal
            doc.line(h2.x + ix, h2.y + iy, h1.x + ix, h1.y + iy); // hook tip
            doc.line(h1.x + ix, h1.y + iy, p4.x, p4.y); // hook lip tapers to p4
            
            // Labels
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('pisada', p2.x + 5, p2.y - 2);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`${treadDepthMm}mm`, p2.x + 18, p2.y - 2);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('altura', p3.x + 4, p3.y + 15);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`${stepHeightMm}mm`, p3.x + 14, p3.y + 15);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('25', h1.x + 2, h1.y + 10);
            doc.text('30', p4.x + 4, p4.y + 2);
        }
    };

    // LADO ESQUERDO: Duas chapas do corpo da escada
    const leftHasHoles = (cutStepType === 'left' || cutStepType === 'hollow');
    const rightHasHoles = (cutStepType === 'right' || cutStepType === 'hollow');
    
    drawStringer(10, 60, leftHasHoles, false); // Peça esquerda (sem detalhe de dobra)
    drawStringer(85, 60, rightHasHoles, true);  // Peça direita (com detalhe de dobra e textos)

    // LADO DIREITO: Chapa U ou Hollow Box
    if (cutStepType === 'left' || cutStepType === 'right') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(`${uShapeWidthMm}mm`, 245, 45, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('PISADA', 245, 55, { align: 'center' });
        doc.text('DEGRAU', 245, 60, { align: 'center' });
        
        // Desenho do U
        doc.setLineWidth(0.4);
        const ux = 215;
        const uy = 80;
        const uWidth = 60;
        const uHeight = 15;
        
        doc.line(ux, uy + uHeight, ux, uy); // left leg
        doc.line(ux, uy, ux + uWidth, uy); // top
        doc.line(ux + uWidth, uy, ux + uWidth, uy + uHeight); // right leg
        
        // Textos 30 do U
        doc.setFontSize(10);
        doc.text('30', ux - 8, uy + uHeight - 2);
        doc.text('30', ux + uWidth + 3, uy + uHeight - 2);
        
        // Info Quantidade, Comprimento, Espessura
        const infoX = 210;
        const infoY = 160;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`QUANTIDADE:`, infoX, infoY);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalSteps}`, infoX + 25, infoY);

        doc.setFont('helvetica', 'normal');
        doc.text(`COMPRIMENTO:`, infoX, infoY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${widthMm}mm`, infoX + 30, infoY + 10);

        doc.setFont('helvetica', 'normal');
        doc.text(`ESPESSURA:`, infoX, infoY + 20);
        doc.setFont('helvetica', 'bold');
        doc.text(`2,65mm`, infoX + 25, infoY + 20);

    } else if (cutStepType === 'hollow') {
        const boxX = 215;
        const boxY = 75;
        
        doc.setLineWidth(0.4);
        doc.rect(boxX, boxY, 60, 40);
        doc.rect(boxX + 6, boxY + 6, 48, 28);
        
        doc.circle(boxX + 3, boxY + 20, 1.2, 'S');
        doc.circle(boxX + 57, boxY + 20, 1.2, 'S');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('largura', boxX + 30, boxY - 5, { align: 'center' });
        doc.text('comprimento', boxX - 22, boxY + 22);
        doc.text('25', boxX - 8, boxY + 32);
        
        const infoX = 210;
        const infoY = 160;
        doc.setFontSize(10);
        doc.text(`QUANTIDADE:`, infoX, infoY);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalSteps}`, infoX + 25, infoY);

        doc.setFont('helvetica', 'normal');
        doc.text(`ESPESSURA:`, infoX, infoY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text(`3,00mm`, infoX + 25, infoY + 10);
    }
};

export const generateProductionPDF = (props: ProductionPdfProps) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    drawProductionPage(doc, props);
    doc.save(`FICHA_PRODUCAO_${props.cutStepType.toUpperCase()}_${props.clientName.replace(/\s+/g, '_')}.pdf`);
};
