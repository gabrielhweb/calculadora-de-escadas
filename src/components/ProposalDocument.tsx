
import React, { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL } from '../utils';

interface ProposalDocumentProps {
  options: ProposalOption[];
  userData: UserData;
  inputData: CalculatorInput;
  freightCost: number;
  tollCost: number;
  installationCost: number;
  onBack?: () => void;
}

// --- INSTRUÇÕES ---
// 1. Gere o código da imagem em https://www.base64-image.de/
// 2. Cole o código GIGANTE dentro das aspas abaixo.
const LOGO_BASE64 = "" as string; 

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const createPdfDoc = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageMargin = 20; 
    let currentY = 20;

    // --- LOGO ---
    if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
        try { 
            const cleanBase64 = LOGO_BASE64.includes('base64,') 
                ? LOGO_BASE64.split('base64,')[1] 
                : LOGO_BASE64;
            doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30); 
            currentY += 35;
        } catch (e) {
            console.error("Erro ao gerar imagem no PDF.", e);
            doc.setFontSize(10);
            doc.text('ZILINSKI', (pageWidth / 2), currentY + 15, { align: 'center' });
            currentY += 25;
        }
    } else {
        currentY += 10;
    }

    // --- CABEÇALHO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Av. Maria Luiza Americano 1954, São Paulo –SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    const extrasCost = inputData.optionalItems.reduce((acc, item) => acc + item.price, 0);

    // --- OPÇÕES ---
    options.forEach((opt) => {
        // Verifica se cabe na página
        if (currentY > 240) { doc.addPage(); currentY = 20; }

        // Título da Opção
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Opção ${opt.optionNumber}`, pageMargin, currentY);
        currentY += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Descrição Geral
        const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
        const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
        const widthCm = opt.stairWidth;
        
        const text1 = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthCm}cm de largura e com corrimão de 70cm.`;
        const splitText1 = doc.splitTextToSize(text1, pageWidth - (pageMargin * 2));
        doc.text(splitText1, pageMargin, currentY);
        currentY += (splitText1.length * 5) + 2;

        // Detalhes dos Degraus
        const stepH = opt.stepHeight.toFixed(2).replace('.', ',');
        const tread = opt.treadDepth.toFixed(2).replace('.', ',');
        
        const text2 = `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante de ${tread}cm com ${inputData.dampers} amortecedores de alívio.`;
        const splitText2 = doc.splitTextToSize(text2, pageWidth - (pageMargin * 2));
        doc.text(splitText2, pageMargin, currentY);
        currentY += (splitText2.length * 5) + 3;

        // --- LISTA DE PREÇOS (Estilo Pré-Orçamento Detalhado) ---
        
        // 1. Valor da Escada (Apenas degraus)
        const landingsPrice = opt.landings.reduce((acc, l) => acc + l.price, 0);
        const structureOnly = opt.totalPrice - landingsPrice;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`-Valor Escada (${opt.structureSteps} degraus): ${formatCurrencyBRL(structureOnly)}`, pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 6;
        
        // 2. Patamares (Um por linha, com detalhes)
        if (opt.landings.length > 0) {
            opt.landings.forEach((landing) => {
                const lM = (landing.length / 100).toFixed(2).replace('.', ',');
                const wM = (landing.width / 100).toFixed(2).replace('.', ',');
                
                let guardText = "";
                if (landing.hasSideGuardrail && landing.hasFrontGuardrail) guardText = " c/ Guarda Corpo Lateral e Frontal";
                else if (landing.hasSideGuardrail) guardText = " c/ Guarda Corpo Lateral";
                else if (landing.hasFrontGuardrail) guardText = " c/ Guarda Corpo Frontal";

                let flushText = landing.isFlushWithSlab ? " (RENTE À LAJE)" : "";

                const line = `- PATAMAR ${lM}m x ${wM}m${guardText}${flushText}: ${formatCurrencyBRL(landing.price)}`;
                
                const splitLine = doc.splitTextToSize(line, pageWidth - (pageMargin * 2));
                doc.text(splitLine, pageMargin, currentY);
                currentY += (splitLine.length * 5) + 1;
            });
        }

        // 3. Frete
        if (freightCost + tollCost > 0) {
            doc.text(`- Frete ${formatCurrencyBRL(freightCost + tollCost)}`, pageMargin, currentY);
        } else {
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'bold');
            doc.text(`- Frete: NÃO INCLUSO`, pageMargin, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
        }
        currentY += 6;

        // 4. Instalação
        if (installationCost > 0) {
             doc.text(`-Instalação ${formatCurrencyBRL(installationCost)} (Valor para local de fácil acesso)`, pageMargin, currentY);
        } else {
             doc.text(`-Instalação: Por conta do cliente`, pageMargin, currentY);
        }
        currentY += 6;

        // 5. Extras
        if (inputData.optionalItems.length > 0) {
            inputData.optionalItems.forEach(item => {
                doc.text(`- ${item.name}: ${formatCurrencyBRL(item.price)}`, pageMargin, currentY);
                currentY += 6;
            });
        }

        // 6. TOTAL
        const totalGeral = opt.totalPrice + freightCost + tollCost + installationCost + extrasCost;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total ${formatCurrencyBRL(totalGeral)}`, pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        
        currentY += 15; // Espaço entre opções
    });

    // --- RODAPÉ ---
    if (currentY > 200) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('-Acabamento: fundo prime', pageMargin, currentY);
    currentY += 6;

    doc.text('-Capacidade máxima por degrau: 180k', pageMargin, currentY);
    currentY += 6;
    doc.text('-Capacidade máxima da escada: 360k', pageMargin, currentY);
    currentY += 10;

    doc.text('Formas de pagamento:', pageMargin, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('À vista: 5% de desconto, sendo 50% sinal restante e restante no dia da entrega', pageMargin, currentY);
    currentY += 6;

    doc.text('À prazo em até 12x via Link de Pagamento no Cartão de Crédito (juros conforme quantidade de vezes', pageMargin, currentY);
    currentY += 5;
    doc.text('e operadora)', pageMargin, currentY);
    currentY += 8;

    const obsText = 'OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a instalação e o bom funcionamento da escada.';
    const splitObs = doc.splitTextToSize(obsText, pageWidth - (pageMargin * 2));
    doc.text(splitObs, pageMargin, currentY);
    currentY += (splitObs.length * 5) + 8;

    doc.text('Prazo de entrega: 20 dias úteis após pagamento do sinal.', pageMargin, currentY);
    currentY += 8;

    doc.text('Transferência via pix chave Cnpj: 28.869.537/0001-01 P G Zilinski ME', pageMargin, currentY);

    return doc;
  }, [options, userData, inputData, freightCost, tollCost, installationCost]);

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
        try {
            const doc = createPdfDoc();
            doc.save(`orcamento_${userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro fatal ao salvar PDF", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 text-center space-y-8">
      <div className="flex justify-start">
         <button onClick={onBack} className="text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1 uppercase underline">
            Voltar e Editar
         </button>
      </div>

      <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase">Proposta Pronta</h2>
          <button onClick={handleDownload} disabled={isGenerating} className="w-full bg-highlight text-white font-black py-4 rounded shadow-lg hover:bg-yellow-600 uppercase tracking-widest">
              {isGenerating ? 'Gerando...' : 'Baixar Orçamento PDF'}
          </button>
      </div>

      <div className="max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-black text-blue-900 dark:text-blue-300 mb-4">Finalizar Venda</h3>
          <div className="grid grid-cols-1 gap-2">
            {options.map(o => (
                <button key={o.optionNumber} onClick={() => navigate('/contrato', { state: { userData, selectedOption: o, inputData, freightCost, tollCost, installationCost, extrasCost: inputData.optionalItems.reduce((a, b) => a + b.price, 0) } })} className="bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold py-3 rounded hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white transition-all">
                    Contrato Opção {o.optionNumber}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ProposalDocument;
