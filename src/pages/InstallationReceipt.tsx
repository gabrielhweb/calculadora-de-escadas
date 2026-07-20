import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { formatCurrencyBRL } from '../utils';

// Helper component for input fields
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  unit?: string;
  placeholder?: string;
  helperText?: string;
  isTextArea?: boolean;
}> = ({ label, value, onChange, unit, placeholder, helperText, isTextArea }) => (
  <div>
    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">{label}</label>
    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-highlight">
      {isTextArea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2 bg-white dark:bg-gray-800 text-black dark:text-white outline-none min-h-[80px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2 bg-white dark:bg-gray-800 text-black dark:text-white outline-none"
        />
      )}
      {unit && (
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 flex items-center font-bold text-gray-600 dark:text-gray-300 border-l border-gray-300 dark:border-gray-600">
          {unit}
        </div>
      )}
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

export default function InstallationReceipt() {
  const [clientName, setClientName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [address, setAddress] = useState('');
  
  const [totalValue, setTotalValue] = useState('');
  const [paidValue, setPaidValue] = useState('');
  const [balanceValue, setBalanceValue] = useState('');
  
  const [paymentStatus, setPaymentStatus] = useState('quitado');
  const [observations, setObservations] = useState('');

  const [cep, setCep] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const fetchAddressByCep = async (cepValue: string) => {
    const cleanZip = cepValue.replace(/\D/g, '');
    if (cleanZip.length === 8) {
        setIsLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
            const data = await response.json();
            if (!data.erro) {
                const fetchedAddress = `${data.logradouro},  - ${data.bairro}, ${data.localidade} (${data.uf})`;
                setAddress(fetchedAddress);
            }
        } catch (e) {
            console.error("Erro ao buscar CEP", e);
        } finally {
            setIsLoadingCep(false);
        }
    }
  };

  const handleCepChange = (v: string) => {
    const masked = v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
    setCep(masked);
  };

  const handleCepBlur = () => {
    fetchAddressByCep(cep);
  };

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

  const calculateBalance = () => {
    const total = parseFloat(totalValue) || 0;
    const paid = parseFloat(paidValue) || 0;
    const balance = total - paid;
    setBalanceValue(balance > 0 ? balance.toFixed(2) : '0.00');
  };

  const handleGeneratePDF = () => {
    if (!clientName || !address) {
      alert('Por favor, preencha pelo menos o Nome do Cliente e o Endereço.');
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    const addLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
    }

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TERMO DE ENTREGA, INSTALAÇÃO E ACERTO FINAL', 105, yPos, { align: 'center' });
    yPos += 15;

    // Company Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Zilinski Escadas – CNPJ 28.869.537/0001-01', margin, yPos);
    yPos += 12;

    // Client Info
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

    doc.text(`Endereço da instalação: ${address}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 12;

    // First Paragraph
    const para1 = "O(a) cliente declara que a escada contratada foi entregue e instalada pela Zilinski Escadas, tendo recebido as orientações necessárias sobre seu funcionamento e utilização.";
    const splitPara1 = doc.splitTextToSize(para1, 170);
    doc.text(splitPara1, margin, yPos);
    yPos += (splitPara1.length * 5) + 5;

    // Values Intro
    doc.text("Conforme as condições de pagamento previamente acordadas, ficam registrados:", margin, yPos);
    yPos += 8;

    // Values
    doc.setFont('helvetica', 'bold');
    doc.text(`Valor total contratado: ${formatCurrencyBRL(parseFloat(totalValue) || 0)}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 8;

    doc.text(`Valor já pago: ${formatCurrencyBRL(parseFloat(paidValue) || 0)}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 8;

    doc.text(`Saldo final: ${formatCurrencyBRL(parseFloat(balanceValue) || 0)}`, margin, yPos);
    yPos += 2;
    addLine(yPos);
    yPos += 10;

    // Second Paragraph
    doc.setFont('helvetica', 'normal');
    const para2 = "O saldo final deverá ser quitado na presente data, após a conclusão da entrega e instalação, conforme as condições acordadas entre as partes.";
    const splitPara2 = doc.splitTextToSize(para2, 170);
    doc.text(splitPara2, margin, yPos);
    yPos += (splitPara2.length * 5) + 5;

    // Payment Status
    doc.setFont('helvetica', 'bold');
    doc.text("Situação do pagamento:", margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    const isQuitado = paymentStatus === 'quitado';
    doc.text(`${isQuitado ? '( X )' : '(   )'} Saldo final quitado nesta data.`, margin + 5, yPos);
    yPos += 6;
    doc.text(`${!isQuitado ? '( X )' : '(   )'} Saldo final pendente de pagamento.`, margin + 5, yPos);
    yPos += 12;

    // Observations
    doc.setFont('helvetica', 'bold');
    doc.text("Observações:", margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    if (observations) {
        const splitObs = doc.splitTextToSize(observations, 170);
        doc.text(splitObs, margin, yPos);
        yPos += (splitObs.length * 5) + 5;
    } else {
        addLine(yPos);
        yPos += 10;
        addLine(yPos);
        yPos += 10;
    }

    // Agreement line
    doc.text("Por estar de acordo, o(a) cliente assina o presente termo.", margin, yPos);
    yPos += 25;

    // Signatures
    addLine(yPos);
    yPos += 5;
    doc.text(`Assinatura do cliente:`, margin, yPos);
    yPos += 8;
    doc.text(`Nome: ${clientName}`, margin, yPos);
    yPos += 25;

    addLine(yPos);
    yPos += 5;
    doc.text(`Responsável Zilinski Escadas:`, margin, yPos);
    
    yPos += 15;
    doc.text(`Data: ____/____/______`, margin, yPos);

    doc.save(`Termo_Instalacao_${clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-highlight px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
            <span className="text-2xl">🔧</span> Termo de Instalação
          </h2>
          <p className="text-yellow-100 text-sm mt-1">Gere o Termo de Entrega, Instalação e Acerto Final.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField 
              label="Nome do Cliente *" 
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
            <div onBlur={handleCepBlur}>
              <InputField 
                label="CEP" 
                value={cep} 
                onChange={(e) => handleCepChange(e.target.value)} 
                placeholder="00000-000"
                helperText={isLoadingCep ? "Buscando endereço..." : "Preenche o endereço automaticamente."}
              />
            </div>
            <InputField 
              label="Endereço da Instalação *" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Rua, Número, Bairro, Cidade"
            />

             <InputField 
              label="Valor Total Contratado" 
              value={totalValue} 
              onChange={(e) => {
                  setTotalValue(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'));
              }} 
              unit="R$"
              placeholder="Ex: 5000.00"
            />

            <InputField 
              label="Valor Já Pago (Sinal + Adicionais)" 
              value={paidValue} 
              onChange={(e) => {
                  setPaidValue(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'));
              }} 
              unit="R$"
              placeholder="Ex: 2500.00"
            />

            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <InputField 
                    label="Saldo Final (A Pagar)" 
                    value={balanceValue} 
                    onChange={(e) => setBalanceValue(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
                    unit="R$"
                    placeholder="Ex: 2500.00"
                    />
                </div>
                <button 
                    onClick={calculateBalance}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded border border-gray-300 dark:border-gray-500 transition-colors h-[42px]"
                >
                    Calcular
                </button>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">Situação do Pagamento</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus-within:ring-2 focus-within:ring-highlight"
              >
                <option value="quitado">Saldo final quitado nesta data</option>
                <option value="pendente">Saldo final pendente de pagamento</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
                <InputField 
                label="Observações" 
                value={observations} 
                onChange={(e) => setObservations(e.target.value)} 
                placeholder="Detalhes adicionais, pendências, etc."
                isTextArea={true}
                />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGeneratePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Gerar Termo de Instalação (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
