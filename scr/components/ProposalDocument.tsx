import React, { useEffect, useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL } from '../utils';

type jsPDFWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
}

interface ProposalDocumentProps {
  options: ProposalOption[];
  userData: UserData;
  inputData: CalculatorInput;
  freightCost: number;
  tollCost: number;
  installationCost: number;
}

const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHySURBVHhe7d2/SgNBFAbw54yFGAk2dlaCFoKIjYVgIYWtYCe4iJdgIYiFNxAbQQvBRsA2AkEsvIWN2NiaNOi/gCgIYQ/O5SHC5nAn93IvBw88u3F2d+b3yWwWYxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECN3TQNQ+J8viRJkizL4zgqiyKqqlKapiRJhBBX9U/jOI6iKN7v9y+qH9/3RVEUhmFAKaVUKpXG49Gmqo/v+1IUhVRKvd5gMBiNRmOMj+qHpun+fL7TNA1RFL/fP4txVD8+70sS/f7+WlXV5XLp8/kUQjweD631+XwmSQLf96/qf31en5csW/l8Pp/P53K5Xq8lSQJwXEclSSLLcv1gMCilSqVSKBSKxWLdbrfRaKSU5h/gOA7P86qqLMsiCAJRFEEQBEFQlmVVVSHEcZzP54UQz/MOwxBCHMcZxyilcRxFUb/fP7aBqr/3+z3P8xDCu92OSCQSjUY1Gg3P80qpPM93u12apqWUvu/pdDpZloQQKaWz2czzPGMMAJ7naZpGKa21rus8z4uifD6f1trX9X0/Ho9FUYQQxhgA+L6vqup5nmEYKqXzfV+WZcsy3/d1GNf1i/q/u92mqmoYhiAIruv6vk9RFKCU6/V6KpWybNu2bV3XKZXjOMuybNu2bds2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMJc/o1hxP1XG77QAAAAASUVORK5CYII=';

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost }) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const createPdfDoc = useCallback(() => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const pageMargin = 14;
    let currentY = 0;

    const drawHeader = () => {
      doc.addImage(LOGO_BASE64, 'PNG', 88, 12, 35, 35);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text('Zilinski Distribuidora', pageWidth / 2, 55, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Av. Maria Luiza Americano 1954, São Paulo – SP', pageWidth / 2, 60, { align: 'center' });
      doc.text('Tel.: 019 992237714', pageWidth / 2, 65, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#f6ad55');
      doc.text('ORÇAMENTO', pageWidth / 2, 75, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageMargin, 85);
      autoTable(doc, {
        startY: 90,
        head: [['Nome do Cliente', 'Endereço da Obra']],
        body: [[userData.name, userData.address]],
        theme: 'grid',
        headStyles: { fillColor: '#2d3748' },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    };

    drawHeader();

    options.forEach((option) => {
      const finalPrice = option.totalPrice + freightCost + tollCost + installationCost;
      const optionTitle = `Opção ${option.optionNumber}`;
      const optionDescription = `Escada articulada lateral em aço carbono com corte a laser, com medidas de:
${(inputData.totalHeight / 100).toFixed(2)}m de altura, ${(option.totalLength / 100).toFixed(2)}m de comprimento, ${(option.stairWidth / 100).toFixed(2)}m de largura e com corrimão de 70cm.
- Com ${option.steps} degraus articulados com dimensões de ${option.stepHeight.toFixed(2)}cm de altura e pisante de ${option.treadDepth}cm com 4 amortecedores de alívio.`;
      const costs = [
        `- Valor Escada: ${formatCurrencyBRL(option.totalPrice)}`,
        `- Frete: ${formatCurrencyBRL(freightCost + tollCost)}`,
        `- Instalação: ${formatCurrencyBRL(installationCost)} (Valor para local de fácil acesso)`,
        `Total: ${formatCurrencyBRL(finalPrice)}`
      ];

      doc.setFontSize(10);
      const descriptionLines = doc.splitTextToSize(optionDescription, pageWidth - (pageMargin * 2));
      const descriptionHeight = doc.getTextDimensions(descriptionLines).h;
      doc.setFontSize(10);
      const costsHeight = doc.getTextDimensions(costs.join('\n')).h;
      const optionBlockHeight = 25 + descriptionHeight + costsHeight;

      if (currentY + optionBlockHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text(optionTitle, pageMargin, currentY);
      currentY += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(descriptionLines, pageMargin, currentY);
      currentY += descriptionHeight + 5;
      doc.setFont('helvetica', 'bold');
      doc.text(costs.join('\n'), pageMargin, currentY);
      currentY += costsHeight + 20;
    });

    const drawFooter = () => {
      const finalInfo = `
Acabamento: fundo prime
- Capacidade máxima por degrau: 180kg
- Capacidade máxima da escada: 360kg

Formas de pagamento:
À vista: 5% de desconto, sendo 50% sinal restante e restante no dia da entrega
À prazo: em ate 12x no cartão via link (juros conforme quantidade de vezes e operadora)

OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a
instalação e o bom funcionamento da escada.

Prazo de entrega: 20 dias úteis após pagamento.

Transferência via pix chave Cnpj:
28.869.537/0001-01   P G Zilinski ME
`;
      doc.setFontSize(10);
      const footerLines = doc.splitTextToSize(finalInfo.trim(), pageWidth - (pageMargin * 2));
      const footerHeight = doc.getTextDimensions(footerLines).h;

      if (currentY + footerHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(finalInfo.trim(), pageMargin, currentY);
    };
    
    drawFooter();
    return doc;
  }, [options, userData, inputData, freightCost, tollCost, installationCost]);

  const generatePdfPreview = useCallback(() => {
    const doc = createPdfDoc();
    const dataUri = doc.output('datauristring');
    setPdfDataUrl(dataUri);
  }, [createPdfDoc]);
  
  const downloadPdf = () => {
    try {
      const doc = createPdfDoc();
      doc.save(`proposta_escada_${userData.name.replace(/\s/g, '_')}.pdf`);
      setToast({ message: 'Download iniciado com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Falha ao gerar ou baixar PDF:", error);
      setToast({ message: 'Falha ao baixar o PDF. Tente novamente.', type: 'error' });
    }

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (options.length > 0 && userData && inputData) {
      generatePdfPreview();
    }
  }, [generatePdfPreview, options, userData, inputData]);

  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg text-center flex flex-col h-full">
      {toast && (
        <div
          role="alert"
          className={`fixed top-8 right-8 z-50 p-4 rounded-lg text-white shadow-xl ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <p className="font-bold">{toast.type === 'success' ? 'Sucesso!' : 'Erro'}</p>
          <p>{toast.message}</p>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4 text-white">Pré-visualização da Proposta</h2>
      <div className="flex-grow my-4 rounded-lg overflow-hidden">
        {pdfDataUrl ? (
          <iframe 
            src={pdfDataUrl} 
            className="w-full h-full border-2 border-accent"
            title="Pré-visualização da Proposta"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent">
            <p className="text-gray-400">Gerando pré-visualização...</p>
          </div>
        )}
      </div>
      <button 
        onClick={downloadPdf} 
        className="w-full bg-highlight text-primary font-bold py-3 px-4 rounded-md hover:bg-yellow-500 transition-transform transform hover:scale-105"
      >
        Baixar PDF
      </button>
    </div>
  );
};

export default ProposalDocument;