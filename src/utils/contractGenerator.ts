
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
      discountValue?: number;
      signalPercent: number;   
      installments: number;    
      installmentValue: number;
      hybridSignalAmount?: number; // Valor manual exato do sinal
      pixTiming?: 'entry' | 'delivery'; // Momento do pagamento Pix
      remainderText?: string; // NOVO: Texto personalizado para a forma de pagamento do restante
  };
  additionalClauses?: string[]; 
  
  // PREÇOS SEPARADOS EXPLICITAMENTE
  finalStairPrice: number;
  finalLandingsPrice: number;

  // CUSTOMIZÁVEIS
  finishText?: string;
  stepCapacityText?: string;
  stairCapacityText?: string;
  warrantyText?: string;
  deliveryText?: string;
}

// =================================================================================
// --- LOCAL PARA COLAR O CÓDIGO DA IMAGEM ---
// 1. Acesse https://www.base64-image.de/ e converta sua logo.
// 2. Copie o código gerado e cole DENTRO das aspas abaixo:
// (Usando um placeholder branco de 1x1 pixel para evitar erros de arquivo corrompido)
// =================================================================================
const LOGO_BASE64 = "data:image/jpeg;base64,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LDDDDDDDDDDDDDDDDDDDDDDDDDDAmAcDoDDDDDDDDDDDDDDDDDDDDDDDDDDAKCyDoDDIDDDDDDDDDDDDDDDDDDDDDDDgoGwsmSK6gDDDDDDDDDDDDDDDDDDW4CqogIyy+KbQU8CqDDDDDDDDDDDDDDDDDDDoDDDDAwiDDDDDDDDDDDDDDDDDDDDDDDDkDDDC6DDDDDDDDDDDDDDDDDDDDDtbS7EBDxiLVq5RiX7Q3CDDDDDDDDDDDDJEDHAFKDKh7KG1AjLGbKDDDDDDDDDDDDwQAACyCwigAigQigiQiCDDDDDDDDDDDDDDEACIKKAACMGAIECDDDDDDDDDDDDDDDDDSQAgwAgCiQSwgSyjDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCD/9oADAMBAAIAAwAAABD333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333zT333333333333333333333333333327vhv333333333333333333333333333woDd333333333333333333333333333r3CLNT33333333333333333333333325Spd1733333333333333333333333332B67ZT3333333333333333333333333305yr6r/AN99999999999999999999999992UgW9W99999999999999999999999999WVcm9299+999999999999999999999992+6O6Wlr309999999999999999998Ay8eI7L/AL+gvCJwPPfffffffffffffffffffvfffSHPvfffffffffffffffffffffffbvffelPfffffffffffffffffffffLvLenPU/FBnYOvtJvM3vfffffffffffdP/zqvtqHnUd4R3pzvPvPffffffffffff3/r7jXDfD/HLH/jzfHfvfffffffffffffcOsuvNNtftusttNPffffffffffffffffbPnnDHPvDPrDPjLPfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPf/EADMRAAICAQMCAwQIBwAAAAAAAAECABEDEiExBEAyQVEQEzCBFCAiQmFxwfAjM3CAodHh/9oACAECAQE/AP6nhCRcKMOe+UDxGZDe4G0X1Eda373UoUCFg201VxHOwHdhdrPEUre3/YVIMLU1eUQUaIjGzfdIAdzwJu+5igXsYGJ2PP7/AMx0AGowuaod2PCB6mOd6HEHBh3W/SBtWMr6d5wo/P8A1H8RnlB4TENNvCKNd2fCPn+kdTqJqcCfd9mTxX3Z8A+f6RyL4mv8I5AGkext6Pt0HuD4B8/0jeR9gfyO8pTwahTYVNIHJjY9PJhPDCMKPZ42CtZgyLTD1gybKD5TIwY7Q+AfOAiqMAHkZTeYuab8ocZrYSop08zUYG+1ZgyKGJ9ZqGjTMjBiK7Q+Efv0+qfCP36TUZd9z9wfVbYae2x51NLU6hgq15mY2CsGMzMqpdTH4x+c6vYAezAwZOOJlcO1iYsYbEJiQrmpp1IrJOnRQmsie+xZBTioedpmX+EKExroxfaEU0wMLqE11D8Xpcf3zM2t2LVtACdhOpBOMTH4x+c6pS1UIQRzOlBCm4QQaMwmsNj8ZiyrkF+c6r+ZMHvFW1FiIwy2GWZFCsQIz6EDTqAXx2vsZT7iq+MOqIFAQ9USKqY3KNqEPVkiqimiDPpbeky5DkNmL1RAAqZMhdtRi5yE0VFYqbEyZC7WZizNj44jdWxGwl3Hzlk01MfU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"; 
// =================================================================================

