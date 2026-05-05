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
  treadMaterial?: 'metal' | 'wood' | 'chapa_xadrez' | 'chapa_vazada';
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
      report += `*** VAZADO PARA MADEIRA ***\n`;
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
          
          if (l.type === 'fixed') {
              report += `1 patamar em chapa xadrez em 3mm com dobras de 100mm\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          } else {
              report += `1 patamar articulado\n`;
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
      report += `DEGRAUS DE MADEIRA:\n`;
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

          if (l.type === 'fixed') {
              report += `1 patamar em chapa xadrez em 3mm com dobras de 100mm${bracketText}\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          } else {
              report += `1 patamar articulado${bracketText}\n`;
              report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
          }
      });
      report += `\n`;
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

export const generateUnifiedTechnicalPDF = (props: TechnicalDataProps) => {
  const doc = new jsPDF();
  const filename = `ficha_tecnica_${props.clientName.replace(/\s/g, '_').toLowerCase()}.pdf`;

  const addPageContent = (title: string, text: string) => {
      // Configuração do PDF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(title, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${props.clientName}`, 20, 35);
      doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 42);
      
      // Linha separadora
      doc.line(20, 48, 190, 48);

      // Conteúdo Técnico (Fonte Monospaced para alinhar números)
      doc.setFont('courier', 'bold'); 
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Preto

      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 60);

      // Rodapé Técnico
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Zilinski Distribuidora - Sistema de Controle de Produção", 105, 280, { align: 'center' });
  };

  // Página 1: Produção Laser
  addPageContent("FICHA DE PRODUÇÃO - CORTE A LASER", generateTechnicalDataText(props));

  // Adiciona nova página
  doc.addPage();

  // Página 2: Matéria Prima
  addPageContent("FICHA DE MATÉRIA PRIMA", generateMaterialDataText(props));

  doc.save(filename);
};
