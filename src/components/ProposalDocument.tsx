
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

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const createProposalPdf = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageMargin = 20; 
    let currentY = 30;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Av. Maria Luiza Americano 1954, São Paulo – SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    options.forEach((opt) => {
        if (currentY > 230) { doc.addPage(); currentY = 30; }
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(`Opção ${opt.optionNumber}`, pageMargin, currentY); currentY += 8;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        
        const hM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
        const lM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
        const desc = `Escada articulada lateral em aço carbono com corte à laser, com medidas de: ${hM}m de altura, ${lM}m de comprimento, ${opt.stairWidth}cm de largura e com corrimão de 70cm.`;
        const lines = doc.splitTextToSize(desc, pageWidth - 40);
        doc.text(lines, pageMargin, currentY);
        currentY += (lines.length * 5) + 2;

        doc.text(`-Com ${opt.steps} degraus articulados com dimensões de ${opt.stepHeight.toFixed(2).replace('.', ',')}cm de altura e pisante de ${opt.treadDepth.toFixed(2).replace('.', ',')}cm com ${inputData.dampers} amortecedores de alívio.`, pageMargin, currentY);
        currentY += 6;

        const basePrice = opt.totalPrice - (opt.landing?.active ? opt.landing.price : 0);
        doc.text(`-Valor Escada: ${formatCurrencyBRL(basePrice)}`, pageMargin, currentY); currentY += 6;

        if (opt.landing?.active) {
            const lPL = (opt.landing.length / 100).toFixed(2).replace('.', ',');
            const lPW = (opt.landing.width / 100).toFixed(2).replace('.', ',');
            doc.setFont('helvetica', 'bold');
            doc.text(`-PATAMAR EM CHAPA XADREZ 3MM, COM MEDIDAS DE ${lPL}M X ${lPW}M:`, pageMargin, currentY); currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.text(`-Valor Patamar ${formatCurrencyBRL(opt.landing.price)}`, pageMargin, currentY); currentY += 6;
        }

        if (freightCost + tollCost > 0) {
            doc.text(`- Frete ${formatCurrencyBRL(freightCost + tollCost)}`, pageMargin, currentY); currentY += 6;
        }

        const instText = installationCost > 0 ? `-Instalação ${formatCurrencyBRL(installationCost)}` : `-SEM INSTALAÇÃO`;
        doc.text(instText, pageMargin, currentY); currentY += 8;

        const total = opt.totalPrice + freightCost + tollCost + installationCost;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total ${formatCurrencyBRL(total)}`, pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 15;
    });

    // Rodapé fixo
    if (currentY > 180) { doc.addPage(); currentY = 30; }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('-Acabamento: fundo prime | Capacidade: 180k/degrau | 360k/escada', pageMargin, currentY); currentY += 10;
    doc.text('Pagamento: 5% desc. à vista (50% sinal) ou 12x no cartão via link.', pageMargin, currentY); currentY += 10;
    doc.text('Prazo: 20 dias úteis. Pix CNPJ: 28.869.537/0001-01', pageMargin, currentY);

    doc.save(`orcamento_${userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
  }, [options, inputData, freightCost, tollCost, installationCost, userData.name]);

  const handleGoToContract = (opt: ProposalOption) => {
    navigate('/contrato', { 
        state: { 
            userData, 
            selectedOption: opt, 
            inputData, 
            freightCost, 
            tollCost, 
            installationCost,
            extrasCost: 0 // Caso use itens opcionais no futuro
        } 
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl border-2 border-gray-100 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-black text-gray-900 uppercase">Proposta Final</h2>
        <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-black uppercase underline">Voltar</button>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 text-center">
        <h3 className="font-bold text-gray-800 mb-2">PDF DE ORÇAMENTO</h3>
        <p className="text-xs text-gray-500 mb-4">Gera o arquivo com as 3 opções para escolha do cliente.</p>
        <button onClick={createProposalPdf} className="w-full bg-highlight text-white font-black py-5 rounded shadow-xl hover:brightness-110 transition-all uppercase">
          Baixar Orçamento (3 Opções)
        </button>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-blue-900 font-black mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            VENDA FECHADA?
        </h3>
        <p className="text-xs text-blue-700 mb-4 font-bold">Clique na opção escolhida para gerar o contrato:</p>
        <div className="space-y-2">
            {options.map(o => (
                <button 
                  key={o.optionNumber} 
                  onClick={() => handleGoToContract(o)}
                  className="w-full bg-white border-2 border-blue-400 text-blue-700 font-bold py-3 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm uppercase text-xs"
                >
                    Gerar Contrato - Opção {o.optionNumber}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProposalDocument;
