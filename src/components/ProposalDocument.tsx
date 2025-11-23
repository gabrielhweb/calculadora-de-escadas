import React, { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
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

// Cole o código Base64 da sua imagem entre as aspas abaixo:
const LOGO_BASE64 = 'data:image/jpeg;base64,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';

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const createPdfDoc = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageMargin = 20; // Margem esquerda
    let currentY = 20;

    // --- CABEÇALHO ---
    if (LOGO_BASE64) {
        try {
            doc.addImage(LOGO_BASE64, 'PNG', (pageWidth / 2) - 15, currentY, 30, 30);
        } catch (e) {
            console.warn("Erro ao carregar a logo no PDF.");
        }
    }
    currentY += 40;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0); // Preto
    doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Av. Maria Luiza Americano 1954, São Paulo – SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // --- OPÇÕES (Loop para gerar Opção 1, 2, 3...) ---
    options.forEach((opt) => {
        // Título da Opção
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Opção ${opt.optionNumber}`, pageMargin, currentY);
        currentY += 7;

        // Texto Descritivo 1 (Medidas Gerais)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Conversão para metros e formatação
        const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
        const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
        const largM = (opt.stairWidth / 100).toFixed(2).replace('.', ',');
        
        const text1 = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${alturaM}m de altura, ${compM}m de comprimento, ${largM}m de largura e com corrimão de 70cm.`;
        const splitText1 = doc.splitTextToSize(text1, pageWidth - (pageMargin * 2));
        doc.text(splitText1, pageMargin, currentY);
        currentY += (splitText1.length * 5) + 3;

        // Texto Descritivo 2 (Degraus)
        const alturaDegrau = opt.stepHeight.toFixed(2).replace('.', ',');
        const pisante = opt.treadDepth;
        
        const text2 = `-Com ${opt.steps} degraus articulados com dimensões de ${alturaDegrau}cm de altura e pisante de ${pisante}cm com 4 amortecedores de alívio.`;
        const splitText2 = doc.splitTextToSize(text2, pageWidth - (pageMargin * 2));
        doc.text(splitText2, pageMargin, currentY);
        currentY += (splitText2.length * 5) + 3;

        // Valores
        const valorEscada = formatCurrencyBRL(opt.totalPrice);
        const valorFrete = formatCurrencyBRL(freightCost + tollCost);
        const valorInstalacao = formatCurrencyBRL(installationCost);
        const totalGeral = formatCurrencyBRL(opt.totalPrice + freightCost + tollCost + installationCost);

        doc.text(`-Valor Escada: ${valorEscada}`, pageMargin, currentY);
        currentY += 6;
        doc.text(`- Frete ${valorFrete}`, pageMargin, currentY);
        currentY += 6;
        
        // Se a instalação não estiver inclusa (custo 0), podemos omitir ou mostrar 0
        doc.text(`-Instalação ${valorInstalacao} (Valor para local de fácil acesso)`, pageMargin, currentY);
        currentY += 6;

        doc.setFont('helvetica', 'bold');
        doc.text(`Total ${totalGeral}`, pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        
        currentY += 15; // Espaço entre opções

        // Se passar do fim da página, cria nova
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }
    });

    // --- RODAPÉ / CONDIÇÕES ---
    currentY += 5;
    
    // Verifica espaço para rodapé
    if (currentY > 200) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Acabamento: fundo prime', pageMargin, currentY);
    currentY += 6;
    
    doc.text('-Capacidade máxima por degrau: 180k', pageMargin, currentY);
    currentY += 6;
    doc.text('-Capacidade máxima da escada: 360k', pageMargin, currentY);
    currentY += 8;

    doc.text('Formas de pagamento:', pageMargin, currentY);
    currentY += 6;
    doc.text('À vista: 5% de desconto, sendo 50% sinal restante e restante no dia da entrega', pageMargin, currentY);
    currentY += 6;
    doc.text('À prazo em ate 12x no cartão via link (juros conforme quantidade de vezes e operadora)', pageMargin, currentY);
    currentY += 8;

    doc.text('OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a', pageMargin, currentY);
    currentY += 5;
    doc.text('instalação e o bom funcionamento da escada.', pageMargin, currentY);
    currentY += 8;

    doc.text('Prazo de entrega: 20 dias uteis após pagamento.', pageMargin, currentY);
    currentY += 8;

    doc.text('Transferência via pix chave Cnpj:', pageMargin, currentY);
    currentY += 6;
    doc.setFontSize(11);
    doc.text('28.869.537/0001-01   P G Zilinski ME', pageMargin, currentY);

    return doc;
  }, [options, userData, inputData, freightCost, tollCost, installationCost]);

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
        try {
            const doc = createPdfDoc();
            const filename = `orcamento_${userData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            doc.save(filename);
            setToast({ message: 'Download iniciado!', type: 'success' });
        } catch (error) {
            console.error("Falha PDF", error);
            setToast({ message: 'Erro ao gerar PDF.', type: 'error' });
        } finally {
            setIsGenerating(false);
            setTimeout(() => setToast(null), 3000);
        }
    }, 100);
  };

  return (
    <div className="bg-secondary p-8 rounded-lg shadow-md border border-gray-100 text-center flex flex-col h-full justify-center">
      {toast && (
        <div className={`fixed top-8 right-8 z-50 p-4 rounded-lg text-white font-bold shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-10">
         <button onClick={onBack} className="text-sm text-gray-400 hover:text-black transition-colors underline font-bold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
         </button>
      </div>

      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="bg-gray-50 p-6 rounded-full border border-gray-200 shadow-sm">
            {/* Ícone de PDF para a tela de download (não afeta o PDF gerado) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-highlight" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
        </div>
        
        <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-wide">Proposta Pronta</h2>
            <p className="text-gray-500">Clique abaixo para baixar o PDF oficial.</p>
        </div>

        <button 
            onClick={handleDownload} 
            disabled={isGenerating}
            className={`w-full max-w-sm font-bold py-4 px-6 rounded text-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3 uppercase tracking-wider
                ${isGenerating 
                    ? 'bg-gray-300 text-gray-500 cursor-wait' 
                    : 'bg-highlight text-white hover:bg-yellow-600'
                }`}
        >
            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
        </button>
      </div>
    </div>
  );
};

export default ProposalDocument;