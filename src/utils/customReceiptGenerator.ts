import jsPDF from 'jspdf';
import { formatCurrencyBRL } from '../utils';

export interface CustomReceiptData {
    type: 'INICIAL' | 'FINAL' | 'TOTAL';
    clientName: string;
    cpfCnpj: string;
    amountReceived: number;
    amountText: string;
    productDescription: string;
    paymentMethod: string;
    datetime: string;
    transactionId: string;
}

const renderInlineBold = (doc: any, text: string, x: number, y: number, maxWidth: number) => {
    let isBold = false;
    let currentX = x;
    let currentY = y;
    const lineHeight = 6;
    doc.setFontSize(11);
    
    const tokens = text.split(/(\*\*|\s+)/).filter(Boolean);
    
    for (const token of tokens) {
        if (token === '**') {
            isBold = !isBold;
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            continue;
        }
        if (/^\n+$/.test(token)) {
             currentX = x;
             currentY += lineHeight * token.length;
             continue;
        }
        if (/^\s+$/.test(token)) {
             const spaceWidth = doc.getTextWidth(' ');
             if (currentX + spaceWidth <= x + maxWidth) {
                 currentX += spaceWidth;
             } else {
                 currentX = x;
                 currentY += lineHeight;
             }
             continue;
        }
        
        // It's a word
        const wordWidth = doc.getTextWidth(token);
        if (currentX + wordWidth > x + maxWidth) {
            currentX = x;
            currentY += lineHeight;
        }
        doc.text(token, currentX, currentY);
        currentX += wordWidth;
    }
    return currentY;
}

export function generateCustomReceiptPDF(data: CustomReceiptData) {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const maxWidth = 170;

    let headerTitle = '';
    let refText = '';
    let quitacaoText = '';

    if (data.type === 'INICIAL') {
        headerTitle = 'RECIBO DE PAGAMENTO - SINAL / INICIAL';
        refText = 'pagamento inicial (sinal)';
        quitacaoText = '.';
    } else if (data.type === 'FINAL') {
        headerTitle = 'RECIBO DE PAGAMENTO - QUITAÇÃO FINAL';
        refText = 'pagamento final';
        quitacaoText = ', dando-se assim a **quitação do saldo restante** do valor acordado.';
    } else if (data.type === 'TOTAL') {
        headerTitle = 'RECIBO DE PAGAMENTO - VALOR INTEGRAL';
        refText = 'pagamento integral';
        quitacaoText = ', dando-se assim a **quitação total** do valor acordado.';
    }

    // 1. ZILINSKI DISTRIBUIDORA header (bold italic)
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(14);
    doc.text('ZILINSKI DISTRIBUIDORA', 105, yPos, { align: 'center' });
    yPos += 10;

    // 2. CNPJ
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('CNPJ: 28.869.537/0001-01', margin, yPos);
    yPos += 15;

    // 3. Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(headerTitle, 105, yPos, { align: 'center' });
    yPos += 20;

    // 4. Main Body Text
    const formattedAmout = formatCurrencyBRL(data.amountReceived);
    const bodyTextRaw = `Recebemos de **${data.clientName}** (CNPJ/CPF ${data.cpfCnpj}) o valor de **${formattedAmout}** (**${data.amountText}**), referente ao **${refText}** da compra de uma **${data.productDescription}**, conforme contrato de compra e venda firmado entre as partes${quitacaoText}`;

    yPos = renderInlineBold(doc, bodyTextRaw, margin, yPos, maxWidth);
    yPos += 15;

    // 5. Table
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);

    const tableData = [
        { label: 'Forma de pagamento', value: data.paymentMethod },
        { label: 'Data do pagamento', value: data.datetime },
        { label: 'Valor recebido', value: formattedAmout },
        { label: 'ID da transação', value: data.transactionId || 'Não informado' }
    ];

    let tableY = yPos;
    const col1W = 60;
    const col2W = 110;
    
    tableData.forEach(row => {
        doc.rect(margin, tableY, col1W, 8); // cell 1
        doc.rect(margin + col1W, tableY, col2W, 8); // cell 2
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(row.label, margin + 2, tableY + 5.5);
        doc.text(row.value, margin + col1W + 2, tableY + 5.5);
        tableY += 8;
    });

    yPos = tableY + 25;

    // 6. Signatures Footer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Zilinski Escadas', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Representante: Paulo Gatto Zilinski', margin, yPos);
    yPos += 5;
    doc.text('CPF: 272.241.868-13', margin, yPos);
    yPos += 15;
    doc.text('Assinatura: ___________________________________________', margin, yPos);

    doc.save(`Recibo_Pagamento_${data.type}_${data.clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}.pdf`);
}
