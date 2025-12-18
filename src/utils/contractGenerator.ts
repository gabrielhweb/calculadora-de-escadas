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

// --- INSTRUÇÕES ---
// 1. Gere o código da imagem em https://www.base64-image.de/
// 2. Cole o código GIGANTE dentro das aspas abaixo.
const LOGO_BASE64 = "data:image/jpeg;base64,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";

export const generateContractPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let currentY = 20;

  // Adiciona Logo com Segurança
  if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
    try { 
        // Limpa o prefixo se existir
        const cleanBase64 = LOGO_BASE64.includes('base64,') 
            ? LOGO_BASE64.split('base64,')[1] 
            : LOGO_BASE64;

        doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30);
        currentY += 35;
    } catch (e) {
        console.error("Erro ao adicionar logo no contrato", e);
        // Fallback textual
        doc.setFontSize(14);
        doc.text("ZILINSKI", (pageWidth / 2), currentY + 15, { align: 'center'});
        currentY += 35;
    }
  } else {
      currentY += 10;
  }

  const addWrappedText = (text: string, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'justify') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    // Verifica se precisa de nova página
    if (currentY + (lines.length * 5) > pageHeight - margin) { 
        doc.addPage(); 
        currentY = 20; 
    }
    
    doc.text(lines, align === 'center' ? pageWidth / 2 : margin, currentY, { align: align === 'justify' ? 'left' : align, maxWidth: maxLineWidth });
    currentY += (lines.length * 5) + 3;
  };
  
  // Cabeçalho Empresa (IDÊNTICO AO ORÇAMENTO)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Av. Maria Luiza Americano 1954, São Paulo –SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  addWrappedText('CONTRATO DE COMPRA E VENDA', 14, true, 'center');
  currentY += 10;

  addWrappedText('1. IDENTIFICAÇÃO DAS PARTES', 11, true);
  addWrappedText(`VENDEDOR: ZILINSKI DISTRIBUIDORA, CNPJ: 28.869.537/0001-01.`);
  addWrappedText(`COMPRADOR: ${data.userData.name.toUpperCase()}, CPF/CNPJ: ${data.userData.cpf || '__________________'}, ENDEREÇO: ${data.userData.address}.`);
  currentY += 5;

  addWrappedText('2. OBJETO DO CONTRATO', 11, true);
  
  // Monta a descrição detalhada do objeto (IDÊNTICO AO ORÇAMENTO)
  const alturaM = (data.inputData.totalHeight / 100).toFixed(2).replace('.', ',');
  const compM = (data.selectedOption.totalLength / 100).toFixed(2).replace('.', ',');
  const widthCm = data.selectedOption.stairWidth;
  const stepH = data.selectedOption.stepHeight.toFixed(2).replace('.', ',');
  const tread = data.selectedOption.treadDepth.toFixed(2).replace('.', ',');

  let objetoDesc = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthCm}cm de largura e com corrimão de 70cm.\n`;
  objetoDesc += `-Com ${data.selectedOption.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante de ${tread}cm com ${data.inputData.dampers} amortecedores de alívio.\n`;

  if (data.selectedOption.landings.length > 0) {
      data.selectedOption.landings.forEach((l, i) => {
          const lM = (l.length / 100).toFixed(2).replace('.', ',');
          const wM = (l.width / 100).toFixed(2).replace('.', ',');
          objetoDesc += `-PATAMAR EM CHAPA XADREZ 3MM, COM MEDIDAS DE ${lM}M X ${wM}M.\n`;
      });
  }

  objetoDesc += `\nAcabamento: Fundo Prime.`;
  
  addWrappedText(objetoDesc);
  currentY += 5;

  addWrappedText('3. VALORES', 11, true);
  const total = data.selectedOption.totalPrice + data.freightCost + data.tollCost + data.installationCost + data.extrasCost;
  addWrappedText(`Valor Total: ${formatCurrencyBRL(total)}`);
  
  // Detalhamento breve
  let detalhesPreco = `(Estrutura: ${formatCurrencyBRL(data.selectedOption.totalPrice)}`;
  if (data.freightCost > 0) detalhesPreco += `, Frete: ${formatCurrencyBRL(data.freightCost + data.tollCost)}`;
  if (data.installationCost > 0) detalhesPreco += `, Instalação: ${formatCurrencyBRL(data.installationCost)}`;
  detalhesPreco += `)`;
  
  addWrappedText(detalhesPreco, 10, false);
  currentY += 5;

  addWrappedText('4. PAGAMENTO E PRAZO', 11, true);
  addWrappedText('Forma: À vista (5% desc, 50% sinal + 50% entrega) ou 12x no cartão (juros operadora).');
  addWrappedText('Prazo de entrega: 20 dias úteis após pagamento do sinal.');
  currentY += 5;

  addWrappedText('5. OBSERVAÇÕES TÉCNICAS', 11, true);
  addWrappedText('Capacidade máxima por degrau: 180k. Capacidade máxima da escada: 360k.');
  addWrappedText('OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a instalação e o bom funcionamento da escada.', 10, true);
  
  if (data.extraClauses) {
      currentY += 5;
      addWrappedText('OBSERVAÇÕES ADICIONAIS:', 10, true);
      addWrappedText(data.extraClauses);
  }

  currentY += 10;
  const dateStr = getCurrentDateFormatted();
  addWrappedText(`São Paulo, ${dateStr}.`, 10, false, 'center');
  currentY += 25;
  
  // Linhas de Assinatura
  doc.line(margin, currentY, pageWidth / 2 - 10, currentY); 
  doc.line(pageWidth / 2 + 10, currentY, pageWidth - margin, currentY); 
  currentY += 5;
  
  doc.setFontSize(10);
  doc.text('ZILINSKI DISTRIBUIDORA', margin + 10, currentY);
  doc.text('COMPRADOR', pageWidth / 2 + 30, currentY);

  doc.save(`contrato_${data.userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
};