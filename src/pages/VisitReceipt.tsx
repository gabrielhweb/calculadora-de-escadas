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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [otherPaymentMethod, setOtherPaymentMethod] = useState('');

  const handleCpfCnpjChange = (v: string) => {
    let unmasked = v.replace(/\D/g, '');
    if (unmasked.length <= 11) {
      unmasked = unmasked.replace(/(\d{3})(\d)/, '$1.$2');
      unmasked = unmasked.replace(/(\d{3})(\d)/, '$1.$2');
      unmasked = unmasked.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      unmasked = unmasked.slice(0, 14);
      unmasked = unmasked.replace(/^(\d{2})(\d)/, '$1.$2');
      unmasked = unmasked.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      unmasked = unmasked.replace(/\.(\d{3})(\d)/, '.$1/$2');
      unmasked = unmasked.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCpfCnpj(unmasked);
  };

  const handleDateChange = (v: string) => {
    let unmasked = v.replace(/\D/g, '').slice(0, 8);
    if (unmasked.length >= 5) {
      unmasked = `${unmasked.slice(0, 2)}/${unmasked.slice(2, 4)}/${unmasked.slice(4)}`;
    } else if (unmasked.length >= 3) {
      unmasked = `${unmasked.slice(0, 2)}/${unmasked.slice(2)}`;
    }
    setVisitDate(unmasked);
  };

  const handleTimeChange = (v: string) => {
    let unmasked = v.replace(/\D/g, '').slice(0, 4);
    if (unmasked.length >= 3) {
      unmasked = `${unmasked.slice(0, 2)}:${unmasked.slice(2)}`;
    }
    setVisitTime(unmasked);
  };

  const handleGeneratePDF = () => {
    if (!receiptNumber || !clientName || !cpfCnpj || !address || !visitDate || !visitTime || !visitValue || !paymentMethod) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    // Helper functions
    const addLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
    }

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RECIBO / TERMO DE VISITA TÉCNICA', 105, yPos, { align: 'center' });
    yPos += 15;

    // Company Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ZILINSKI DISTRIBUIDORA', margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text('CNPJ: 28.869.537/0001-01', margin, yPos);
    yPos += 5;
    doc.text('Sede: São Paulo/SP | Fabricação: Campinas/SP', margin, yPos);
    yPos += 15;

    // Receipt Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Recibo nº: ${receiptNumber}`, margin, yPos);
    yPos += 15;

    // Client Info Form
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text(`Cliente: ${clientName}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 8;

    doc.text(`CPF/CNPJ: ${cpfCnpj}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 8;

    doc.text(`Endereço da visita: ${address}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 8;

    doc.text(`Data da visita: ${visitDate}`, margin, yPos);
    doc.text(`Horário: ${visitTime}`, 90, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 15;

    // Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const bodyText = "Recebi nesta data a visita técnica realizada pela ZILINSKI DISTRIBUIDORA, referente à análise de medidas, viabilidade\ntécnica, orientações e estudo preliminar para possível fabricação de escada sob medida.";
    doc.text(bodyText, margin, yPos);
    yPos += 15;

    // Conditions
    doc.setFont('helvetica', 'bold');
    doc.text('Condições:', margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const formattedValue = formatCurrencyBRL(parseFloat(visitValue) || 0);

    const conditions = [
      { num: '1.', text: `O valor da visita técnica é de ${formattedValue}.` },
      { num: '2.', text: `Caso o cliente não dê continuidade ao projeto no prazo de até 14 dias corridos após a visita, o valor deverá ser pago integralmente.` },
      { num: '3.', text: `Caso o cliente feche o projeto dentro do prazo de 14 dias corridos, o valor de ${formattedValue} será abatido do valor total contratado.` },
      { num: '4.', text: `Após esse prazo, eventual contratação futura poderá ser considerada novo orçamento, sem obrigação de abatimento.` },
      { num: '5.', text: `A visita técnica não obriga nenhuma das partes à contratação final.` }
    ];

    conditions.forEach(condition => {
      doc.text(condition.num, margin, yPos);
      const splitText = doc.splitTextToSize(condition.text, 165);
      doc.text(splitText, margin + 5, yPos);
      yPos += (splitText.length * 5) + 2; 
    });

    yPos += 10;

    // Payment Method
    doc.setFont('helvetica', 'bold');
    const pixChecked = paymentMethod === 'PIX' ? '(X)' : '( )';
    const moneyChecked = paymentMethod === 'Dinheiro' ? '(X)' : '( )';
    const transferChecked = paymentMethod === 'Transferência' ? '(X)' : '( )';
    const otherText = paymentMethod === 'Outro' ? `  ${otherPaymentMethod || '                  '}  ` : '_________________';
    
    doc.text(`Forma de pagamento (se aplicável): PIX ${pixChecked}  Dinheiro ${moneyChecked}  Transferência ${transferChecked}  Outro: ${otherText}`, margin, yPos);
    yPos += 30;

    // Signatures
    addLine(yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Cliente', margin, yPos);
    yPos += 20;

    addLine(yPos);
    yPos += 5;
    doc.text('Representante ZILINSKI DISTRIBUIDORA', margin, yPos);
    yPos += 15;

    doc.text('Data: ____/____/______', margin, yPos);

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
              onChange={(e) => setReceiptNumber(e.target.value.replace(/\D/g, ''))} 
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
              onChange={(e) => handleCpfCnpjChange(e.target.value)} 
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
              onChange={(e) => handleDateChange(e.target.value)} 
              placeholder="DD/MM/AAAA"
            />
            <InputField 
              label="Horário" 
              value={visitTime} 
              onChange={(e) => handleTimeChange(e.target.value)} 
              placeholder="HH:MM"
            />
             <InputField 
              label="Valor da Visita" 
              value={visitValue} 
              onChange={(e) => setVisitValue(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
              unit="R$"
              placeholder="Ex: 380.00"
              helperText="Padrão R$ 380,00. Informe apenas números."
            />
            <div>
              <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus-within:ring-2 focus-within:ring-highlight"
              >
                <option value="">Nenhuma / Deixar em Branco</option>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            {paymentMethod === 'Outro' && (
              <InputField 
                label="Qual outra forma de pagamento?" 
                value={otherPaymentMethod} 
                onChange={(e) => setOtherPaymentMethod(e.target.value)} 
                placeholder="Ex: Cartão de Crédito"
              />
            )}
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
