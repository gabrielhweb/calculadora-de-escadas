
import jsPDF from 'jspdf';
import { UserData, ProposalOption, CalculatorInput } from '../types';
import { formatCurrencyBRL, getCurrentDateFormatted } from '../utils';

interface ContractData {
  userData: UserData;
  selectedOption: ProposalOption;
  inputData: CalculatorInput;
  extraClauses: string;
  freightCost: number;
  tollCost: number;
  installationCost: number;
  extrasCost: number;
}

export const generateContractPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let currentY = 20;

  const addWrappedText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'justify') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxLineWidth);
    if (currentY + (lines.length * 5) > pageHeight - margin) { doc.addPage(); currentY = 20; }
    doc.text(lines, align === 'center' ? pageWidth / 2 : margin, currentY, { align: align === 'justify' ? 'left' : align, maxWidth: maxLineWidth });
    currentY += (lines.length * 5) + 3;
  };

  addWrappedText('CONTRATO DE COMPRA E VENDA DE ESCADA PERSONALIZADA', 14, true, 'center');
  currentY += 10;

  addWrappedText('1. IDENTIFICAÇÃO DAS PARTES', 11, true);
  addWrappedText(`VENDEDOR: ZILINSKI DISTRIBUIDORA, CNPJ: 28.869.537/0001-01, Av. Maria Luiza Americano 1954, São Paulo – SP.`);
  addWrappedText(`COMPRADOR: ${data.userData.name.toUpperCase()}, CPF/CNPJ: ${data.userData.cpf || '__________________'}, ENDEREÇO: ${data.userData.address}.`);
  currentY += 5;

  addWrappedText('2. OBJETO DO CONTRATO', 11, true);
  const objetoDesc = `Fabricação de uma ESCADA EM AÇO CARBONO (Articulada Lateral):
  - Altura Total: ${(data.inputData.totalHeight / 100).toFixed(2)}m
  - Degraus: ${data.selectedOption.steps} un
  - Comprimento: ${(data.selectedOption.totalLength / 100).toFixed(2)}m
  - Largura: ${data.selectedOption.stairWidth}cm
  ${data.selectedOption.landing?.active ? `- INCLUI PATAMAR (${(data.selectedOption.landing.length/100).toFixed(2)}m x ${(data.selectedOption.landing.width/100).toFixed(2)}m) no degrau ${data.selectedOption.landing.step}.` : ''}
  - Acabamento: Fundo Prime.`;
  addWrappedText(objetoDesc);
  currentY += 5;

  addWrappedText('3. PREÇO E PAGAMENTO', 11, true);
  const total = data.selectedOption.totalPrice + data.freightCost + data.tollCost + data.installationCost + data.extrasCost;
  addWrappedText(`Valor Total: ${formatCurrencyBRL(total)}`);
  addWrappedText(`Forma: 50% sinal e 50% na entrega ou 12x no cartão via link.`);
  currentY += 5;

  addWrappedText('4. PRAZO E GARANTIA', 11, true);
  addWrappedText('Prazo: 20 dias úteis. Garantia contra defeitos de fabricação na estrutura.');
  currentY += 10;

  if (data.extraClauses) {
      addWrappedText('OBSERVAÇÕES ADICIONAIS:', 10, true);
      addWrappedText(data.extraClauses);
      currentY += 10;
  }

  const dateStr = getCurrentDateFormatted();
  addWrappedText(`São Paulo, ${dateStr}.`, 10, false, 'center');
  currentY += 25;
  doc.line(margin, currentY, pageWidth / 2 - 10, currentY); 
  doc.line(pageWidth / 2 + 10, currentY, pageWidth - margin, currentY); 
  currentY += 5;
  doc.text('ZILINSKI DISTRIBUIDORA', margin + 10, currentY);
  doc.text('COMPRADOR', pageWidth / 2 + 30, currentY);

  doc.save(`contrato_${data.userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
};
