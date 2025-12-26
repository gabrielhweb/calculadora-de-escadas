
import jsPDF from 'jspdf';
import { UserData, ProposalOption, CalculatorInput } from '../types';
import { formatCurrencyBRL } from '../utils';

interface ContractData {
  userData: UserData;
  selectedOption: ProposalOption;
  inputData: CalculatorInput;
  freightCost: number;
  tollCost: number;
  installationCost: number;
  extrasCost: number;
  deadlineDate: string;
  paymentMethod: 'pix' | 'card' | 'hybrid'; 
  paymentDetails: {
      discountPercent: number; 
      signalPercent: number;   
      installments: number;    
      installmentValue: number;
  };
  additionalClauses?: string[]; // Novas cláusulas da IA
}

// =================================================================================
// --- LOCAL PARA COLAR O CÓDIGO DA IMAGEM ---
// 1. Acesse https://www.base64-image.de/ e converta sua logo.
// 2. Copie o código gerado e cole DENTRO das aspas abaixo:
// =================================================================================
const LOGO_BASE64 = "" as string; 
// =================================================================================

export const generateContractPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let currentY = 20;

  // --- CABEÇALHO COM LOGO ---
  if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
    try { 
        // Remove cabeçalho se o usuário colou com ele (ex: data:image/png;base64,...)
        const cleanBase64 = LOGO_BASE64.includes('base64,') ? LOGO_BASE64.split('base64,')[1] : LOGO_BASE64;
        
        // Desenha a imagem centralizada
        doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30);
        currentY += 35; // Empurra o texto para baixo
    } catch (e) {
        // Se der erro na imagem, escreve o nome como fallback
        console.error("Erro ao carregar imagem no contrato:", e);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
        currentY += 25;
    }
  } else {
      // Fallback se não tiver imagem configurada
      doc.setFontSize(20);
      doc.setTextColor(245, 158, 11); // Cor Laranja (Highlight)
      doc.setFont('helvetica', 'bold');
      doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
      doc.setTextColor(0, 0, 0); // Reseta cor para preto
      currentY += 20;
  }

  // Helper para adicionar texto com quebra de linha inteligente
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'justify') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    // Verifica se vai estourar a página
    if (currentY + (lines.length * 5) > pageHeight - margin) { 
        doc.addPage(); 
        currentY = 20; 
    }
    
    doc.text(lines, align === 'center' ? pageWidth / 2 : margin, currentY, { align: align === 'justify' ? 'left' : align, maxWidth: maxLineWidth });
    currentY += (lines.length * 5) + 3;
  };

  // --- DADOS DA EMPRESA ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Av. Maria Luiza Americano 1954, São Paulo –SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  doc.setFontSize(14);
  doc.text('CONTRATO DE VENDA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // --- DAS PARTES ---
  addText('Das partes:', 11, true, 'left');
  
  // Vendedor
  addText('Vendedor(a): Zilinski Distribuidora, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº28.869.537/0001-01, com sede na Av. Maria Luiza Americano 1954, bairro Cidade lider, na cidade de Sâo Paulo/SP, CEP 08275-000, neste ato devidamente constituída por seu representante legal Paulo Gatto ZIlinski.', 11, false, 'justify');
  currentY += 2;

  // Comprador (Lógica Dinâmica CPF/CNPJ/RG)
  const isPJ = data.userData.cpf.length > 15; // Assume CNPJ pela mascara
  let buyerText = "";
  
  if (isPJ) {
      buyerText = `Comprador: ${data.userData.name}, pessoa jurídica inscrita no CNPJ sob o nº ${data.userData.cpf}, com endereço na ${data.userData.address}.`;
  } else {
      let docInfo = data.userData.cpf ? `portador do CPF ${data.userData.cpf}` : `documento não informado`;
      if (data.userData.rg) {
          docInfo += ` e RG ${data.userData.rg}`;
      }
      buyerText = `Comprador: ${data.userData.name}, ${docInfo}, residente na ${data.userData.address}.`;
  }
  
  addText(buyerText, 11, false, 'justify');
  currentY += 2;

  addText('As partes qualificadas acima, firmam entre si, de forma justa e acertada, o presente instrumento de Compra e Venda, que se regerá pelas cláusulas e disposições a seguir elencadas.', 11, false, 'justify');
  currentY += 5;

  // --- 1. DO OBJETO CONTRATUAL ---
  addText('1.Do objeto contratual.', 11, true, 'left');

  const alturaM = (data.inputData.totalHeight / 100).toFixed(2);
  const compM = (data.selectedOption.totalLength / 100).toFixed(2);
  const widthM = (data.selectedOption.stairWidth / 100).toFixed(2);
  const stepH = data.selectedOption.stepHeight.toFixed(2);
  const tread = data.selectedOption.treadDepth.toFixed(2);
  
  let objText = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthM}m de largura e com corrimão de 70cm.`;
  addText(objText, 11, false, 'left');
  
  let stepsText = `-Com ${data.selectedOption.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante de ${tread}cm com ${data.inputData.dampers} amortecedores de alívio.`;
  addText(stepsText, 11, false, 'left');

  const structureTotal = data.selectedOption.totalPrice + data.extrasCost;
  addText(`-Valor Escada: ${formatCurrencyBRL(structureTotal)}`, 11, false, 'left');
  
  if (data.freightCost + data.tollCost > 0) {
      addText(`-Frete ${formatCurrencyBRL(data.freightCost + data.tollCost)}`, 11, false, 'left');
  } else {
      addText(`-Frete R$ 0,00 (Retira ou Incluso)`, 11, false, 'left');
  }

  if (data.installationCost > 0) {
      addText(`-Instalação ${formatCurrencyBRL(data.installationCost)} (Valor para local de fácil acesso)`, 11, false, 'left');
  } else {
      addText(`-Instalação: Por conta do comprador`, 11, false, 'left');
  }

  // Total Geral Base
  const totalGeral = structureTotal + data.freightCost + data.tollCost + data.installationCost;
  addText(`Total ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');

  addText('-Acabamento: fundo prime', 11, true, 'left');
  addText('-Capacidade máxima por degrau: 180k', 11, true, 'left');
  addText('-Capacidade máxima da escada: 360k', 11, true, 'left');
  
  currentY += 5;

  // --- 2 a 5 (Cláusulas Padrão) ---
  addText('2.Das obrigações do(a) vendedor(a).', 11, true, 'left');
  addText('2.1 O(a) vendedor(a) declara ser o fabricante do objeto descrito no item 1.1.', 11, false, 'justify');
  addText('2.2 Entregar o objeto de venda descrito no item 1.1 no prazo estabelecido na transportadora acordada pelas partes. .', 11, false, 'justify');
  addText('2.2.1 O objeto deverá ser entregue conforme as características descritas e apresentadas no item 1.1 deste instrumento.', 11, false, 'justify');
  addText('2.3 Informar com veracidade as condições do objeto da venda.', 11, false, 'justify');
  addText('2.4 Entregar a nota fiscal e/ou comprovante de pagamento e quitação.', 11, false, 'justify');
  addText('2.5 É responsabilidade do vendedor zelar pelo bem/objeto até o momento de sua entrega.', 11, false, 'justify');
  addText('2.6 Fornecer seus dados de forma clara, correta e verdadeira, sob pena de responder por quaisquer informações dispostas de forma incorreta ou incompleta.', 11, false, 'justify');
  currentY += 5;

  addText('3. Das obrigações do(a) comprador(a).', 11, true, 'left');
  addText('3.1 Realizar o pagamento respeitando o prazo acordado.', 11, false, 'justify');
  addText('3.2 Informar quaisquer alterações ou erros relacionados as suas informações e dados dispostos neste instrumento e na nota fiscal, sob pena de responder por tal omissão.', 11, false, 'justify');
  addText('3.3 Verificar se o objeto de compra está conforme as características descritas no item 1.1.', 11, false, 'justify');
  addText('3.4 É responsabilidade do comprador informar sobre qualquer vício ou defeito que encontre em seu objeto, respeitando o prazo do Código de Defesa do Consumidor.', 11, false, 'justify');
  currentY += 5;

  addText('4. Do prazo de entrega.', 11, true, 'left');
  const formattedDate = data.deadlineDate.split('-').reverse().join('/');
  addText(`4.1 Deve ser feita até dia ${formattedDate}, após o pagamento do sinal`, 11, false, 'left');
  currentY += 5;

  addText('5. Da garantia.', 11, true, 'left');
  addText('5.1 A empresa oferece um ano de garantia após a entrega e instalação do produto relacionado no item 1.1', 11, false, 'justify');
  addText('5.2 Esta cláusula será nula apenas por mal uso do item 1.1', 11, false, 'justify');
  currentY += 5;

  // --- 6. VALOR E FORMA DE PAGAMENTO (DINÂMICO) ---
  addText('6. Do valor e forma de pagamento.', 11, true, 'left');
  addText('6.1 O valor pago referente à presente transação, poderá ser pago da(s) seguinte(s) maneira(s):', 11, false, 'justify');
  
  if (data.paymentMethod === 'pix') {
      // --- MODO PIX (À VISTA) ---
      const discount = data.paymentDetails.discountPercent || 0;
      const discountVal = totalGeral * (discount / 100);
      const totalComDesconto = totalGeral - discountVal;
      
      const signalP = data.paymentDetails.signalPercent || 50;
      const valorSinal = totalComDesconto * (signalP / 100);
      const valorEntrega = totalComDesconto - valorSinal;
      
      addText(`Total ${formatCurrencyBRL(totalGeral)} - ${discount}% desconto = ${formatCurrencyBRL(totalComDesconto)}`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(valorSinal)} via pix de sinal e ${formatCurrencyBRL(valorEntrega)} no dia entrega e instalação`, 11, false, 'left');
  
  } else if (data.paymentMethod === 'hybrid') {
      // --- MODO HÍBRIDO (PIX + CARTÃO) ---
      const signalP = data.paymentDetails.signalPercent || 20; // % de Entrada em Pix
      const valorEntradaPix = totalGeral * (signalP / 100);
      const restanteBase = totalGeral - valorEntradaPix; // O que sobrou pra passar no cartão
      
      // Dados do Cartão
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || (restanteBase / installments);
      const totalNoCartao = installmentValue * installments; // Valor final no cartão com juros
      
      addText(`Total R$ ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(valorEntradaPix)} via pix de entrada.`, 11, false, 'left');
      addText(`E o restante de ${formatCurrencyBRL(restanteBase)} mais juros da operadora financeira totalizando ${formatCurrencyBRL(totalNoCartao)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'justify');

  } else {
      // --- MODO CARTÃO (INTEGRAL) ---
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || (totalGeral / installments);
      const totalCartao = installmentValue * installments;
      
      addText(`Total ${formatCurrencyBRL(totalGeral)} base + juros da operadora.`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(totalCartao)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'left');
  }

  addText('.', 11, false, 'left');
  currentY += 10;

  // --- 7. CLÁUSULAS ADICIONAIS (GERADAS PELA IA) ---
  if (data.additionalClauses && data.additionalClauses.length > 0) {
      addText('7. Cláusulas Adicionais.', 11, true, 'left');
      data.additionalClauses.forEach((clause, index) => {
          // Se a clausula da IA não vier numerada, a gente tenta numerar ou apenas adiciona
          const clauseText = clause.match(/^\d/) ? clause : `7.${index + 1} ${clause}`;
          addText(clauseText, 11, false, 'justify');
      });
      currentY += 5;
  }

  currentY += 20;

  // --- ASSINATURAS ---
  // Linha Vendedor
  if (currentY + 60 > pageHeight - margin) { doc.addPage(); currentY = 40; }
  
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Representada por Paulo Gatto Zilinski', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.text('CPF Nº 272.241.868-13', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 25;

  // Linha Comprador
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.userData.name, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF/CNPJ ${data.userData.cpf || 'Não Informado'}`, pageWidth / 2, currentY, { align: 'center' });

  doc.save(`contrato_${data.userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
};
