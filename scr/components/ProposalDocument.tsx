
import React, { useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL } from '../utils';

interface ProposalDocumentProps {
  option: ProposalOption;
  userData: UserData;
  inputData: CalculatorInput;
  freightCost: number;
  installationCost: number;
}

const ProposalDocument: React.FC<ProposalDocumentProps> = ({ option, userData, inputData, freightCost, installationCost }) => {

  const generatePdf = () => {
    const doc = new jsPDF();
    const finalPrice = option.totalPrice + freightCost + installationCost;

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor('#f6ad55');
    doc.text('Proposta Comercial - Escada Pré-Moldada', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Dados do Cliente
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Dados do Cliente', 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [['Nome', 'CPF/CNPJ', 'Endereço da Obra']],
      body: [[userData.name, userData.cpf || 'Não informado', userData.address]],
      theme: 'grid',
      headStyles: { fillColor: '#2d3748' },
    });

    // Detalhes da Escada
    const lastY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Especificações da Escada (Opção ' + option.optionNumber + ')', 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [['Item', 'Valor']],
      body: [
        ['Número de Degraus (pisos)', `${option.steps} unidades`],
        ['Altura por Degrau', `${option.stepHeight.toFixed(2)} cm`],
        ['Largura da Escada', `${option.stairWidth} cm`],
        ['Profundidade do Pisante', `${option.treadDepth} cm`],
        ['Comprimento Total da Escada', `${(option.totalLength / 100).toFixed(2)} m`],
      ],
      theme: 'striped',
      headStyles: { fillColor: '#2d3748' },
    });

    // Tabela de Custos
    const costY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Detalhamento de Valores', 14, costY);
    autoTable(doc, {
      startY: costY + 5,
      head: [['Descrição', 'Valor']],
      body: [
        ['Custo da Escada', formatCurrencyBRL(option.totalPrice)],
        ['Custo do Frete', formatCurrencyBRL(freightCost)],
        ['Custo de Instalação', formatCurrencyBRL(installationCost)],
      ],
      theme: 'grid',
      headStyles: { fillColor: '#2d3748' },
      didDrawPage: (data) => {
        // Total
        const yPos = (data.cursor?.y ?? 0) + 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Valor Total do Projeto:', data.settings.margin.left, yPos);
        // FIX: Cast `data.table` to `any` to access the `width` property. This is likely due to a type definition issue.
        doc.text(formatCurrencyBRL(finalPrice), data.settings.margin.left + (data.table as any).width, yPos, { align: 'right' });
      },
       margin: { left: 14, right: 14 },
    });

    // Rodapé
    const finalYFooter = (doc as any).lastAutoTable.finalY + 25;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Proposta válida por 15 dias.', 14, finalYFooter);
    doc.text('Agradecemos a preferência!', 14, finalYFooter + 5);

    doc.save(`proposta_escada_${userData.name.replace(/\s/g, '_')}.pdf`);
  };

  useEffect(() => {
    if (option && userData && inputData) {
      generatePdf();
    }
  }, [option, userData, inputData, freightCost, installationCost]);


  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-white">Proposta Gerada!</h2>
      <p className="text-gray-300 mb-6">
        Seu PDF foi gerado e o download deve iniciar automaticamente.
      </p>
      <button 
        onClick={generatePdf} 
        className="w-full bg-highlight text-primary font-bold py-3 px-4 rounded-md hover:bg-yellow-500 transition-transform transform hover:scale-105"
      >
        Baixar PDF Novamente
      </button>
    </div>
  );
};

export default ProposalDocument;
