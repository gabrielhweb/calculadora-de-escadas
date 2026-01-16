
import { jsPDF } from 'jspdf';
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
  additionalClauses?: string[]; 
}

// =================================================================================
// --- LOCAL PARA COLAR O CÓDIGO DA IMAGEM ---
// 1. Acesse https://www.base64-image.de/ e converta sua logo.
// 2. Copie o código gerado e cole DENTRO das aspas abaixo:
// (Usando um placeholder branco de 1x1 pixel para evitar erros de arquivo corrompido)
// =================================================================================
const LOGO_BASE64 = "data:image/jpeg;base64,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"; 
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
        const cleanBase64 = LOGO_BASE64.includes('base64,') ? LOGO_BASE64.split('base64,')[1] : LOGO_BASE64;
        // Desenha a imagem (se for o placeholder, será um ponto quase invisível, o usuário deve substituir)
        doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30);
        currentY += 35; 
    } catch (e) {
        console.error("Erro ao carregar imagem no contrato:", e);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
        currentY += 25;
    }
  } else {
      doc.setFontSize(20);
      doc.setTextColor(245, 158, 11); 
      doc.setFont('helvetica', 'bold');
      doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
      doc.setTextColor(0, 0, 0); 
      currentY += 20;
  }

  const addText = (text: string, fontSize: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'justify') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
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
  doc.text('Av. Maria Luiza Americano 1954, São Paulo – São Paulo. Telefone: 019 992237714', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  doc.setFontSize(14);
  doc.text('CONTRATO DE VENDA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // --- DAS PARTES ---
  addText('Das partes:', 11, true, 'left');
  
  addText('Vendedor(a): Zilinski Distribuidora, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº28.869.537/0001-01, com sede na Av. Maria Luiza Americano 1954, bairro Cidade lider, na cidade de Sâo Paulo/SP, CEP 08275-000, neste ato devidamente constituída por seu representante legal Paulo Gatto ZIlinski.', 11, false, 'justify');
  currentY += 2;

  const isPJ = data.userData.cpf.length > 15; 
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
  
  // --- LÓGICA DE RODINHAS ---
  let baseDescription = `Escada articulada lateral em aço carbono`;
  let handrailText = "e com corrimão de 70cm";

  if (data.inputData.hasWheels) {
      baseDescription = `Escada articulada com rodinhas em aço carbono`;
      if (data.inputData.handrailSide) {
          const sideText = data.inputData.handrailSide === 'left' ? 'no lado esquerdo' : 
                           data.inputData.handrailSide === 'right' ? 'no lado direito' : 
                           'em ambos os lados';
          handrailText = `e com corrimão articulado ${sideText}`;
      }
  }

  let objText = `${baseDescription} com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthM}m de largura ${handrailText}.`;
  addText(objText, 11, false, 'left');
  
  // --- LÓGICA PARA REMOVER AMORTECEDORES ---
  let dampersText = ` com ${data.inputData.dampers} amortecedores de alívio.`;
  if (data.inputData.hasWheels) {
      dampersText = `.`; 
  }

  let stepsText = `-Com ${data.selectedOption.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante de ${tread}cm${dampersText}`;
  addText(stepsText, 11, false, 'left');

  // --- LÓGICA PARA LISTAR PATAMARES COM TIPO ---
  if (data.selectedOption.landings && data.selectedOption.landings.length > 0) {
      data.selectedOption.landings.forEach((landing, idx) => {
          const typeText = landing.type === 'fixed' ? 'FIXO' : 'ARTICULADO';
          const lM = (landing.length/100).toFixed(2);
          const wM = (landing.width/100).toFixed(2);
          addText(`-Patamar ${idx+1} (${typeText}): Medidas ${lM}m x ${wM}m`, 11, false, 'left');
      });
  }

  const structureTotal = data.selectedOption.totalPrice; 
  addText(`-Valor Escada: ${formatCurrencyBRL(structureTotal)}`, 11, false, 'left');
  
  // --- LISTAGEM DE ITENS ADICIONAIS ---
  if (data.inputData.optionalItems && data.inputData.optionalItems.length > 0) {
      data.inputData.optionalItems.forEach(item => {
          addText(`-${item.name}: ${formatCurrencyBRL(item.price)}`, 11, false, 'left');
      });
  }

  // CORREÇÃO FRETE E CORES
  doc.setTextColor(0, 0, 0); // Garante preto
  if (data.freightCost + data.tollCost > 0) {
      addText(`-Frete ${formatCurrencyBRL(data.freightCost + data.tollCost)}`, 11, false, 'left');
  } else {
      addText(`-Frete: Por conta do comprador`, 11, true, 'left');
  }

  if (data.installationCost > 0) {
      addText(`-Instalação ${formatCurrencyBRL(data.installationCost)} (Valor para local de fácil acesso)`, 11, false, 'left');
  } else {
      addText(`-Instalação: Por conta do comprador`, 11, false, 'left');
  }

  // Soma final
  const totalGeral = structureTotal + data.freightCost + data.tollCost + data.installationCost + data.extrasCost;
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
      const discount = data.paymentDetails.discountPercent || 0;
      const discountVal = totalGeral * (discount / 100);
      const totalComDesconto = totalGeral - discountVal;
      
      const signalP = data.paymentDetails.signalPercent || 50;
      const valorSinal = totalComDesconto * (signalP / 100);
      const valorEntrega = totalComDesconto - valorSinal;
      
      addText(`Total ${formatCurrencyBRL(totalGeral)} - ${discount}% desconto = ${formatCurrencyBRL(totalComDesconto)}`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(valorSinal)} via pix de sinal e ${formatCurrencyBRL(valorEntrega)} no dia entrega e instalação`, 11, false, 'left');
  
  } else if (data.paymentMethod === 'hybrid') {
      const signalP = data.paymentDetails.signalPercent || 20; 
      const valorEntradaPix = totalGeral * (signalP / 100);
      const restanteBase = totalGeral - valorEntradaPix; 
      
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || (restanteBase / installments);
      const totalNoCartao = installmentValue * installments; 
      
      addText(`Total R$ ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(valorEntradaPix)} via pix de entrada.`, 11, false, 'left');
      addText(`E o restante de ${formatCurrencyBRL(restanteBase)} mais juros da operadora financeira totalizando ${formatCurrencyBRL(totalNoCartao)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'justify');

  } else {
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || (totalGeral / installments);
      const totalCartao = installmentValue * installments;
      
      addText(`Total ${formatCurrencyBRL(totalGeral)} base + juros da operadora.`, 11, false, 'left');
      addText(`Sendo pago ${formatCurrencyBRL(totalCartao)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'left');
  }

  addText('.', 11, false, 'left');
  currentY += 10;

  if (data.additionalClauses && data.additionalClauses.length > 0) {
      addText('7. Cláusulas Adicionais.', 11, true, 'left');
      data.additionalClauses.forEach((clause, index) => {
          const clauseText = clause.match(/^\d/) ? clause : `7.${index + 1} ${clause}`;
          addText(clauseText, 11, false, 'justify');
      });
      currentY += 5;
  }

  currentY += 20;

  // --- ASSINATURAS ---
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

  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.userData.name, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF/CNPJ ${data.userData.cpf || 'Não Informado'}`, pageWidth / 2, currentY, { align: 'center' });

  doc.save(`contrato_${data.userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
};
