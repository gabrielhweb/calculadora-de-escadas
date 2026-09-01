import jsPDF from 'jspdf';
import { LandingInfo } from '../types';

interface TechnicalDataProps {
  clientName: string;
  totalSteps: number;
  stepHeightCm: number;
  treadDepthCm: number;
  widthCm: number;
  totalLength: number;
  landings: LandingInfo[];
  stairDirection?: 'standard' | 'mirrored';
  wallFixation?: 'left' | 'right' | 'frontal';
  cutStepType: 'left' | 'right' | 'hollow_left' | 'hollow_right';
  treadMaterial?: 'metal' | 'wood' | 'chapa_xadrez' | 'chapa_vazada';
  woodType?: 'garapeira' | 'muiracatiara' | 'ambas';
  address?: string;
  zip?: string;
  optionalItems?: { id: string; name: string; price: number }[];
}

export const generateTechnicalDataText = (props: TechnicalDataProps) => {
  const {
    clientName,
    totalSteps,
    stepHeightCm,
    treadDepthCm,
    widthCm,
    landings,
    stairDirection,
    wallFixation,
    treadMaterial,
    woodType,
  } = props;

  const stepHeightMM = (stepHeightCm * 10).toFixed(1).replace('.0', '');
  const widthMM = (widthCm * 10).toFixed(0);
  const treadMM = (treadDepthCm * 10);
  
  // Regra: Se altura do degrau < 16cm, aumenta 0.5cm (5mm). Se >= 16cm, aumenta 1cm (10mm).
  const extraGapMM = stepHeightCm < 16 ? 5 : 10;
  const bodyTreadMM = treadMM + extraGapMM; 
  const bodyTreadStr = bodyTreadMM.toFixed(1).replace('.0', '');

  const stepTreadMM = treadMM;
  const stepTreadStr = stepTreadMM.toFixed(1).replace('.0', '');

  const numLandings = landings.length;
  const structureSteps = totalSteps - numLandings;

  let sideText = '';
  if (wallFixation === 'right') sideText = 'direito';
  else if (wallFixation === 'left') sideText = 'esquerdo';
  else sideText = 'frontal';

  const directionText = stairDirection === 'mirrored' ? 'esquerda' : 'direita';

  // --- MONTAGEM DO TEXTO ---
  let report = `Orçamento ${clientName}\n\n`;
  report += `2 corpo de escada com\n`;
  report += `${structureSteps} degraus com medidas de: ${stepHeightMM}mm de altura e pisante ${bodyTreadStr}mm\n`;
  
  // ADIÇÃO SOLICITADA: VAZADO PARA MADEIRA E CHAPAS
  if (treadMaterial === 'wood') {
      let typeLabel = 'Garapeira';
      if (woodType === 'muiracatiara') typeLabel = 'Muiracatiara';
      else if (woodType === 'ambas') typeLabel = 'Garapeira ou Muiracatiara';
      
      report += `*** VAZADO PARA MADEIRA (${typeLabel}) ***\n`;
  } else if (treadMaterial === 'chapa_vazada') {
      report += `*** CHAPA VAZADA ***\n`;
  } else if (treadMaterial === 'chapa_xadrez') {
      report += `*** CHAPA XADREZ ***\n`;
  }

  report += `${structureSteps} degraus de ${stepTreadStr}mm x ${widthMM}mm\n`;
  if (sideText === 'frontal') {
      report += `Olhando de baixo para cima furos frontais\n`;
  } else {
      report += `Olhando de baixo para cima furos do lado ${sideText}\n`;
  }
  report += `Sentido da subida para a ${directionText}\n`;

  if (numLandings > 0) {
      report += `\nOrçamento ${clientName} 2\n`;
      landings.forEach((l) => {
          if (!l) return;
          const lLen = (l.length ? l.length * 10 : 0).toFixed(0);
          const lWidth = (l.width ? l.width * 10 : 0).toFixed(0);
          
          const basePatamar = l.isAngled ? "patamar em ângulo" : "patamar";
          if (l.type === 'fixed') {
              report += `1 ${basePatamar} em chapa xadrez em 3mm com dobras de 100mm\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          } else {
              report += `1 ${basePatamar} articulado\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          }
      });
  }

  return report;
};

