import React, { useState } from 'react';
import { generateCustomReceiptPDF, CustomReceiptData } from '../utils/customReceiptGenerator';

const InputField = ({ label, value, onChange, placeholder, type = 'text', helperText }: any) => (
  <div>
    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus-within:ring-2 focus-within:ring-highlight"
      placeholder={placeholder}
    />
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

export default function CustomPaymentReceipt() {
  const [formData, setFormData] = useState<CustomReceiptData>({
    type: 'FINAL',
    clientName: '',
    cpfCnpj: '',
    amountReceived: 0,
    amountText: '',
    productDescription: '',
    paymentMethod: 'PIX',
    datetime: '',
    transactionId: ''
  });

  const handleGenerate = () => {
    if (!formData.clientName || !formData.cpfCnpj || !formData.amountReceived || !formData.amountText || !formData.productDescription) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, CNPJ/CPF, Valor, Valor por Extenso e Descrição).');
      return;
    }
    generateCustomReceiptPDF(formData);
  };

  const handleCpfCnpjChange = (e: any) => {
    let unmasked = e.target.value.replace(/\D/g, '');
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
    setFormData({ ...formData, cpfCnpj: unmasked });
  };

  const handleDateTimeChange = (e: any) => {
    let unmasked = e.target.value.replace(/\D/g, '').slice(0, 14);
    let formatted = unmasked;
    if (unmasked.length > 0) {
        formatted = unmasked.slice(0, 2);
        if (unmasked.length > 2) formatted += '/' + unmasked.slice(2, 4);
        if (unmasked.length > 4) formatted += '/' + unmasked.slice(4, 8);
        if (unmasked.length > 8) formatted += ' - ' + unmasked.slice(8, 10);
        if (unmasked.length > 10) formatted += ':' + unmasked.slice(10, 12);
        if (unmasked.length > 12) formatted += ':' + unmasked.slice(12, 14);
    }
    setFormData({ ...formData, datetime: formatted });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gerador de Recibos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Crie recibos de pagamento avulsos ou de quitação</p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Gerar PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b pb-2 dark:border-gray-700">Informações do Recibo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">Tipo de Recibo</label>
            <select
              value={formData.type}
              onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-black dark:text-white outline-none focus-within:ring-2 focus-within:ring-highlight font-semibold"
            >
              <option value="INICIAL">PAGAMENTO INICIAL (SINAL)</option>
              <option value="FINAL">PAGAMENTO FINAL (QUITAÇÃO RESTANTE)</option>
              <option value="TOTAL">PAGAMENTO TOTAL (VALOR INTEGRAL)</option>
            </select>
          </div>

          <InputField
            label="Nome do Cliente / Empresa"
            value={formData.clientName}
            onChange={(e: any) => setFormData({ ...formData, clientName: e.target.value })}
            placeholder="Ex: Benvenuto Eventos LTDA"
          />

          <InputField
            label="CPF ou CNPJ"
            value={formData.cpfCnpj}
            onChange={handleCpfCnpjChange}
            placeholder="Ex: 52.959.415/0001-90"
          />

          <InputField
            label="Valor Recebido (R$)"
            type="number"
            value={formData.amountReceived || ''}
            onChange={(e: any) => setFormData({ ...formData, amountReceived: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
            placeholder="Ex: 2540.00"
          />

          <InputField
            label="Valor por Extenso"
            value={formData.amountText}
            onChange={(e: any) => setFormData({ ...formData, amountText: e.target.value })}
            placeholder="Ex: dois mil quinhentos e quarenta reais"
          />

          <div className="md:col-span-2">
            <InputField
              label="Descrição do Produto"
              value={formData.productDescription}
              onChange={(e: any) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Ex: escada articulada lateral em aço carbono"
              helperText="Irá preencher a frase: 'da compra de uma <DESCRIÇÃO>'"
            />
          </div>

          <div className="md:col-span-2 border-t dark:border-gray-700 pt-6 mt-2">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Detalhes da Transação</h3>
          </div>

          <InputField
            label="Forma de Pagamento"
            value={formData.paymentMethod}
            onChange={(e: any) => setFormData({ ...formData, paymentMethod: e.target.value })}
            placeholder="Ex: PIX, Transferência, Dinheiro..."
          />

          <InputField
            label="Data e Horário"
            value={formData.datetime}
            onChange={handleDateTimeChange}
            placeholder="Ex: 19/03/2026 - 12:25:49"
          />

          <div className="md:col-span-2">
            <InputField
              label="ID da Transação (opcional)"
              value={formData.transactionId}
              onChange={(e: any) => setFormData({ ...formData, transactionId: e.target.value })}
              placeholder="Ex: E18236120202603191525s191952a6f2"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Gerar Recibo (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
