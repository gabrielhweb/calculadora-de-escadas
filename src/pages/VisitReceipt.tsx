import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { formatCurrencyBRL } from '../utils';

// Helper component for input fields
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
  placeholder?: string;
  helperText?: string;
}> = ({ label, value, onChange, unit, placeholder, helperText }) => (
  <div>
    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">{label}</label>
    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-highlight">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 bg-white dark:bg-gray-800 text-black dark:text-white outline-none"
      />
      {unit && (
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 flex items-center font-bold text-gray-600 dark:text-gray-300 border-l border-gray-300 dark:border-gray-600">
          {unit}
        </div>
      )}
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

export default function VisitReceipt() {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitValue, setVisitValue] = useState('');

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    // Helper functions
    const addText = (text: string, x: number, y: number, font: 'helvetica', style: 'normal' | 'bold', size: number) => {
      doc.setFont(font, style);
      doc.setFontSize(size);
      doc.text(text, x, y);
    };

    const addLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
    }

    // Header
    addText('RECIBO / TERMO DE VISITA TÉCNICA', 105, yPos, 'helvetica', 'bold', 16);
    doc.text('RECIBO / TERMO DE VISITA TÉCNICA', 105, yPos, { align: 'center' });
    yPos += 15;

    // Company Info
    addText('Zilinski Escadas / Zilinski Distribuidora', margin, yPos, 'helvetica', 'bold', 10);
    yPos += 6;
    addText('CNPJ: 28.869.537/0001-01', margin, yPos, 'helvetica', 'normal', 10);
    yPos += 6;
    addText('Sede: São Paulo/SP | Fabricação: Campinas/SP', margin, yPos, 'helvetica', 'normal', 10);
    yPos += 15;

    // Receipt Number
    addText(`Recibo nº: ${receiptNumber}`, margin, yPos, 'helvetica', 'bold', 12);
    yPos += 12;

    // Client Info Form
    addText(`Cliente: ${clientName}`, margin, yPos, 'helvetica', 'normal', 11);
    addLine(yPos + 2);
    yPos += 8;

    addText(`CPF/CNPJ: ${cpfCnpj}`, margin, yPos, 'helvetica', 'normal', 11);
    addLine(yPos + 2);
    yPos += 8;

    addText(`Endereço da visita: ${address}`, margin, yPos, 'helvetica', 'normal', 11);
    addLine(yPos + 2);
    yPos += 8;

    addText(`Data da visita: ${visitDate}              Horário: ${visitTime}`, margin, yPos, 'helvetica', 'normal', 11);
    addLine(yPos + 2);
    yPos += 15;

    // Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const bodyText = "Recebi nesta data a visita técnica realizada pela Zilinski Escadas, referente à análise de medidas, viabilidade\ntécnica, orientações e estudo preliminar para possível fabricação de escada sob medida.";
    doc.text(bodyText, margin, yPos);
    yPos += 15;

    // Conditions
    addText('Condições:', margin, yPos, 'helvetica', 'bold', 11);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const formattedValue = formatCurrencyBRL(parseFloat(visitValue) || 0);

    const conditions = [
      `1. O valor da visita técnica é de ${formattedValue}.`,
      `2. Caso o cliente não dê continuidade ao projeto no prazo de até 14 dias corridos após a visita, o valor deverá ser\npago integralmente.`,
      `3. Caso o cliente feche o projeto dentro do prazo de 14 dias corridos, o valor de ${formattedValue} será abatido do valor\ntotal contratado.`,
      `4. Após esse prazo, eventual contratação futura poderá ser considerada novo orçamento, sem obrigação de\nabatimento.`,
      `5. A visita técnica não obriga nenhuma das partes à contratação final.`
    ];

    conditions.forEach(condition => {
      const splitText = doc.splitTextToSize(condition, 170);
      doc.text(splitText, margin, yPos);
      yPos += (splitText.length * 5) + 2; 
    });

    yPos += 10;

    // Payment Method
    addText('Forma de pagamento (se aplicável): PIX ( )  Dinheiro ( )  Transferência ( )  Outro: __________', margin, yPos, 'helvetica', 'bold', 10);
    yPos += 30;

    // Signatures
    addLine(yPos);
    yPos += 5;
    addText('Assinatura do Cliente', margin, yPos, 'helvetica', 'normal', 10);
    yPos += 20;

    addLine(yPos);
    yPos += 5;
    addText('Representante Zilinski Escadas', margin, yPos, 'helvetica', 'normal', 10);
    yPos += 15;

    addText('Data: ____/____/______', margin, yPos, 'helvetica', 'normal', 10);

    doc.save(`Recibo_Visita_${clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-highlight px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
            <span className="text-2xl">📝</span> Gerar Recibo de Visita
          </h2>
          <p className="text-yellow-100 text-sm mt-1">Preencha os dados abaixo para gerar o PDF do recibo.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Número do Recibo" 
              value={receiptNumber} 
              onChange={(e) => setReceiptNumber(e.target.value)} 
              placeholder="Ex: 001"
            />
             <InputField 
              label="Nome do Cliente" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              placeholder="Nome completo ou Razão Social"
            />
            <InputField 
              label="CPF/CNPJ" 
              value={cpfCnpj} 
              onChange={(e) => setCpfCnpj(e.target.value)} 
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            <InputField 
              label="Endereço da Visita" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Rua, Número, Bairro, Cidade"
            />
             <InputField 
              label="Data da Visita" 
              value={visitDate} 
              onChange={(e) => setVisitDate(e.target.value)} 
              placeholder="DD/MM/AAAA"
            />
            <InputField 
              label="Horário" 
              value={visitTime} 
              onChange={(e) => setVisitTime(e.target.value)} 
              placeholder="HH:MM"
            />
             <InputField 
              label="Valor da Visita" 
              value={visitValue} 
              onChange={(e) => setVisitValue(e.target.value)} 
              unit="R$"
              placeholder="Ex: 380"
              helperText="Padrão R$ 380,00. Informe apenas números."
            />
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGeneratePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Gerar PDF do Recibo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
