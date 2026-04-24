import jsPDF from 'jspdf';
import { SavedContract } from '../types';
import { formatCurrencyBRL } from '../utils';

export function generatePaymentReceiptPDF(contract: SavedContract | null, percent: 50 | 100) {
    if (!contract || !contract.contractData) {
        alert("Dados do contrato não encontrados para gerar o recibo.");
        return;
    }

    let parsedData = contract.contractData;
    if (typeof parsedData === 'string') {
        try {
            parsedData = JSON.parse(parsedData);
            while (typeof parsedData === 'string') {
                parsedData = JSON.parse(parsedData);
            }
        } catch (e) {
            console.error("Erro ao fazer parse dos dados do contrato", e);
            alert("Erro ao ler os dados do contrato. Formato inválido.");
            return;
        }
    }

    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    const data = parsedData as any;
    const clientName = data?.userData?.name || contract.clientName || 'Cliente';
    const cpfCnpj = data?.userData?.cpfCnpj || 'Não informado';
    
    // Calcula o valor baseado na porcentagem
    const totalValue = contract.totalValue || data?.selectedOption?.totalPrice || 0;
    const calculatedValue = totalValue * (percent / 100);
    const formattedValue = formatCurrencyBRL(calculatedValue);

    const paymentDescription = percent === 50 ? "50% do sinal" : "100% do valor integral";
    const currentDate = new Date().toLocaleDateString('pt-BR');

    // Helper functions
    const addText = (text: string, x: number, y: number, font: 'helvetica', style: 'normal' | 'bold', size: number) => {
      doc.setFont(font, style);
      doc.setFontSize(size);
      doc.text(text, x, y);
    };

    const addLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
    }

    // Header
    addText('RECIBO DE PAGAMENTO', 105, yPos, 'helvetica', 'bold', 16);
    doc.text('RECIBO DE PAGAMENTO', 105, yPos, { align: 'center' });
    yPos += 15;

    // Company Info
    addText('Zilinski Escadas / Zilinski Distribuidora', 105, yPos, 'helvetica', 'bold', 12);
    doc.text('Zilinski Escadas / Zilinski Distribuidora', 105, yPos, { align: 'center' });
    yPos += 8;
    addText('CNPJ: 28.869.537/0001-01', 105, yPos, 'helvetica', 'normal', 10);
    doc.text('CNPJ: 28.869.537/0001-01', 105, yPos, { align: 'center' });
    yPos += 20;

    // Value box
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, 170, 15, 'F');
    addText(`Valor: ${formattedValue}`, margin + 5, yPos + 10, 'helvetica', 'bold', 14);
    yPos += 25;

    // Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    const bodyText = `Recebemos de ${clientName}, portador do CPF/CNPJ ${cpfCnpj}, a quantia de ${formattedValue}.`;
    let splitText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitText, margin, yPos);
    yPos += (splitText.length * 6) + 5;

    const refText = `Referente ao pagamento de ${paymentDescription} para a fabricação de escada sob medida, conforme contrato firmado.`;
    splitText = doc.splitTextToSize(refText, 170);
    doc.text(splitText, margin, yPos);
    yPos += (splitText.length * 6) + 15;

    // Date
    addText(`Data: ${currentDate}`, margin, yPos, 'helvetica', 'normal', 12);
    yPos += 30;

    // Signature
    addLine(yPos);
    yPos += 5;
    addText('Zilinski Escadas (Assinatura)', 105, yPos, 'helvetica', 'bold', 12);
    doc.text('Zilinski Escadas (Assinatura)', 105, yPos, { align: 'center' });

    doc.save(`Recibo_Pagamento_${clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}_${percent}pct.pdf`);
}
