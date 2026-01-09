
import React, { useState, useEffect, useRef } from 'react';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL, calculateFreightCost, getRouteInfoFromGemini, calculateTotalPrice, getBasePrice, getMultiplier } from '../utils';
import StaircaseVisualizer from './StaircaseVisualizer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProposalOptionsProps {
  options: ProposalOption[];
  inputData?: CalculatorInput;
  onGenerateProposal: (userData: UserData, modifiedOptions?: ProposalOption[]) => void;
  freightCost: number;
  setFreightCost: (cost: number) => void;
  tollCost: number;
  setTollCost: (cost: number) => void;
  isInstallationIncluded: boolean;
  setIsInstallationIncluded: (included: boolean) => void;
  installationCost: number;
  setInstallationCost: (cost: number) => void;
}

const BRAZIL_STATES = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Funções de Máscara
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskRG = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2');
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const UserDataForm: React.FC<{ onSubmit: (data: UserData) => void; initialZip?: string }> = ({ onSubmit, initialZip }) => {
  const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');
  const [name, setName] = useState('');
  const [docMain, setDocMain] = useState(''); // CPF ou CNPJ
  const [docSecondary, setDocSecondary] = useState(''); // RG (apenas PF)
  
  // Campos de Endereço Estruturado
  const [zip, setZip] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [error, setError] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Limpa campos ao trocar tipo
  const handleTypeChange = (type: 'pf' | 'pj') => {
      setPersonType(type);
      setDocMain('');
      setDocSecondary('');
  };

  const handleDocMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (personType === 'pf') {
          setDocMain(maskCPF(val));
      } else {
          setDocMain(maskCNPJ(val));
      }
  };

  const handleDocSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDocSecondary(maskRG(e.target.value));
  };

  // Função centralizada de busca de endereço
  const fetchAddressByCep = async (cepValue: string) => {
      const cleanZip = cepValue.replace(/\D/g, '');
      if (cleanZip.length === 8) {
          setIsLoadingCep(true);
          try {
              const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
              const data = await response.json();
              if (!data.erro) {
                  setStreet(data.logradouro);
                  setNeighborhood(data.bairro);
                  setCity(data.localidade);
                  setState(data.uf);
                  // Limpa erro anterior se houver
                  setError('');
              }
          } catch (e) {
              console.error("Erro ao buscar CEP", e);
          } finally {
              setIsLoadingCep(false);
          }
      }
  };

  // Sincroniza com o CEP vindo de fora (Configuração de Frete)
  useEffect(() => {
      if (initialZip) {
          const masked = maskCEP(initialZip);
          setZip(masked);
          
          // Se for um CEP válido, busca o endereço automaticamente
          if (masked.replace(/\D/g, '').length === 8) {
              fetchAddressByCep(masked);
          }
      }
  }, [initialZip]);

  const handleZipBlur = () => {
      fetchAddressByCep(zip);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // docMain (CPF/CNPJ) removido da validação obrigatória
    if (name && street && number && city && state) {
      setError('');
      
      // Monta string completa para compatibilidade com o PDF Generator atual
      const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`;

      onSubmit({ 
          name, 
          cpf: docMain, 
          rg: personType === 'pf' ? docSecondary : undefined, 
          address: fullAddress,
          // Salva campos estruturados
          zip, street, number, neighborhood, city, state
      });
    } else {
        setError('Por favor, preencha todos os campos obrigatórios (Nome e Endereço).');
    }
  };
  
  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-highlight" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
         </svg>
         Dados do Cliente
       </h3>
       <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Preencha abaixo para gerar o PDF oficial.</p>
       
       <form onSubmit={handleSubmit} className="space-y-4">
         {/* SELETOR TIPO DE PESSOA */}
         <div className="flex gap-4 mb-4 bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600">
             <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                    type="radio" 
                    name="personType" 
                    checked={personType === 'pf'} 
                    onChange={() => handleTypeChange('pf')}
                    className="w-4 h-4 text-highlight"
                 />
                 <span className="font-bold text-gray-700 dark:text-gray-200">Pessoa Física (CPF + RG)</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                    type="radio" 
                    name="personType" 
                    checked={personType === 'pj'} 
                    onChange={() => handleTypeChange('pj')}
                    className="w-4 h-4 text-highlight"
                 />
                 <span className="font-bold text-gray-700 dark:text-gray-200">Pessoa Jurídica (CNPJ)</span>
             </label>
         </div>

         <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{personType === 'pf' ? 'Nome Completo' : 'Razão Social'} *</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"/>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{personType === 'pf' ? 'CPF' : 'CNPJ'} (Opcional)</label>
                <input 
                    type="text" 
                    value={docMain} 
                    onChange={handleDocMainChange} 
                    placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    maxLength={personType === 'pf' ? 14 : 18}
                    className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"
                />
             </div>
             
             {personType === 'pf' && (
                 <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">RG (Opcional)</label>
                    <input 
                        type="text" 
                        value={docSecondary} 
                        onChange={handleDocSecondaryChange}
                        placeholder="00.000.000-0"
                        maxLength={12}
                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"
                    />
                 </div>
             )}
         </div>

         <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
            <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">📍 Endereço da Obra</h4>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">CEP *</label>
                    <div className="relative">
                        <input 
                            required
                            type="text" 
                            value={zip} 
                            onChange={e => setZip(maskCEP(e.target.value))} 
                            onBlur={handleZipBlur}
                            placeholder="00000-000"
                            maxLength={9}
                            className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"
                        />
                        {isLoadingCep && <span className="absolute right-3 top-3 text-xs text-gray-500">Bus...</span>}
                    </div>
                </div>
                <div className="col-span-2">
                     <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Rua / Logradouro *</label>
                     <input required type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"/>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Número *</label>
                    <input required type="text" value={number} onChange={e => setNumber(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"/>
                </div>
                <div className="col-span-2">
                     <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Bairro *</label>
                     <input required type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"/>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-3">
                     <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Cidade *</label>
                     <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium"/>
                 </div>
                 <div className="col-span-1">
                     <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">UF *</label>
                     <div className="relative">
                        <select
                            required
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-medium appearance-none"
                        >
                            <option value="">--</option>
                            {BRAZIL_STATES.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                     </div>
                 </div>
            </div>
         </div>
         
         {error && <p className="text-red-600 text-sm font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</p>}
         
         <button type="submit" className="w-full bg-highlight text-white font-black py-4 px-4 rounded-md hover:bg-yellow-600 transition-all shadow-md mt-4 flex items-center justify-center gap-2 text-lg uppercase tracking-wide">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
           Gerar Proposta PDF
         </button>
       </form>
    </div>
  )
}

// Tipo atualizado para controlar versões 2D e 3D de cada opção
interface ExportSelection {
    original2D: boolean;
    original3D: boolean;
    fixOpening2D: boolean;
    fixOpening3D: boolean;
    fixStair2D: boolean;
    fixStair3D: boolean;
}

// Estrutura da Fila de Exportação
interface ExportQueueItem {
    option: ProposalOption;
    variant: 'original' | 'fixOpening' | 'fixStair';
    viewMode: '2d' | '3d';
    title: string;
}

const defaultSelection: ExportSelection = {
    original2D: false, original3D: false,
    fixOpening2D: false, fixOpening3D: false,
    fixStair2D: false, fixStair3D: false
};

const ProposalOptions: React.FC<ProposalOptionsProps> = ({ 
    options, 
    inputData,
    onGenerateProposal,
    freightCost,
    setFreightCost,
    tollCost,
    setTollCost,
    isInstallationIncluded,
    setIsInstallationIncluded,
    installationCost,
    setInstallationCost
}) => {
    
  // --- INICIALIZAÇÃO COM DADOS DA CALCULADORA ANTERIOR ---
  const [originCep, setOriginCep] = useState(inputData?.logistics?.originCep || '13104-096');
  const [destinationCep, setDestinationCep] = useState(inputData?.logistics?.destinationCep || '');
  const [fuelPrice, setFuelPrice] = useState(inputData?.logistics?.fuelPrice.toString() || '6.20');
  const [consumption, setConsumption] = useState(inputData?.logistics?.consumption.toString() || '7');
  const [distance, setDistance] = useState(inputData?.logistics?.distance || 0);
  const [autoTollCost, setAutoTollCost] = useState(inputData?.logistics?.tolls || 0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [freightMode, setFreightMode] = useState<'auto' | 'manual'>('auto');
  const [manualDistance, setManualDistance] = useState('');
  const [manualTollCost, setManualTollCost] = useState('');
  const [isFreightIncluded, setIsFreightIncluded] = useState(true);

  // Novo estado para o visualizador modal (apenas visualização)
  const [selectedVisualizerOption, setSelectedVisualizerOption] = useState<ProposalOption | null>(null);
  const [visualizerForcedState, setVisualizerForcedState] = useState<{simulateSafe: boolean, correctionType: 'expand_opening' | 'shrink_stair'} | undefined>(undefined);
  
  // Armazena as opções corrigidas (alteradas pelo usuário via "Aplicar")
  const [overriddenOptions, setOverriddenOptions] = useState<{[key: number]: ProposalOption}>({});
  
  // Controle de seleção de exportação
  const [exportConfig, setExportConfig] = useState<{[key: number]: ExportSelection}>({});

  // --- ESTADOS DO WIZARD DE EXPORTAÇÃO ---
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [exportQueue, setExportQueue] = useState<ExportQueueItem[]>([]);
  const [currentExportIndex, setCurrentExportIndex] = useState(0);
  // FIX: removed unused capturedImages state variable from destructuring
  const [, setCapturedImages] = useState<{imgData: string, title: string, width: number, height: number}[]>([]);
  const captureRef = useRef<HTMLDivElement>(null); // Ref para o container do desenho atual no wizard

  // --- EFEITO PARA CARREGAR DADOS INICIAIS ---
  useEffect(() => {
      if (inputData?.logistics) {
          setOriginCep(inputData.logistics.originCep);
          setDestinationCep(inputData.logistics.destinationCep);
          setDistance(inputData.logistics.distance);
          setAutoTollCost(inputData.logistics.tolls);
          setFuelPrice(inputData.logistics.fuelPrice.toString());
          setConsumption(inputData.logistics.consumption.toString());
          setFreightMode('auto');
      }
  }, [inputData]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, setCep: (value: string) => void) => {
    let { value } = e.target;
    // Permitir limpar o campo completamente sem travar na máscara
    if (value === '') {
        setCep('');
        return;
    }
    value = value.replace(/\D/g, '').slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleApplyCorrection = (optionNum: number, newTread: number, newLength: number) => {
      const original = options.find(o => o.optionNumber === optionNum);
      if (!original) return;

      // Recalcula preço
      let newTotalPrice = 0;
      if (inputData?.customStepPrice && inputData.customStepPrice > 0) {
          newTotalPrice += inputData.customStepPrice * original.structureSteps;
      } else {
          newTotalPrice += calculateTotalPrice(original.stairWidth, newTread, original.structureSteps);
      }
      const landingsPrice = original.landings.reduce((acc, l) => acc + l.price, 0);
      newTotalPrice += landingsPrice;

      const newOption: ProposalOption = {
          ...original,
          treadDepth: newTread,
          totalLength: newLength,
          totalPrice: newTotalPrice,
          isModified: true
      };

      setOverriddenOptions(prev => ({ ...prev, [optionNum]: newOption }));
  };
  
  const handleRevertCorrection = (optionNum: number) => {
      setOverriddenOptions(prev => {
          const newState = { ...prev };
          delete newState[optionNum];
          return newState;
      });
  };

  // Helper para obter a lista final de opções (Original + Modificadas)
  const getEffectiveOptions = () => {
      return options.map(o => overriddenOptions[o.optionNumber] || o);
  };

  const toggleExportSelection = (optionNum: number, type: keyof ExportSelection) => {
      setExportConfig(prev => {
          const current = prev[optionNum] || { ...defaultSelection };
          return {
              ...prev,
              [optionNum]: { ...current, [type]: !current[type] }
          };
      });
  };

  const handleAutomaticDistance = async () => {
    const isOriginValid = originCep.replace(/\D/g, '').length === 8;
    const isDestinationValid = destinationCep.replace(/\D/g, '').length === 8;

    if (!isOriginValid || !isDestinationValid) {
      setError('Por favor, preencha ambos os CEPs com 8 dígitos válidos.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    // Reseta valores para forçar atualização visual
    setDistance(0);
    setAutoTollCost(0);
    
    try {
      const { distance: routeDistance, tolls: routeTolls } = await getRouteInfoFromGemini(originCep, destinationCep);
      
      if (routeDistance === 0) {
          setError('A IA não conseguiu calcular a rota. Verifique os CEPs ou use o modo manual.');
      }
      
      setDistance(routeDistance);
      setAutoTollCost(routeTolls);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao calcular a distância.');
      setDistance(0);
      setAutoTollCost(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isFreightIncluded) {
        setFreightCost(0);
        setTollCost(0);
        return;
    }

    let currentDistance = 0;
    let currentTolls = 0;

    if (freightMode === 'auto') {
        currentDistance = distance;
        currentTolls = autoTollCost;
    } else { // manual
        const d = parseFloat(manualDistance);
        const t = parseFloat(manualTollCost);
        currentDistance = isNaN(d) ? 0 : d;
        currentTolls = isNaN(t) ? 0 : t;
    }

    const fPrice = parseFloat(fuelPrice);
    const cons = parseFloat(consumption);
    
    // Validate inputs for calc
    if (isNaN(fPrice) || isNaN(cons) || cons === 0) {
        setFreightCost(0);
    } else {
        const fuelCost = calculateFreightCost(currentDistance, fPrice, cons);
        setFreightCost(fuelCost);
    }
    
    setTollCost(currentTolls);

}, [freightMode, distance, autoTollCost, manualDistance, manualTollCost, fuelPrice, consumption, setFreightCost, setTollCost, isFreightIncluded]);

  const countSelectedExports = () => {
      let count = 0;
      (Object.values(exportConfig) as ExportSelection[]).forEach(sel => {
          if (sel.original2D) count++;
          if (sel.original3D) count++;
          if (sel.fixOpening2D) count++;
          if (sel.fixOpening3D) count++;
          if (sel.fixStair2D) count++;
          if (sel.fixStair3D) count++;
      });
      return count;
  };

  // --- LÓGICA DO WIZARD DE EXPORTAÇÃO ---

  const startBatchExport = () => {
      if (countSelectedExports() === 0) return;
      
      const queue: ExportQueueItem[] = [];
      const effectiveOptions = getEffectiveOptions();
      
      effectiveOptions.forEach(o => {
          const sel = exportConfig[o.optionNumber] || defaultSelection;
          
          if (sel.original2D) queue.push({ option: o, variant: 'original', viewMode: '2d', title: `Desenho 2D - Opção ${o.optionNumber} (Original)` });
          if (sel.original3D) queue.push({ option: o, variant: 'original', viewMode: '3d', title: `Visualização 3D - Opção ${o.optionNumber} (Original)` });
          
          if (sel.fixOpening2D) queue.push({ option: o, variant: 'fixOpening', viewMode: '2d', title: `Desenho 2D - Opção ${o.optionNumber} (Solução: Aumentar Vão)` });
          if (sel.fixOpening3D) queue.push({ option: o, variant: 'fixOpening', viewMode: '3d', title: `Visualização 3D - Opção ${o.optionNumber} (Solução: Aumentar Vão)` });
          
          if (sel.fixStair2D) queue.push({ option: o, variant: 'fixStair', viewMode: '2d', title: `Desenho 2D - Opção ${o.optionNumber} (Solução: Ajustar Escada)` });
          if (sel.fixStair3D) queue.push({ option: o, variant: 'fixStair', viewMode: '3d', title: `Visualização 3D - Opção ${o.optionNumber} (Solução: Ajustar Escada)` });
      });

      setExportQueue(queue);
      setCurrentExportIndex(0);
      setCapturedImages([]);
      setIsExportWizardOpen(true);
  };

  const captureCurrentStepAndNext = async () => {
      if (!captureRef.current) return;

      try {
          // Captura a imagem exatamente como o usuário a posicionou
          const canvas = await html2canvas(captureRef.current, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true,
              allowTaint: true
          });
          const imgData = canvas.toDataURL('image/png');
          const currentItem = exportQueue[currentExportIndex];

          setCapturedImages(prev => [...prev, {
              imgData,
              title: currentItem.title,
              width: canvas.width,
              height: canvas.height
          }]);

          if (currentExportIndex < exportQueue.length - 1) {
              setCurrentExportIndex(prev => prev + 1);
          } else {
              finishExport(); // FIX: removed unused args
          }

      } catch (e) {
          console.error("Erro na captura:", e);
          alert("Erro ao capturar imagem. Tente novamente.");
      }
  };

  // FIX: Removed unused parameters lastW and lastH
  const finishExport = () => {
      setTimeout(() => {
        setCapturedImages(finalImages => {
             const doc = new jsPDF('landscape', 'mm', 'a4');
             const pdfWidth = doc.internal.pageSize.getWidth();
             const pdfHeight = doc.internal.pageSize.getHeight();

             finalImages.forEach((img, index) => {
                 if (index > 0) doc.addPage();
                 
                 const ratio = img.width / img.height;
                 let w = pdfWidth - 20;
                 let h = w / ratio;
                 
                 if (h > pdfHeight - 40) {
                     h = pdfHeight - 40;
                     w = h * ratio;
                 }

                 doc.setFontSize(14);
                 doc.text(img.title, 10, 15);
                 doc.addImage(img.imgData, 'PNG', 10, 25, w, h);
             });

             doc.save('desenhos_selecionados.pdf');
             setIsExportWizardOpen(false); // Fecha o Wizard
             return finalImages;
        });
      }, 500);
  };

  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;
  const extrasCost = inputData?.optionalItems.reduce((acc, item) => acc + item.price, 0) || 0;
  
  const hasSlabInfo = inputData?.slabOpening && inputData.slabOpening > 0;

  // Renderização do Passo Atual do Wizard
  const renderWizardStep = () => {
      if (!isExportWizardOpen || exportQueue.length === 0) return null;
      
      const item = exportQueue[currentExportIndex];
      const forcedState = item.variant === 'original' ? { simulateSafe: false, correctionType: 'expand_opening' as const } :
                          item.variant === 'fixOpening' ? { simulateSafe: true, correctionType: 'expand_opening' as const } :
                          { simulateSafe: true, correctionType: 'shrink_stair' as const };
      
      return (
          <div className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[80vh] rounded-lg overflow-hidden flex flex-col shadow-2xl">
                  <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold">Assistente de Exportação ({currentExportIndex + 1}/{exportQueue.length})</h3>
                          <p className="text-sm opacity-90">{item.title}</p>
                      </div>
                      <div className="text-xs bg-blue-800 px-3 py-1 rounded">
                          {item.viewMode === '3d' ? 'Gire e ajuste o Zoom para a foto!' : 'Confira o desenho técnico'}
                      </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 relative overflow-hidden flex justify-center items-center">
                      <div className="w-full h-full shadow-lg border border-gray-300 dark:border-gray-700 bg-white relative">
                           {/* AQUI RENDERIZA O VISUALIZADOR INTERATIVO */}
                           <StaircaseVisualizer 
                                captureRef={captureRef}
                                option={item.option}
                                totalHeight={inputData?.totalHeight || 300}
                                slabOpening={inputData?.slabOpening}
                                slabThickness={inputData?.slabThickness}
                                printMode={true} // Modo "print" para layout limpo
                                hideUI={true}    // Esconde botões internos do componente
                                initialViewMode={item.viewMode === '3d' ? '3d' : 'side'} // Força o modo correto
                                forcedState={forcedState}
                           />
                      </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => setIsExportWizardOpen(false)} className="text-red-600 font-bold px-4">
                          Cancelar
                      </button>
                      <button 
                          onClick={captureCurrentStepAndNext}
                          className="bg-green-600 text-white font-bold py-3 px-8 rounded shadow hover:bg-green-700 flex items-center gap-2 text-lg"
                      >
                          <span>📸</span>
                          {currentExportIndex < exportQueue.length - 1 ? 'Capturar e Próximo' : 'Capturar e Gerar PDF'}
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 relative">
      <div className="flex justify-between items-center mb-6 border-b-2 border-highlight pb-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Opções Calculadas</h2>
          
          <div className="flex gap-2">
              <button 
                onClick={startBatchExport}
                disabled={countSelectedExports() === 0}
                className={`text-sm font-bold px-4 py-2 rounded shadow transition-all flex items-center gap-2 ${countSelectedExports() > 0 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                  {`📥 Baixar Desenhos Selecionados (${countSelectedExports()})`}
              </button>
          </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Selecione quais versões de desenho você deseja incluir no PDF:</p>
        {options.map((originalOption) => {
            const activeOption = overriddenOptions[originalOption.optionNumber] || originalOption;
            const currentSelection = exportConfig[activeOption.optionNumber] || { ...defaultSelection };
            const totalCost = activeOption.totalPrice + freightCost + tollCost + finalInstallationCost + extrasCost;
            
            // Cálculos para o detalhamento
            const basePrice = getBasePrice(activeOption.stairWidth);
            const multiplier = getMultiplier(activeOption.treadDepth);
            const calculatedUnitPrice = basePrice * multiplier;
            
            const landingsPrice = activeOption.landings.reduce((acc, l) => acc + l.price, 0);
            const structureStepsPrice = calculatedUnitPrice * activeOption.structureSteps;
            const hasCustomPrice = inputData?.customStepPrice && inputData.customStepPrice > 0;

            return (
                <div
                    key={activeOption.optionNumber}
                    className={`p-5 rounded-lg border-2 shadow-sm transition-colors relative bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-highlight`}
                >
                    <div className="flex justify-between items-start mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                                Opção {activeOption.optionNumber}
                                {activeOption.isModified && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">MODIFICADA</span>}
                            </h3>
                            <button 
                                onClick={() => { setSelectedVisualizerOption(originalOption); setVisualizerForcedState(undefined); }}
                                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded mt-1 flex items-center gap-1 shadow-sm transition-all"
                            >
                                👁️ Abrir Visualizador 3D
                            </button>
                        </div>
                        <span className="text-2xl font-black text-green-700 dark:text-green-400">
                            {formatCurrencyBRL(totalCost)}
                        </span>
                    </div>

                    {activeOption.isModified && (
                        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800 flex justify-between items-center text-sm">
                            <div className="text-yellow-800 dark:text-yellow-400">
                                <strong>Alteração Aplicada:</strong> Pisante de {originalOption.treadDepth}cm ➝ <span className="font-bold">{activeOption.treadDepth}cm</span>
                            </div>
                            <button 
                                onClick={() => handleRevertCorrection(activeOption.optionNumber)}
                                className="text-red-600 underline font-bold hover:text-red-800 text-xs uppercase"
                            >
                                Desfazer
                            </button>
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 mb-4">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase block mb-2">Selecione para o PDF:</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 border-r border-gray-100 dark:border-gray-700 pr-2">
                                <span className="text-xs font-bold text-gray-400">Original</span>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={currentSelection.original2D} 
                                            onChange={() => toggleExportSelection(activeOption.optionNumber, 'original2D')}
                                            className="w-3 h-3 accent-purple-600"
                                        />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">2D</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={currentSelection.original3D} 
                                            onChange={() => toggleExportSelection(activeOption.optionNumber, 'original3D')}
                                            className="w-3 h-3 accent-purple-600"
                                        />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">3D</span>
                                    </label>
                                </div>
                            </div>
                            
                            {hasSlabInfo && (
                                <>
                                    <div className="flex flex-col gap-1 border-r border-gray-100 dark:border-gray-700 pr-2">
                                        <span className="text-xs font-bold text-gray-400">Solução Vão</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixOpening2D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixOpening2D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">2D</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixOpening3D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixOpening3D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">3D</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400">Solução Escada</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixStair2D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixStair2D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">2D</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixStair3D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixStair3D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">3D</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-700 dark:text-gray-300 font-medium mb-4 pl-2">
                        <p><strong className="text-gray-900 dark:text-white">Total Peças:</strong> {activeOption.steps} un</p>
                        <p><strong className="text-gray-900 dark:text-white">Alt/Degrau:</strong> {activeOption.stepHeight.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Pisante:</strong> {activeOption.treadDepth.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Largura:</strong> {activeOption.stairWidth} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Comp. Total:</strong> {(activeOption.totalLength / 100).toFixed(2)} m</p>
                    </div>

                    <div className="mt-3 pt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white uppercase">Valor da Estrutura:</span>
                                <span className="text-base font-black text-gray-900 dark:text-white">{formatCurrencyBRL(activeOption.totalPrice)}</span>
                            </div>
                            
                            {/* DETALHAMENTO DA CONTA (ATUALIZADO E MELHORADO) */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 text-xs space-y-1 mt-2">
                                <div className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1 mb-1">
                                    Detalhamento Estrutura:
                                </div>
                                
                                {!hasCustomPrice ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Base (Larg. {activeOption.stairWidth}cm):</span>
                                            <span>{formatCurrencyBRL(basePrice)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Mult. Pisante ({activeOption.treadDepth.toFixed(1)}cm):</span>
                                            <span>x {multiplier.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-600 dark:text-gray-400">
                                            <span>= Preço Unitário:</span>
                                            <span>{formatCurrencyBRL(calculatedUnitPrice)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400">
                                        <span>Preço Manual Definido:</span>
                                        <span>{formatCurrencyBRL(inputData.customStepPrice!)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 dark:border-gray-600 my-1 pt-1"></div>

                                <div className="flex justify-between">
                                    <span>(+) {activeOption.structureSteps} Degraus:</span>
                                    <span>{formatCurrencyBRL(hasCustomPrice ? (inputData!.customStepPrice! * activeOption.structureSteps) : structureStepsPrice)}</span>
                                </div>
                                
                                {activeOption.landings.length > 0 && (
                                     <div className="flex justify-between">
                                        <span>(+) {activeOption.landings.length} Patamares:</span>
                                        <span>{formatCurrencyBRL(landingsPrice)}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between font-black text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-500 pt-1 mt-1">
                                    <span>Total Estrutura:</span>
                                    <span>{formatCurrencyBRL(activeOption.totalPrice)}</span>
                                </div>
                            </div>

                             {(freightCost + tollCost) > 0 && (
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Frete + Pedágio:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(freightCost + tollCost)}</span>
                                </div>
                            )}
                            {finalInstallationCost > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Instalação:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallationCost)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      <div className="pt-6 border-t-2 border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configuração de Frete
            </h3>
            <label className="flex items-center cursor-pointer select-none">
                <span className="mr-2 text-sm font-bold text-gray-600 dark:text-gray-300">Cobrar Frete?</span>
                <input type="checkbox" checked={isFreightIncluded} onChange={e => setIsFreightIncluded(e.target.checked)} className="h-5 w-5 text-highlight rounded focus:ring-highlight border-gray-300"/>
            </label>
        </div>
        
        {isFreightIncluded ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1 mb-4">
                    <button 
                        onClick={() => setFreightMode('auto')}
                        className={`w-1/2 py-2 text-sm rounded-md font-bold transition ${freightMode === 'auto' ? 'bg-white dark:bg-gray-800 text-highlight shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                        Automático (IA)
                    </button>
                    <button 
                        onClick={() => setFreightMode('manual')}
                        className={`w-1/2 py-2 text-sm rounded-md font-bold transition ${freightMode === 'manual' ? 'bg-white dark:bg-gray-800 text-highlight shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                        Manual
                    </button>
                </div>

                {freightMode === 'auto' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input type="text" value={originCep} onChange={e => handleCepChange(e, setOriginCep)} placeholder="CEP de Origem" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" maxLength={9}/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">CEP de onde a escada vai sair.</p>
                    </div>
                    <div>
                        <input type="text" value={destinationCep} onChange={e => handleCepChange(e, setDestinationCep)} placeholder="CEP de Destino" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" maxLength={9}/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">CEP da obra do cliente.</p>
                    </div>
                    </div>
                    <button onClick={handleAutomaticDistance} disabled={isLoading} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm">
                    {isLoading ? 'Calculando com IA...' : 'Calcular Rota com Google Maps'}
                    </button>
                    {error && <p className="text-red-600 mt-2 text-sm font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</p>}
                </>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input type="number" value={manualDistance} onChange={e => setManualDistance(e.target.value)} placeholder="Distância (km - apenas ida)" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" min="0" step="any"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Distância do Google Maps (só ida).</p>
                    </div>
                    <div>
                        <input type="number" value={manualTollCost} onChange={e => setManualTollCost(e.target.value)} placeholder="Custo Pedágios (R$)" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" min="0" step="0.01"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Valor total dos pedágios (ida e volta).</p>
                    </div>
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Preço Gasolina</label>
                        <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="R$/L" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" step="0.01" min="0"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Consumo do Veículo</label>
                        <input type="number" value={consumption} onChange={e => setConsumption(e.target.value)} placeholder="km/L" className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-md border-2 border-gray-300 dark:border-gray-600 font-medium" step="0.1" min="0"/>
                    </div>
                </div>

                {/* VISUALIZAÇÃO DO CÁLCULO - MOSTRAR SEMPRE SE TIVER DISTÂNCIA OU SE ESTIVER EM MANUAL */}
                <div className={`mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800 text-sm transition-all ${
                    (distance > 0 || (freightMode === 'manual' && parseFloat(manualDistance) > 0)) ? 'opacity-100 block' : 'opacity-0 hidden'
                }`}>
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 border-b border-blue-200 dark:border-blue-800 pb-1">
                            {freightMode === 'auto' ? 'Detalhamento (Rota Segura/Longa):' : 'Detalhamento do Frete:'}
                        </h4>
                        <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                            <li>📍 Distância Ida: <strong>{(freightMode === 'auto' ? distance : parseFloat(manualDistance)).toFixed(2)} km</strong></li>
                            <li>🔄 Distância Total (Ida x 2): <strong>{((freightMode === 'auto' ? distance : parseFloat(manualDistance)) * 2).toFixed(2)} km</strong></li>
                            <li>⛽ Custo Combustível: <strong>{formatCurrencyBRL(calculateFreightCost((freightMode === 'auto' ? distance : parseFloat(manualDistance)), parseFloat(fuelPrice), parseFloat(consumption)))}</strong> <span className="text-xs opacity-75">({((freightMode === 'auto' ? distance : parseFloat(manualDistance))*2).toFixed(1)}km / {consumption}km/l * R${fuelPrice})</span></li>
                            <li>🚧 Pedágios (Estimado): <strong>{formatCurrencyBRL(freightMode === 'auto' ? autoTollCost : (parseFloat(manualTollCost) || 0))}</strong></li>
                            <li className="font-bold border-t border-blue-300 dark:border-blue-700 pt-2 mt-2 text-base text-blue-900 dark:text-blue-100">🚚 Total Logística: {formatCurrencyBRL(freightCost + tollCost)}</li>
                        </ul>
                </div>
            </div>
        ) : (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700 flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                    <h4 className="font-bold text-red-800 dark:text-red-300 uppercase">Frete Não Incluso</h4>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                        <strong>Atenção:</strong> O frete não será cobrado. No <u>Orçamento</u> e no <u>Contrato</u> constará explicitamente que a <strong>retirada é por conta do comprador</strong>.
                    </p>
                </div>
            </div>
        )}
      
        <div className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <label htmlFor="installation" className="flex items-center cursor-pointer select-none">
              <input id="installation" type="checkbox" checked={isInstallationIncluded} onChange={e => setIsInstallationIncluded(e.target.checked)} className="h-5 w-5 text-highlight rounded focus:ring-highlight border-gray-300"/>
              <span className="ml-2 text-gray-900 dark:text-white font-bold uppercase">Incluir Instalação?</span>
            </label>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">R$</span>
                <input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} disabled={!isInstallationIncluded} className="w-24 bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded-md border-2 border-gray-300 dark:border-gray-600 font-bold disabled:bg-gray-100 disabled:text-gray-400" step="10" min="0"/>
            </div>
          </div>
        </div>
      </div>
      
      {/* Agora passamos o CEP de destino (digitado na área de frete) para o formulário do cliente */}
      <UserDataForm onSubmit={(data) => onGenerateProposal(data, getEffectiveOptions())} initialZip={destinationCep} />

      {/* RENDERIZAÇÃO DO MODAL DE VISUALIZAÇÃO PADRÃO */}
      {selectedVisualizerOption && (
          <StaircaseVisualizer 
             option={selectedVisualizerOption} 
             totalHeight={inputData?.totalHeight || 300} 
             slabOpening={inputData?.slabOpening}
             slabThickness={inputData?.slabThickness}
             onClose={() => setSelectedVisualizerOption(null)} 
             onApplyCorrection={(t, l) => handleApplyCorrection(selectedVisualizerOption.optionNumber, t, l)}
             forcedState={visualizerForcedState}
          />
      )}

      {/* RENDERIZAÇÃO DO WIZARD DE EXPORTAÇÃO */}
      {renderWizardStep()}
    </div>
  );
};

export default ProposalOptions;