export const generateMaterialDataText = (props: TechnicalDataProps) => {
  const {
    clientName,
    totalSteps,
    stepHeightCm,
    treadDepthCm,
    widthCm,
    landings,
    treadMaterial,
    woodType,
    address,
    zip,
    optionalItems
  } = props;

  const numSteps = totalSteps - landings.length;
  
  let report = `LISTA DE MATÉRIA PRIMA (ESTIMATIVA)\n`;
  report += `Cliente: ${clientName}\n`;
  if (address) report += `Endereço: ${address}\n`;
  if (zip) report += `CEP: ${zip}\n`;
  report += `Data: ${new Date().toLocaleDateString()}\n\n`;
  
  report += `ESTRUTURA PRINCIPAL:\n`;
  
  // CÁLCULO DE ÁREA DE CHAPA COM +5CM DE MARGEM
  const widthWithMargin = widthCm + 5;
  const depthWithMargin = treadDepthCm + 5;
  const areaPerStepM2 = (widthWithMargin / 100) * (depthWithMargin / 100);
  const totalAreaM2 = areaPerStepM2 * numSteps;

  // CÁLCULO DE VOLUME E PESO (Chapa 3mm = 0.003m)
  const thicknessM = 0.003;
  const density = 7840; // 7.84 g/cm³ = 7840 kg/m³

  // Unitários
  const volumePerStepM3 = areaPerStepM2 * thicknessM;
  const weightPerStepKg = volumePerStepM3 * density;

  // Totais
  const totalVolumeM3 = totalAreaM2 * thicknessM;
  const totalWeightKg = totalVolumeM3 * density;

  report += `- Quantidade Degraus (Suportes): ${numSteps} peças\n`;
  report += `- Altura Espelhos (Entre-degraus): ${stepHeightCm.toFixed(2)} cm\n`;
  report += `- Largura Escada: ${widthCm} cm\n`;
  report += `- Tamanho do Pisante: ${treadDepthCm.toFixed(2)} cm\n\n`;
  
  report += `DETALHAMENTO DE MATERIAL DOS DEGRAUS (CHAPA 3MM):\n`;
  report += `(Considerando margem de +5cm na largura e profundidade)\n`;
  report += `--------------------------------------------------\n`;
  report += `UNITÁRIO (Por Degrau):\n`;
  report += `- Área:   ${areaPerStepM2.toFixed(4)} m²\n`;
  report += `- Volume: ${volumePerStepM3.toFixed(6)} m³\n`;
  report += `- Peso:   ${weightPerStepKg.toFixed(3)} kg\n\n`;
  
  report += `TOTAL (${numSteps} Degraus):\n`;
  report += `- Área:   ${totalAreaM2.toFixed(2)} m²\n`;
  report += `- Volume: ${totalVolumeM3.toFixed(4)} m³\n`;
  report += `- Peso:   ${totalWeightKg.toFixed(2)} kg\n\n`;

  const hingesPerStep = treadDepthCm < 16 ? 2 : 4;
  const hingeSize = treadDepthCm < 16 ? "4x3" : "3x2,5/8";
  const totalHinges = hingesPerStep * numSteps;

  report += `Matéria: ${totalHinges} dobradiças de ${hingeSize} polegadas\n\n`;

  if (treadMaterial === 'wood') {
      let typeLabel = 'GARAPEIRA';
      if (woodType === 'muiracatiara') typeLabel = 'MUIRACATIARA';
      else if (woodType === 'ambas') typeLabel = 'GARAPEIRA OU MUIRACATIARA';
      
      report += `DEGRAUS DE MADEIRA (${typeLabel}):\n`;
      report += `- Largura do Degrau: ${(widthCm - 0.6).toFixed(2)} cm\n`;
      report += `- Comprimento do Degrau: ${(treadDepthCm - 0.6).toFixed(2)} cm\n`;
      report += `- Altura do Degrau: 2.3 cm\n\n`;
  } else if (treadMaterial === 'chapa_xadrez') {
      report += `DEGRAUS EM CHAPA XADREZ:\n`;
      report += `- Largura do Degrau: ${(widthCm).toFixed(2)} cm\n`;
      report += `- Comprimento do Degrau: ${(treadDepthCm).toFixed(2)} cm\n\n`;
  } else if (treadMaterial === 'chapa_vazada') {
      report += `DEGRAUS EM CHAPA VAZADA:\n`;
      report += `- Largura do Degrau: ${(widthCm).toFixed(2)} cm\n`;
      report += `- Comprimento do Degrau: ${(treadDepthCm).toFixed(2)} cm\n\n`;
  }

  if (landings.length > 0) {
      report += `\nOrçamento ${clientName} 2\n`;
      landings.forEach((l) => {
          if (!l) return;
          const lLen = (l.length ? l.length * 10 : 0).toFixed(0);
          const lWidth = (l.width ? l.width * 10 : 0).toFixed(0);
          
          let bracketText = '';
          if (l.frenchBrackets === 1) bracketText = ' + 1 Mão Francesa';
          else if (l.frenchBrackets === 2) bracketText = ' + 2 Mãos Francesas';

          const basePatamar = l.isAngled ? "patamar em ângulo" : "patamar";
          if (l.type === 'fixed') {
              report += `1 ${basePatamar} em chapa xadrez em 3mm com dobras de 100mm${bracketText}\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          } else {
              report += `1 ${basePatamar} articulado${bracketText}\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          }
      });
      report += `\n`;
      const totalMaoFrancesa = landings.reduce((sum, l) => sum + (l.frenchBrackets || 0), 0);
      if (totalMaoFrancesa > 0) {
          report += `Quantidade de Mão Francesa: ${totalMaoFrancesa}\n\n`;
      }
  }
  
  if (optionalItems && optionalItems.length > 0) {
      report += `ITENS ADICIONAIS SOLICITADOS:\n`;
      optionalItems.forEach(item => {
          report += `- ${item.name}\n`;
      });
      report += `\n`;
  }

  report += `OBSERVAÇÕES DE FÁBRICA:\n`;
  report += `- Conferir estoque de chapa xadrez.\n`;
  report += `- Verificar consumíveis de solda.\n`;
  
  return report;
};

