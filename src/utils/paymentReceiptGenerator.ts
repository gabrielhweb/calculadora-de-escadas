import jsPDF from 'jspdf';
import { SavedContract } from '../types';
import { formatCurrencyBRL } from '../utils';

export function generatePaymentReceiptPDF(contract: SavedContract | null, percent: 50 | 100, extraData?: { method: string, datetime: string, value: string, transactionId: string }) {
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
    const addLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
    }

    // Company Info
    doc.setFont('helvetica', 'bolditalic'); // To make it like the image which looks bold and slightly italic, let's just use bolditalic or bold
    doc.setFontSize(14);
    doc.text('ZILINSKI DISTRIBUIDORA', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('CNPJ: 28.869.537/0001-01', margin, yPos);
    yPos += 15;

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const title = percent === 100 ? 'RECIBO DE PAGAMENTO - QUITAÇÃO FINAL' : 'RECIBO DE PAGAMENTO - SINAL (50%)';
    doc.text(title, 105, yPos, { align: 'center' });
    yPos += 20;

    const displayValue = extraData?.value ? extraData.value : formattedValue;
    
    // Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Emphasizing the text like in the image
    const paymentDescriptionText = percent === 100 ? "pagamento final" : "pagamento de sinal";
    const closingText = percent === 100 ? ", dando-se assim a quitação total do valor acordado." : ".";
    
    // We cannot easily do inline bold in jsPDF without custom splitting, so we will do a simpler approach or just normal text, but let's try to make it look good.
    // The image has bold words: ClientName, Value, pagamento final, escada articulada..., quitação total.
    // Given jsPDF's limitations with inline styles, we'll try to just output normal text, or use doc.text with multiple writes if needed, but it's complex for line wrapping. Let's just output it in normal font.
    const bodyText = `Recebemos de ${clientName} (CPF/CNPJ ${cpfCnpj}) o valor de ${displayValue}, referente ao ${paymentDescriptionText} da compra de uma escada sob medida, conforme contrato de compra e venda firmado entre as partes${closingText}`;
    
    let splitText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitText, margin, yPos);
    yPos += (splitText.length * 5) + 15;

    // Payment Details Table
    if (extraData) {
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        
        const details = [
            { label: 'Forma de pagamento', value: extraData.method },
            { label: 'Data do pagamento', value: extraData.datetime },
            { label: 'Valor recebido', value: extraData.value },
            { label: 'ID da transação', value: extraData.transactionId || 'Não informado' },
        ];

        let ty = yPos;
        details.forEach(item => {
            doc.rect(margin, ty, 60, 8); // Label cell
            doc.rect(margin + 60, ty, 110, 8); // Value cell
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(item.label, margin + 2, ty + 5.5);
            
            doc.text(item.value, margin + 62, ty + 5.5);
            ty += 8;
        });
        yPos = ty + 25;
    } else {
        yPos += 15;
    }

    // Signature Footer (Image style)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Zilinski Escadas', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Representante: Paulo Gatto Zilinski', margin, yPos);
    yPos += 5;
    doc.text('CPF: 272.241.868-13', margin, yPos);
    yPos += 15;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento assinado digitalmente', 105, yPos, { align: 'center' });

    doc.save(`Recibo_Pagamento_${clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}_${percent}pct.pdf`);
}
