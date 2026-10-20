import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SavedContract } from '../types';
import { formatCurrencyBRL } from '../utils';
import {
  InstallationTermData,
  InstallationTermOrientations,
  generateInstallationReceiptPDF
} from '../utils/installationReceiptGenerator';

const createEmptyTerm = (): InstallationTermData => ({
  clientName: '',
  cpfCnpj: '',
  date: new Date().toLocaleDateString('pt-BR'),
  address: '',
  totalValue: '',
  paidValue: '',
  balanceValue: '',
  paymentStatus: 'quitado',
  orientations: {
    pintura: false,
    paredePrumo: false,
    reforco: false,
    fixacao: false,
    cuidados: false,
    ajustes: false
  },
  observations: ''
});

export default function InstallationReceipt() {
  const [mode, setMode] = useState<'double' | 'single'>('double');
  const [activeTab, setActiveTab] = useState<'term1' | 'term2'>('term1');

  const [term1, setTerm1] = useState<InstallationTermData>(createEmptyTerm());
  const [term2, setTerm2] = useState<InstallationTermData>(createEmptyTerm());

  const [cep1, setCep1] = useState('');
  const [cep2, setCep2] = useState('');
  const [isLoadingCep1, setIsLoadingCep1] = useState(false);
  const [isLoadingCep2, setIsLoadingCep2] = useState(false);

  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Carregar contratos salvos para preenchimento rápido
  useEffect(() => {
    const fetchContracts = async () => {
      setLoadingContracts(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        const list: SavedContract[] = [];
        querySnapshot.forEach(d => {
          list.push({ id: d.id, ...d.data() } as SavedContract);
        });
        // Ordena por nome do cliente
        list.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
        setContracts(list);
      } catch (err) {
        console.error('Erro ao buscar contratos no Firebase:', err);
      } finally {
        setLoadingContracts(false);
      }
    };
    fetchContracts();
  }, []);

  const handleApplyContract = (contractId: string, target: 'term1' | 'term2') => {
    if (!contractId) return;
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    let parsedData: any = contract.contractData;
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData);
        while (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
      } catch (e) {
        parsedData = null;
      }
    }

    const uData = parsedData?.userData || {};
    const cName = uData.name || contract.clientName || '';
    const docNumber = uData.cpf || uData.cpfCnpj || '';

    // Monta endereço completo
    let fullAddr = '';
    if (uData.street) {
      fullAddr = uData.street;
      if (uData.number) fullAddr += `, ${uData.number}`;
      if (uData.neighborhood) fullAddr += ` - ${uData.neighborhood}`;
      if (uData.city) fullAddr += `, ${uData.city}`;
      if (uData.state) fullAddr += ` (${uData.state})`;
    } else if (uData.address) {
      fullAddr = uData.address;
    }

    // Valores
    const total = Number(contract.totalValue || parsedData?.totalValue || parsedData?.finalStairPrice || 0);
    const downPayment = Number(parsedData?.paymentDetails?.downPayment || (total > 0 ? total * 0.5 : 0));
    const balance = total - downPayment;

    const termData: InstallationTermData = {
      clientName: cName,
      cpfCnpj: docNumber,
      date: new Date().toLocaleDateString('pt-BR'),
      address: fullAddr,
      totalValue: total > 0 ? total.toFixed(2).replace('.', ',') : '',
      paidValue: downPayment > 0 ? downPayment.toFixed(2).replace('.', ',') : '',
      balanceValue: balance > 0 ? balance.toFixed(2).replace('.', ',') : '0,00',
      paymentStatus: 'quitado',
      orientations: {
        pintura: false,
        paredePrumo: false,
        reforco: false,
        fixacao: false,
        cuidados: false,
        ajustes: false
      },
      observations: ''
    };

    if (target === 'term1') {
      setTerm1(termData);
      if (uData.zip) setCep1(uData.zip);
    } else {
      setTerm2(termData);
      if (uData.zip) setCep2(uData.zip);
    }
  };

  const handleCopyTerm1ToTerm2 = () => {
    setTerm2({
      ...term1,
      orientations: { ...term1.orientations }
    });
    setCep2(cep1);
  };

  const handleClearTerm2 = () => {
    setTerm2(createEmptyTerm());
    setCep2('');
  };

  const handleClearAll = () => {
    setTerm1(createEmptyTerm());
    setTerm2(createEmptyTerm());
    setCep1('');
    setCep2('');
  };

  const formatCpfCnpj = (v: string) => {
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
    return unmasked;
  };

  const fetchCep = async (cleanZip: string, target: 'term1' | 'term2') => {
    if (cleanZip.length !== 8) return;
    const setLoading = target === 'term1' ? setIsLoadingCep1 : setIsLoadingCep2;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const full = `${data.logradouro},  - ${data.bairro}, ${data.localidade} (${data.uf})`;
        if (target === 'term1') {
          setTerm1(prev => ({ ...prev, address: full }));
        } else {
          setTerm2(prev => ({ ...prev, address: full }));
        }
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = (target: 'term1' | 'term2') => {
    const current = target === 'term1' ? term1 : term2;
    const parseVal = (str?: string | number) => {
      if (!str) return 0;
      const clean = String(str).replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };

    const total = parseVal(current.totalValue);
    const paid = parseVal(current.paidValue);
    const bal = total - paid;
    const formatted = bal > 0 ? bal.toFixed(2).replace('.', ',') : '0,00';

    if (target === 'term1') {
      setTerm1(prev => ({ ...prev, balanceValue: formatted }));
    } else {
      setTerm2(prev => ({ ...prev, balanceValue: formatted }));
    }
  };

  const handleGeneratePDF = () => {
    const isTerm1Empty = !term1.clientName?.trim() && !term1.address?.trim();
    const isTerm2Empty = !term2.clientName?.trim() && !term2.address?.trim();

    if (mode === 'double' && isTerm1Empty && isTerm2Empty) {
      if (!confirm('Os dois termos estão com os dados em branco. Deseja gerar o PDF em folha dupla com as linhas em branco para preenchimento manual à caneta?')) {
        return;
      }
    } else if (mode === 'single' && isTerm1Empty) {
      if (!confirm('O termo está com os dados em branco. Deseja gerar o PDF em folha única para preenchimento à caneta?')) {
        return;
      }
    }

    generateInstallationReceiptPDF(term1, mode === 'double' ? term2 : null, mode);
  };

  // Helper para atualizar campos do termo ativo
  const currentTerm = activeTab === 'term1' ? term1 : term2;
  const setCurrentTerm = (updater: (prev: InstallationTermData) => InstallationTermData) => {
    if (activeTab === 'term1') {
      setTerm1(updater);
    } else {
      setTerm2(updater);
    }
  };

  const currentCep = activeTab === 'term1' ? cep1 : cep2;
  const setCurrentCep = activeTab === 'term1' ? setCep1 : setCep2;
  const isCurrentLoadingCep = activeTab === 'term1' ? isLoadingCep1 : isLoadingCep2;

  const toggleOrientation = (key: keyof InstallationTermOrientations) => {
    setCurrentTerm(prev => ({
      ...prev,
      orientations: {
        ...prev.orientations,
        [key]: !prev.orientations?.[key]
      }
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in pb-16">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="bg-[#253c55] px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                Termo de Instalação e Acerto Final
              </h1>
            </div>
            <p className="text-blue-200 text-xs md:text-sm mt-1">
              Imprima 2 termos por folha A4 com corte central para economia de papel, ou preencha para 2 clientes diferentes.
            </p>
          </div>

          <button
            onClick={handleGeneratePDF}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md text-sm md:text-base whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            Gerar Termo (PDF)
          </button>
        </div>

        {/* Barra de Modo & Ações Rápidas */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Formato:</span>
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setMode('double')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  mode === 'double'
                    ? 'bg-[#253c55] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                ✂️ Meia Folha Dupla (2 por folha A4)
              </button>
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  mode === 'single'
                    ? 'bg-[#253c55] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                📄 Folha Única (1 termo)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'double' && (
              <>
                <button
                  type="button"
                  onClick={handleCopyTerm1ToTerm2}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold rounded-md transition-colors"
                  title="Duplica todas as informações do Termo 1 para o Termo 2 (duas vias do mesmo cliente)"
                >
                  📋 Copiar Termo 1 p/ Termo 2 (2 Vias)
                </button>
                <button
                  type="button"
                  onClick={handleClearTerm2}
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold rounded-md transition-colors"
                  title="Deixa o Termo 2 em branco com linhas para caneta"
                >
                  🧹 Limpar Termo 2
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 text-xs font-bold rounded-md transition-colors"
              title="Limpa todos os campos para imprimir folha em branco"
            >
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>

        {/* Resumo Visual dos Termos na Folha */}
        {mode === 'double' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-100/70 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 text-xs">
            <div
              onClick={() => setActiveTab('term1')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeTab === 'term1'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                <span>🔝 Termo 1 (Metade Superior)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {term1.clientName ? 'Preenchido' : 'Em branco'}
                </span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {term1.clientName || 'Cliente não informado (linhas vazias)'}
              </p>
              <p className="text-gray-500 text-[11px] truncate">
                Total: R$ {term1.totalValue || '0,00'} | Saldo: R$ {term1.balanceValue || '0,00'}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('term2')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeTab === 'term2'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                <span>🔻 Termo 2 (Metade Inferior)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {term2.clientName ? 'Preenchido' : 'Em branco'}
                </span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {term2.clientName || 'Cliente não informado (linhas vazias)'}
              </p>
              <p className="text-gray-500 text-[11px] truncate">
                Total: R$ {term2.totalValue || '0,00'} | Saldo: R$ {term2.balanceValue || '0,00'}
              </p>
            </div>
          </div>
        )}

        {/* Abas de Navegação (se modo duplo) */}
        {mode === 'double' && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('term1')}
              className={`flex-1 py-3 px-4 text-sm font-black border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'term1'
                  ? 'border-[#253c55] text-[#253c55] dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>1️⃣ Termo Superior (Cliente 1)</span>
              {term1.clientName && (
                <span className="text-xs font-normal bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                  {term1.clientName}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('term2')}
              className={`flex-1 py-3 px-4 text-sm font-black border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'term2'
                  ? 'border-[#253c55] text-[#253c55] dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>2️⃣ Termo Inferior (Cliente 2)</span>
              {term2.clientName && (
                <span className="text-xs font-normal bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                  {term2.clientName}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Formulário do Termo Ativo */}
        <div className="p-6">
          {/* Seletor rápido de contrato */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
              ⚡ Puxar dados de um Contrato Salvo ({activeTab === 'term1' ? 'Termo 1' : 'Termo 2'}):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                onChange={e => handleApplyContract(e.target.value, activeTab)}
                defaultValue=""
                className="flex-1 p-2.5 text-sm border border-blue-300 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55]"
              >
                <option value="">-- Selecione um contrato para carregar cliente, valores e endereço --</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.clientName || 'Sem nome'} — {formatCurrencyBRL(c.totalValue || 0)}
                  </option>
                ))}
              </select>
              {loadingContracts && (
                <span className="text-xs text-blue-600 dark:text-blue-400 self-center">Carregando...</span>
              )}
            </div>
          </div>

          {/* Seção 1: Identificação do Cliente */}
          <h2 className="text-base font-bold text-[#253c55] dark:text-blue-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
            <span>👤</span> Identificação do Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={currentTerm.clientName || ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Ex: Alexandre Bergamo de Oliveira"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                value={currentTerm.cpfCnpj || ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, cpfCnpj: formatCpfCnpj(e.target.value) }))}
                placeholder="000.000.000-00"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Data do Termo
              </label>
              <input
                type="text"
                value={currentTerm.date || ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, date: e.target.value }))}
                placeholder="DD/MM/AAAA"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                CEP (Preenchimento Rápido)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentCep}
                  onChange={e => {
                    const masked = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCurrentCep(masked);
                  }}
                  onBlur={() => fetchCep(currentCep.replace(/\D/g, ''), activeTab)}
                  placeholder="00000000"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
                />
                <button
                  type="button"
                  onClick={() => fetchCep(currentCep.replace(/\D/g, ''), activeTab)}
                  disabled={isCurrentLoadingCep}
                  className="px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                >
                  {isCurrentLoadingCep ? '...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Endereço da Instalação
              </label>
              <input
                type="text"
                value={currentTerm.address || ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, Número, Bairro, Cidade (UF)"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
              />
            </div>
          </div>

          {/* Seção 2: Orientações / Condições Informadas */}
          <h2 className="text-base font-bold text-[#253c55] dark:text-blue-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
            <span>📋</span> Orientações / Condições Informadas ao Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.pintura}
                onChange={() => toggleOrientation('pintura')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Pintura e acabamento após a instalação</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.paredePrumo}
                onChange={() => toggleOrientation('paredePrumo')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Parede fora de prumo / desalinhada</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.reforco}
                onChange={() => toggleOrientation('reforco')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Necessidade de reforço estrutural da parede</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.fixacao}
                onChange={() => toggleOrientation('fixacao')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Fixação e pontos de apoio da escada</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.cuidados}
                onChange={() => toggleOrientation('cuidados')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Cuidados de uso, limpeza e conservação</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!currentTerm.orientations?.ajustes}
                onChange={() => toggleOrientation('ajustes')}
                className="w-4 h-4 text-[#253c55] rounded border-gray-300 focus:ring-[#253c55]"
              />
              <span className="text-gray-800 dark:text-gray-200">Ajustes e acabamentos pendentes</span>
            </label>

            <div className="md:col-span-2 mt-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Outras orientações / ressalvas:
              </label>
              <textarea
                value={currentTerm.observations || ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Anotações extras, detalhes de instalação, pendências de pintura, etc."
                rows={2}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm"
              />
            </div>
          </div>

          {/* Seção 3: Acerto Financeiro */}
          <h2 className="text-base font-bold text-[#253c55] dark:text-blue-300 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
            <span>💰</span> Acerto Financeiro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Valor Total (R$)
              </label>
              <input
                type="text"
                value={currentTerm.totalValue !== undefined ? String(currentTerm.totalValue) : ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, totalValue: e.target.value }))}
                placeholder="Ex: 5.880,00"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Já Pago (R$)
              </label>
              <input
                type="text"
                value={currentTerm.paidValue !== undefined ? String(currentTerm.paidValue) : ''}
                onChange={e => setCurrentTerm(prev => ({ ...prev, paidValue: e.target.value }))}
                placeholder="Ex: 2.940,00"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Saldo (R$)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTerm.balanceValue !== undefined ? String(currentTerm.balanceValue) : ''}
                  onChange={e => setCurrentTerm(prev => ({ ...prev, balanceValue: e.target.value }))}
                  placeholder="Ex: 2.940,00"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#253c55] text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => calculateBalance(activeTab)}
                  className="px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-xs transition-colors"
                >
                  Calcular
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Situação do Pagamento:
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`paymentStatus_${activeTab}`}
                    value="quitado"
                    checked={currentTerm.paymentStatus === 'quitado'}
                    onChange={() => setCurrentTerm(prev => ({ ...prev, paymentStatus: 'quitado' }))}
                    className="text-[#253c55] focus:ring-[#253c55]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Saldo quitado nesta data
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`paymentStatus_${activeTab}`}
                    value="pendente"
                    checked={currentTerm.paymentStatus === 'pendente'}
                    onChange={() => setCurrentTerm(prev => ({ ...prev, paymentStatus: 'pendente' }))}
                    className="text-[#253c55] focus:ring-[#253c55]"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Saldo pendente de pagamento
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`paymentStatus_${activeTab}`}
                    value=""
                    checked={!currentTerm.paymentStatus}
                    onChange={() => setCurrentTerm(prev => ({ ...prev, paymentStatus: '' }))}
                    className="text-[#253c55] focus:ring-[#253c55]"
                  />
                  <span className="text-gray-500 dark:text-gray-400">
                    Em branco (marcar na hora à caneta)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Botão de Geração */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {mode === 'double' ? (
                <span>
                  O documento será gerado com <strong>2 termos idênticos ou diferentes na mesma folha A4</strong>, separados por uma linha pontilhada central para corte.
                </span>
              ) : (
                <span>
                  O documento será gerado em <strong>folha única A4</strong> com 1 termo de instalação.
                </span>
              )}
            </div>

            <button
              onClick={handleGeneratePDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#253c55] hover:bg-[#1a2b3d] text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md text-base"
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