export const generateContractPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let currentY = 10; // Reduzido de 20 para 10 para subir a logo e o cabeçalho

  // --- CABEÇALHO COM LOGO ---
  if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
    try { 
        const cleanBase64 = LOGO_BASE64.includes('base64,') ? LOGO_BASE64.split('base64,')[1] : LOGO_BASE64;
        doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30);
        currentY += 50; // Aumentado para dar 2 a 3 linhas de espaço entre a logo e o texto
    } catch (e) {
        console.error("Erro ao carregar imagem no contrato:", e);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
        currentY += 35; // Aumentado espaço no fallback também
    }
  } else {
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0); // PRETO
      doc.setFont('helvetica', 'bold');
      doc.text("ZILINSKI", (pageWidth / 2), currentY + 10, { align: 'center'});
      doc.setTextColor(0, 0, 0); 
      currentY += 30; // Aumentado espaço no fallback também
  }

  const addText = (text: string, fontSize: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'justify' = 'justify') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0); // Sempre preto
    
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
  doc.setTextColor(0, 0, 0);
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

  const cpf = data.userData?.cpf || '';
  const isPJ = cpf.length > 15; 
  let buyerText = "";
  
  if (isPJ) {
      buyerText = `Comprador: ${data.userData?.name || ''}, pessoa jurídica inscrita no CNPJ sob o nº ${cpf}, com endereço na ${data.userData?.address || ''}.`;
  } else {
      let docInfo = cpf ? `portador do CPF ${cpf}` : `documento não informado`;
      if (data.userData?.rg) {
          docInfo += ` e RG ${data.userData.rg}`;
      }
      buyerText = `Comprador: ${data.userData?.name || ''}, ${docInfo}, residente na ${data.userData?.address || ''}.`;
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
  
  // LÓGICA DE FIXAÇÃO E DESENHO
  let fixationText = "";
  if (data.inputData.stairGeometry === 'hide') {
      fixationText = ""; 
  } else if (data.inputData.stairGeometry && data.inputData.stairGeometry.includes('Fixação')) {
      fixationText = data.inputData.stairGeometry; 
  } else {
      if (data.inputData.wallFixation === 'frontal') {
          fixationText = "Fixação FRONTAL";
      } else {
          fixationText = data.inputData.wallFixation === 'left' 
              ? "Fixação na Parede ESQUERDA" 
              : "Fixação na Parede DIREITA";
      }
  }

  // Geometria (L / U)
  const geometryText = (data.inputData.stairGeometry && !data.inputData.stairGeometry.includes('Fixação') && data.inputData.stairGeometry !== 'hide')
    ? `, modelo ${data.inputData.stairGeometry}` 
    : "";

  // --- LÓGICA DE RODINHAS ---
  let baseDescription = `Escada articulada lateral em aço carbono`;
  let handrailText = "e com corrimão de 70cm";
  let dampersText = ` com ${data.inputData.dampers} amortecedores de alívio.`;

  if (data.inputData.hasWheels) {
      baseDescription = `Escada articulada com rodinhas em aço carbono`;
      dampersText = "."; // Remove amortecedores
      
      const sideMap: Record<string, string> = { 
          left: 'apenas no lado esquerdo', 
          right: 'apenas no lado direito', 
          both: 'nos dois lados' 
      };
      const sideText = sideMap[data.inputData.handrailSide || 'both'] || 'nos dois lados';
      handrailText = `e com corrimão articulado ${sideText}`;
  }

  // Constrói objeto com formatação correta de vírgulas
  let objText = `${baseDescription} com corte à laser`;
  if (fixationText) objText += `, ${fixationText}`;
  if (geometryText) objText += `${geometryText}`;
  objText += `, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthM}m de largura ${handrailText}.`;
  
  addText(objText, 11, false, 'left');
  
  const materialText = (data.inputData.treadMaterial === 'wood' || (data.inputData.treadMaterial as string) === 'Madeira') ? 'de MADEIRA' : 'de METAL';
  let stepsText = `-Com ${data.selectedOption.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante ${materialText} de ${tread}cm${dampersText}`;
  addText(stepsText, 11, false, 'left');

  // Adiciona a nota de exclusão se houver porta configurada nos desenhos
  if (data.inputData.referenceDoor && data.inputData.referenceDoor.isActive) {
      addText('(OBS: Representações de portas ou janelas em desenhos anexos são meramente ilustrativas para conferência de medidas de passagem e não fazem parte deste fornecimento.)', 10, false, 'justify');
  }

  // --- LÓGICA PARA LISTAR PATAMARES COM TIPO ---
  if (data.selectedOption.landings && data.selectedOption.landings.length > 0) {
      data.selectedOption.landings.forEach((landing, idx) => {
          if (!landing) return;
          const typeText = landing.type === 'fixed' ? 'FIXO' : 'ARTICULADO';
          
          let dirText = 'RETO';
          if (landing.direction === 'left') dirText = 'Curva à ESQUERDA';
          if (landing.direction === 'right') dirText = 'Curva à DIREITA';

          const lM = ((landing.length || 0)/100).toFixed(2);
          const wM = ((landing.width || 0)/100).toFixed(2);
          addText(`-Patamar ${idx+1} (${typeText} - ${dirText}): Medidas ${lM}m x ${wM}m`, 11, false, 'left');
      });
  }

  // --- PRECIFICAÇÃO SEPARADA (ESCADA vs PATAMARES) ---
  // USAMOS OS VALORES EXPLICITOS PASSADOS PELA TELA AGORA
  
  addText(`-Valor Escada (${data.selectedOption.structureSteps} degraus): ${formatCurrencyBRL(data.finalStairPrice)}`, 11, false, 'left');

  if (data.finalLandingsPrice > 0) {
      addText(`-Valor Patamares (Total): ${formatCurrencyBRL(data.finalLandingsPrice)}`, 11, false, 'left');
  }
  
  const structureTotal = data.finalStairPrice + data.finalLandingsPrice;
  
  // --- LISTAGEM DE ITENS ADICIONAIS ---
  if (data.inputData.optionalItems && data.inputData.optionalItems.length > 0) {
      data.inputData.optionalItems.forEach(item => {
          if (item) {
              addText(`-${item.name}: ${formatCurrencyBRL(item.price)}`, 11, false, 'left');
          }
      });
  }

  // CORREÇÃO FRETE E CORES (PRETO)
  doc.setTextColor(0, 0, 0); 
  if (data.freightCost + data.tollCost > 0) {
      addText(`-Frete ${formatCurrencyBRL(data.freightCost + data.tollCost)}`, 11, false, 'left');
  } else {
      addText(`-Frete: Por conta do comprador`, 11, true, 'left');
  }

  if (data.installationCost > 0) {
      addText(`-Instalação ${formatCurrencyBRL(data.installationCost)} (Valor para local de fácil acesso)`, 11, false, 'left');
  } else {
      addText(`-Instalação: POR CONTA DO CLIENTE`, 11, false, 'left');
  }

  // Soma final
  const totalGeral = structureTotal + data.freightCost + data.tollCost + data.installationCost + data.extrasCost;
  addText(`Total ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');

  addText(`-Acabamento: ${data.finishText || 'fundo prime'}`, 11, true, 'left');
  addText(`-Capacidade máxima por degrau: ${data.stepCapacityText || '180 quilos'}`, 11, true, 'left');
  addText(`-Capacidade máxima da escada: ${data.stairCapacityText || '360 quilos'}`, 11, true, 'left');
  
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

  const isTransportadora = data.inputData.logistics?.freightMode === 'transportadora';
  addText(isTransportadora ? '4. Do prazo de fabricação e entrega.' : '4. Do prazo de entrega.', 11, true, 'left');
  const formattedDate = data.deadlineDate ? data.deadlineDate.split('-').reverse().join('/') : '';
  
  let defaultDeliveryText = 'A combinar';
  if (formattedDate) {
      if (isTransportadora) {
          defaultDeliveryText = `A fabricação da escada deve ser feita até dia ${formattedDate}, após o pagamento do sinal, acrescido do prazo de entrega da transportadora.`;
      } else {
          defaultDeliveryText = `Deve ser feita até dia ${formattedDate}, após o pagamento do sinal`;
      }
  }
  addText(`4.1 ${data.deliveryText || defaultDeliveryText}`, 11, false, 'left');
  currentY += 5;

  addText('5. Da garantia.', 11, true, 'left');
  addText(`5.1 A empresa oferece ${data.warrantyText || 'um ano'} de garantia após a entrega e instalação do produto relacionado no item 1.1`, 11, false, 'justify');
  addText('5.2 Esta cláusula será nula apenas por mal uso do item 1.1', 11, false, 'justify');
  currentY += 5;

  // --- 6. VALOR E FORMA DE PAGAMENTO (DINÂMICO) ---
  addText('6. Do valor e forma de pagamento.', 11, true, 'left');
  addText('6.1 O valor pago referente à presente transação, poderá ser pago da(s) seguinte(s) maneira(s):', 11, false, 'justify');
  
  const discountVal = data.paymentDetails.discountValue || 0;
  const discountP = data.paymentDetails.discountPercent || 0;
  const totalComDesconto = totalGeral - discountVal;

  const discountText = discountP > 0 
      ? `menos ${discountP.toFixed(2).replace('.00', '')}% de desconto`
      : `menos desconto de ${formatCurrencyBRL(discountVal)}`;

  if (data.paymentMethod === 'pix') {
      const signalP = data.paymentDetails.signalPercent || 50;
      const valorSinal = totalComDesconto * (signalP / 100);
      const valorEntrega = totalComDesconto - valorSinal;
      
      if (discountVal > 0) {
          addText(`Total ${formatCurrencyBRL(totalGeral)} ${discountText} = ${formatCurrencyBRL(totalComDesconto)}`, 11, false, 'left');
      } else {
          addText(`Total ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');
      }
      addText(`Sendo pago ${formatCurrencyBRL(valorSinal)} via pix de sinal e ${formatCurrencyBRL(valorEntrega)} no dia entrega e instalação`, 11, false, 'left');
  
  } else if (data.paymentMethod === 'hybrid') {
      // Usa o valor manual se disponível, senão calcula pela %
      const valorPixFinal = data.paymentDetails.hybridSignalAmount !== undefined 
          ? data.paymentDetails.hybridSignalAmount 
          : totalComDesconto * ((data.paymentDetails.signalPercent || 20) / 100);
      
      // Restante vai pro cartão
      const restanteBase = totalComDesconto - valorPixFinal;
      
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || 0;
      // O total no cartão é parcela * qtd_parcelas (o installmentValue já vem com juros embutidos da tela anterior se houver)
      const totalNoCartao = installmentValue * installments; 
      
      // Determina o texto baseado no momento do pagamento (Timing)
      const isPixOnDelivery = data.paymentDetails.pixTiming === 'delivery';
      const timingText = isPixOnDelivery
          ? "via pix/dinheiro no ato da entrega/retirada" 
          : "via pix de entrada";

      // Texto flexível do restante
      const remainderMethodName = data.paymentDetails.remainderText || "Link de Pagamento (Cartão de Crédito)";
      
      let deliveryText = "";
      if (!isPixOnDelivery) {
          deliveryText = data.installationCost > 0 ? " no dia da entrega e instalação" : " no dia da entrega";
      } else {
          deliveryText = " no ato do fechamento (sinal)";
      }

      if (discountVal > 0) {
          addText(`Total ${formatCurrencyBRL(totalGeral)} ${discountText} = ${formatCurrencyBRL(totalComDesconto)}`, 11, false, 'left');
      } else {
          addText(`Total R$ ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');
      }

      if (isPixOnDelivery) {
          // Cartão é o sinal
          if (totalNoCartao > restanteBase + 1) {
              addText(`Sendo pago ${formatCurrencyBRL(restanteBase)} mais juros totalizando ${formatCurrencyBRL(totalNoCartao)} via ${remainderMethodName} em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}${deliveryText}.`, 11, false, 'justify');
          } else {
              addText(`Sendo pago ${formatCurrencyBRL(restanteBase)} via ${remainderMethodName} em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}${deliveryText}.`, 11, false, 'justify');
          }
          addText(`E o restante de ${formatCurrencyBRL(valorPixFinal)} ${timingText}.`, 11, false, 'left');
      } else {
          // PIX é o sinal
          addText(`Sendo pago ${formatCurrencyBRL(valorPixFinal)} ${timingText}.`, 11, false, 'left');
          if (totalNoCartao > restanteBase + 1) {
              addText(`E o restante de ${formatCurrencyBRL(restanteBase)} mais juros totalizando ${formatCurrencyBRL(totalNoCartao)} via ${remainderMethodName} em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}${deliveryText}`, 11, false, 'justify');
          } else {
              addText(`E o restante de ${formatCurrencyBRL(restanteBase)} via ${remainderMethodName} em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}${deliveryText}`, 11, false, 'justify');
          }
      }

  } else {
      // CARTÃO PURO
      const installments = data.paymentDetails.installments || 1;
      const installmentValue = data.paymentDetails.installmentValue || 0;
      const totalCartao = installmentValue * installments;
      
      if (discountVal > 0) {
          addText(`Total ${formatCurrencyBRL(totalGeral)} ${discountText} = ${formatCurrencyBRL(totalComDesconto)}`, 11, false, 'left');
      } else {
          addText(`Total R$ ${formatCurrencyBRL(totalGeral)}`, 11, false, 'left');
      }

      if (totalCartao > totalComDesconto + 1) {
          addText(`Sendo pago o total de ${formatCurrencyBRL(totalComDesconto)} mais juros totalizando ${formatCurrencyBRL(totalCartao)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'justify');
      } else {
          addText(`Sendo pago o total de ${formatCurrencyBRL(totalComDesconto)} via Link de Pagamento (Cartão de Crédito) em ${installments} vezes iguais de ${formatCurrencyBRL(installmentValue)}`, 11, false, 'justify');
      }
  }

// Deixei apenas +5 porque a sua função addText já dá um espaço automático. 
  // Se quiser o texto mais colado ainda, é só apagar essa linha do currentY += 5;
  currentY += 5; 

  addText('6.2 Caso o pagamento da parcela final não seja realizado em até 2 (dois) dias corridos após a entrega, será aplicada multa de 4% sobre o valor em aberto, além de juros de 1% ao mês até a regularização.', 11, false, 'justify');
  
  // Reduzi aqui de 10 para 5 também para não empurrar demais a Cláusula 7 para baixo
  currentY += 5;

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
  doc.text(data.userData?.name || 'Cliente', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF/CNPJ ${data.userData?.cpf || 'Não Informado'}`, pageWidth / 2, currentY, { align: 'center' });

  doc.save(`contrato_${(data.userData?.name || 'cliente').toLowerCase().replace(/\s/g, '_')}.pdf`);
};
