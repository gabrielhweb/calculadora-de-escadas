import jsPDF from 'jspdf';

interface ProductionPdfProps {
    totalSteps: number;
    stepHeightCm: number;
    treadDepthCm: number;
    widthCm: number;
    cutStepType: 'left' | 'right' | 'hollow';
}

export const generateProductionPDF = (props: ProductionPdfProps) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const { totalSteps, treadDepthCm, cutStepType } = props;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FICHA DE PRODUÇÃO (CORTE A LASER)', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Technical Data
    doc.setFont('helvetica', 'bold');
    doc.text(`QUANTIDADE DE DEGRAUS: ${totalSteps}`, 20, 45);
    doc.text(`ESPESSURA 1/8"`, 20, 55);
    
    if (cutStepType === 'left' || cutStepType === 'right') {
        doc.text(`PISADA DEGRAU ${treadDepthCm.toFixed(1)} cm`, 20, 65);
        doc.text(`COMPRIMENTO ESPESSURA 2,65mm`, 20, 75);
    } else if (cutStepType === 'hollow') {
        doc.text(`COMPRIMENTO ESPESSURA 3,00mm`, 20, 65);
    }

    doc.line(20, 85, 190, 85);

    // Visual Schematic
    doc.setFontSize(16);
    doc.text('Esquema Técnico para Corte', 105, 100, { align: 'center' });
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    
    if (cutStepType === 'left' || cutStepType === 'right') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        // Vista Lateral (com furo)
        doc.text(`Vista Lateral (${cutStepType === 'left' ? 'Furo Esquerdo' : 'Furo Direito'})`, 55, 120, { align: 'center' });
        doc.rect(30, 130, 50, 20); // Perfil lateral
        // Furo
        if (cutStepType === 'left') {
            doc.circle(38, 140, 3, 'S'); 
        } else {
            doc.circle(72, 140, 3, 'S'); 
        }

        // Vista Superior (Chapa U)
        doc.text('Vista Superior (Chapa Dobrada em U)', 145, 120, { align: 'center' });
        // Desenha U invertido
        doc.line(125, 150, 125, 130); // Perna esq
        doc.line(125, 130, 165, 130); // Topo
        doc.line(165, 130, 165, 150); // Perna dir
        
        // Medidas
        doc.setFontSize(10);
        doc.text(`${treadDepthCm.toFixed(1)} cm`, 145, 128, { align: 'center' });
        
    } else if (cutStepType === 'hollow') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        doc.text('Vista Superior (Degrau Vazado)', 105, 120, { align: 'center' });
        
        // Retângulo externo
        doc.rect(60, 130, 90, 40);
        
        // Retângulo interno (vazado)
        doc.setLineWidth(0.3);
        doc.rect(65, 135, 80, 30);
        
        // Furos nas bordas
        doc.circle(62.5, 150, 1.5, 'S'); // esq
        doc.circle(147.5, 150, 1.5, 'S'); // dir
        
        // Medidas
        doc.setFontSize(10);
        doc.text(`Largura total`, 105, 128, { align: 'center' });
    }

    // Rodapé
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Documento gerado pelo sistema - Zilinski Escadas', 105, 280, { align: 'center' });

    doc.save(`FICHA_PRODUCAO_${cutStepType.toUpperCase()}.pdf`);
};