import { drawProductionPage, drawLandingsPage } from './productionPdfGenerator';

export const drawPristineTechnicalPage = (doc: jsPDF, props: TechnicalDataProps) => {
    const {
        clientName,
        totalSteps,
        stepHeightCm,
        treadDepthCm,
        widthCm,
        totalLength,
        landings,
        stairDirection,
        wallFixation,
        cutStepType,
        treadMaterial,
        woodType
    } = props;
    
    const hasLandings = landings && landings.length > 0;
    const isAngledLanding = hasLandings && landings[0].isAngled;
    const typeOfLanding = hasLandings ? (isAngledLanding ? 'Patamar em ângulo' : 'Patamar reto') : 'N/A';
    
    const inclinationRad = Math.atan(stepHeightCm / treadDepthCm);
    const inclinationDeg = (inclinationRad * (180 / Math.PI)).toFixed(1);
    
    const numSteps = totalSteps - (landings?.length || 0);
    const widthWithMargin = widthCm + 5;
    const depthWithMargin = treadDepthCm + 5;
    const areaPerStepM2 = (widthWithMargin / 100) * (depthWithMargin / 100);
    const totalAreaM2 = areaPerStepM2 * numSteps;
    const thicknessM = 0.003;
    const density = 7840;
    const totalVolumeM3 = totalAreaM2 * thicknessM;
    const totalWeightKg = (totalVolumeM3 * density).toFixed(0);

    let configText = "Curva em 'L'";
    if (stairDirection === 'standard') configText += " para direita";
    else if (stairDirection === 'mirrored') configText += " para esquerda";

    // 1. CABEÇALHO DO DOCUMENTO (Centralizado)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`Ficha Técnica ${clientName.toUpperCase()}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    const productStr = hasLandings ? "Escada com Patamar" : "Escada Reta";
    doc.text(`Produto: ${productStr}`, 105, 35, { align: 'center' });
    doc.text(`Cliente: ${clientName}`, 105, 42, { align: 'center' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 49, { align: 'center' });
    
    // 2. SEÇÃO DE REFERÊNCIA (Alinhado à Direita)
    doc.setFontSize(11);
    doc.text(`Ref: Escada ${clientName}`, 190, 60, { align: 'right' });
    doc.text(`Quantidade: 1 unidade`, 190, 66, { align: 'right' });
    
    // 3. CORPO DO DOCUMENTO (Conteúdo Técnico)
    let cursorY = 80;
    const leftMargin = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("ESPECIFICAÇÕES TÉCNICAS DA ESCADA", leftMargin, cursorY);
    cursorY += 10;
    
    doc.setFontSize(12);
    doc.text("Escada Principal", leftMargin, cursorY);
    cursorY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Quantidade de Degraus: ${totalSteps}`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Pisada do Degrau (p): ${treadDepthCm.toFixed(2)} cm`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Altura do Espelho (h): ${stepHeightCm.toFixed(2)} cm`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Inclinação da Escada: ${inclinationDeg}°`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Largura Total do Vão: ${widthCm.toFixed(2)} cm`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Comprimento Total do Vão: ${totalLength.toFixed(2)} cm`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Altura de Instalação: ${(totalSteps * stepHeightCm).toFixed(2)} cm`, leftMargin, cursorY); cursorY += 7;
    
    doc.text(`Tipo do Patamar: `, leftMargin, cursorY); 
    doc.setFont('helvetica', 'bold');
    doc.text(typeOfLanding, leftMargin + doc.getTextWidth(`Tipo do Patamar: `), cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 7;
    
    doc.text(`Espessura da Chapa: 3.00mm`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Material: Aço Carbono ASTM A36`, leftMargin, cursorY); cursorY += 7;
    
    doc.text(`Configuração da Escada: `, leftMargin, cursorY);
    doc.setFont('helvetica', 'bold');
    doc.text(configText, leftMargin + doc.getTextWidth(`Configuração da Escada: `), cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 7;
    
    doc.text(`Cor do Acabamento: Pintura Eletrostática Preto Fosco`, leftMargin, cursorY); cursorY += 7;
    doc.text(`Peso Total Aproximado: ${totalWeightKg} kg`, leftMargin, cursorY); cursorY += 15;
    
    // 4. SEÇÃO DE COMPONENTES (Canto Superior Direito)
    const rightMargin = 135;
    let rightY = 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text("COMPONENTES E ACESSÓRIOS", rightMargin, rightY); rightY += 10;
    
    doc.setFontSize(12);
    const corText = doc.splitTextToSize("Corrimão: Sim (Cravado em 80cm de altura)", 70);
    doc.text(corText, rightMargin, rightY); rightY += 15;
    
    const totalBrackets = landings?.reduce((sum, l) => sum + (Number(l.frenchBrackets) || 0), 0) || 0;
    const bracketMsg = totalBrackets > 0 ? `Sim (Quantidades e posições conforme desenho)` : `Não`;
    const maoText = doc.splitTextToSize(`Mão Francesa: ${bracketMsg}`, 70);
    doc.text(maoText, rightMargin, rightY); rightY += 20;
    
    // 5. SEÇÃO DE PAGAMENTO E ENTREGA (Canto Inferior Direito)
    rightY = 180;
    doc.setFontSize(14);
    doc.text("PAGAMENTO E ENTREGA", rightMargin, rightY); rightY += 10;
    
    doc.setFontSize(12);
    const pagText = doc.splitTextToSize("Forma de Pagamento: Híbrido (PIX Sinal + Saldo Emissão Nota)", 70);
    doc.text(pagText, rightMargin, rightY); rightY += 15;
    
    doc.text("Forma de Entrega: Transportadora", rightMargin, rightY); rightY += 10;
    doc.text("Prazo de Entrega (Úteis): 30 dias", rightMargin, rightY); rightY += 10;
    
    // 6. ASSINATURA DA EMPRESA (Canto Inferior Direito)
    doc.setFontSize(16);
    doc.text("Zilinski Escadas", 190, 270, { align: 'right' });
};

export const generateUnifiedTechnicalPDF = (props: TechnicalDataProps) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Use landscape since the drawing requires it
  const filename = `ficha_tecnica_${props.clientName.replace(/\s/g, '_').toLowerCase()}.pdf`;

  // Página 1: Produção Laser (Desenho Vetorial)
  drawProductionPage(doc, {
      totalSteps: props.totalSteps,
      stepHeightCm: props.stepHeightCm,
      treadDepthCm: props.treadDepthCm,
      widthCm: props.widthCm,
      cutStepType: props.cutStepType,
      clientName: props.clientName
  });

  if (props.landings && props.landings.length > 0) {
      drawLandingsPage(doc, props.landings, props.clientName);
  }

  // Página 2: Documento Técnico Pristine
  doc.addPage('a4', 'p');
  drawPristineTechnicalPage(doc, props);

  // Página 3: Matéria Prima (Opcional, mas mantida para preservar dados de cálculo)
  doc.addPage('a4', 'p');
  const addPageContent = (title: string, text: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(title, 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${props.clientName}`, 20, 35);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 42);
      doc.line(20, 48, 190, 48);
      doc.setFont('courier', 'bold'); 
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 60);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Zilinski Escadas - Sistema de Controle de Produção", 105, 280, { align: 'center' });
  };
  addPageContent("FICHA DE MATÉRIA PRIMA", generateMaterialDataText(props));

  doc.save(filename);
};
