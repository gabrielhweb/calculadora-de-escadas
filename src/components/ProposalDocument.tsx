
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
const LOGO_BASE64 = "data:image/jpeg;base64,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" as string; 

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const createPdfDoc = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageMargin = 20; 
    let currentY = 20;

    // --- LOGO ---
    // Só tenta adicionar se tiver um código colado na variável acima
    if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
        try { 
            // Remove cabeçalho se o usuário colou com ele (ex: data:image/png;base64,...)
            const cleanBase64 = LOGO_BASE64.includes('base64,') 
                ? LOGO_BASE64.split('base64,')[1] 
                : LOGO_BASE64;

            // Adiciona imagem (JPEG é mais compatível que PNG no jsPDF antigo)
            doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30); 
            currentY += 35;
        } catch (e) {
            console.error("Erro ao gerar imagem no PDF. Verifique o código Base64.", e);
            // Fallback: Escreve o nome se a imagem falhar
            doc.setFontSize(10);
            doc.text('ZILINSKI', (pageWidth / 2), currentY + 15, { align: 'center' });
            currentY += 25;
        }
    } else {
        // Espaço reservado se não tiver logo
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
        // Verifica se cabe na página, senão cria nova
        if (currentY > 240) { doc.addPage(); currentY = 20; }

        // Título da Opção
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Opção ${opt.optionNumber}`, pageMargin, currentY);
        currentY += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Descrição Principal (IDÊNTICO AO MODELO)
        const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
        const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
        // Corrimão fixo em 70cm conforme texto do modelo
        const widthCm = opt.stairWidth;
        
        const text1 = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${widthCm}cm de largura e com corrimão de 70cm.`;
        const splitText1 = doc.splitTextToSize(text1, pageWidth - (pageMargin * 2));
        doc.text(splitText1, pageMargin, currentY);
        currentY += (splitText1.length * 5) + 2;

        // Detalhes dos Degraus (IDÊNTICO AO MODELO)
        const stepH = opt.stepHeight.toFixed(2).replace('.', ',');
        const tread = opt.treadDepth.toFixed(2).replace('.', ',');
        
        const text2 = `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH}cm de altura e pisante de ${tread}cm com ${inputData.dampers} amortecedores de alívio.`;
        const splitText2 = doc.splitTextToSize(text2, pageWidth - (pageMargin * 2));
        doc.text(splitText2, pageMargin, currentY);
        currentY += (splitText2.length * 5) + 3;

        // VALOR ESTRUTURA (Apenas escada)
        const landingsPrice = opt.landings.reduce((acc, l) => acc + l.price, 0);
        const structureOnly = opt.totalPrice - landingsPrice;
        
        doc.text(`-Valor Escada (${opt.structureSteps} degraus): ${formatCurrencyBRL(structureOnly)}`, pageMargin, currentY);
        currentY += 6;

        // PATAMARES (DETALHADO)
        if (opt.landings.length > 0) {
            opt.landings.forEach((landing, idx) => {
                const lM = (landing.length / 100).toFixed(2).replace('.', ',');
                const wM = (landing.width / 100).toFixed(2).replace('.', ',');
                
                let label = opt.landings.length > 1 ? `Patamar ${idx + 1}` : `Patamar`;
                
                // Adiciona direção se não for reto
                if (landing.direction === 'left') label += ` (Curva p/ Esquerda)`;
                else if (landing.direction === 'right') label += ` (Curva p/ Direita)`;
                else label += ` (Reto)`;

                // Texto detalhando medida e preço individual
                doc.text(`-${label} em chapa xadrez 3mm (${lM}m x ${wM}m): ${formatCurrencyBRL(landing.price)}`, pageMargin, currentY);
                currentY += 6;
            });

            // Se houver mais de um patamar, mostra o total deles
            if (opt.landings.length > 1) {
                 doc.setFont('helvetica', 'bold');
                 doc.text(`-Total Patamares: ${formatCurrencyBRL(landingsPrice)}`, pageMargin, currentY);
                 doc.setFont('helvetica', 'normal');
                 currentY += 6;
            }
        }

        // FRETE
        if (freightCost + tollCost > 0) {
            doc.text(`- Frete ${formatCurrencyBRL(freightCost + tollCost)}`, pageMargin, currentY);
            currentY += 6;
        }

        // INSTALAÇÃO (FORMATO DO MODELO)
        if (installationCost > 0) {
             doc.text(`-Instalação ${formatCurrencyBRL(installationCost)} (Valor para local de fácil acesso)`, pageMargin, currentY);
        } else {
             doc.text(`-SEM INSTALAÇÃO (Responsabilidade do Cliente)`, pageMargin, currentY);
        }
        currentY += 6;

        // EXTRAS
        if (inputData.optionalItems.length > 0) {
            inputData.optionalItems.forEach(item => {
                doc.text(`- ${item.name}: ${formatCurrencyBRL(item.price)}`, pageMargin, currentY);
                currentY += 6;
            });
        }

        // TOTAL GERAL DA OPÇÃO
        const totalGeral = opt.totalPrice + freightCost + tollCost + installationCost + extrasCost;
        doc.text(`Total ${formatCurrencyBRL(totalGeral)}`, pageMargin, currentY);
        
        currentY += 15; // Espaço entre opções
    });

    // --- RODAPÉ / INFORMAÇÕES FINAIS ---
    // Verifica se cabe o rodapé, senão nova página
    if (currentY > 200) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    
    // Acabamento
    doc.setFont('helvetica', 'bold');
    doc.text('-Acabamento: fundo prime', pageMargin, currentY);
    currentY += 6;

    // Capacidades
    doc.text('-Capacidade máxima por degrau: 180k', pageMargin, currentY);
    currentY += 6;
    doc.text('-Capacidade máxima da escada: 360k', pageMargin, currentY);
    currentY += 10;

    // Pagamento
    doc.text('Formas de pagamento:', pageMargin, currentY);
    currentY += 6;
    
    // Linha À vista
    doc.setFont('helvetica', 'bold');
    doc.text('À vista: 5% de desconto, sendo 50% sinal restante e restante no dia da entrega', pageMargin, currentY);
    currentY += 6;

    // Linha À prazo
    doc.text('À prazo em ate 12x no cartão via link (juros conforme quantidade de vezes e', pageMargin, currentY);
    currentY += 5;
    doc.text('operadora)', pageMargin, currentY);
    currentY += 8;

    // Observação (Prumo)
    const obsText = 'OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a instalação e o bom funcionamento da escada.';
    const splitObs = doc.splitTextToSize(obsText, pageWidth - (pageMargin * 2));
    doc.text(splitObs, pageMargin, currentY);
    currentY += (splitObs.length * 5) + 8;

    // Prazo
    doc.text('Prazo de entrega: 20 dias úteis após pagamento do sinal.', pageMargin, currentY);
    currentY += 8;

    // PIX (IDÊNTICO AO MODELO)
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
            alert("Ocorreu um erro ao gerar o PDF. Se a imagem estiver muito pesada, tente uma menor.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100 text-center space-y-8">
      <div className="flex justify-start">
         <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-black flex items-center gap-1 uppercase underline">
            Voltar e Editar
         </button>
      </div>

      <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase">Proposta Pronta</h2>
          <button onClick={handleDownload} disabled={isGenerating} className="w-full bg-highlight text-white font-black py-4 rounded shadow-lg hover:bg-yellow-600 uppercase tracking-widest">
              {isGenerating ? 'Gerando...' : 'Baixar Orçamento PDF'}
          </button>
      </div>

      <div className="max-w-md mx-auto bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-black text-blue-900 mb-4">Finalizar Venda</h3>
          <div className="grid grid-cols-1 gap-2">
            {options.map(o => (
                <button key={o.optionNumber} onClick={() => navigate('/contrato', { state: { userData, selectedOption: o, inputData, freightCost, tollCost, installationCost, extrasCost: inputData.optionalItems.reduce((a, b) => a + b.price, 0) } })} className="bg-white border-2 border-blue-300 text-blue-700 font-bold py-3 rounded hover:bg-blue-600 hover:text-white transition-all">
                    Contrato Opção {o.optionNumber}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ProposalDocument;
