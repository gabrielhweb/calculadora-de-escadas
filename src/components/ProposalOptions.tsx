
import React, { useState, useEffect, useRef } from 'react';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL, calculateFreightCost, getRouteInfoFromGemini, calculateTotalPrice } from '../utils';
import StaircaseVisualizer from './StaircaseVisualizer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProposalOptionsProps {
  options: ProposalOption[];
  inputData?: CalculatorInput;
  onGenerateProposal: (userData: UserData) => void;
  freightCost: number;
  setFreightCost: (cost: number) => void;
  tollCost: number;
  setTollCost: (cost: number) => void;
  isInstallationIncluded: boolean;
  setIsInstallationIncluded: (included: boolean) => void;
  installationCost: number;
  setInstallationCost: (cost: number) => void;
}

const UserDataForm: React.FC<{ onSubmit: (data: UserData) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address) {
      setError('');
      onSubmit({ name, cpf, address });
    } else {
        setError('Por favor, preencha o Nome do Cliente e o Endereço da Obra.');
    }
  };
  
  return (
    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
       <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-highlight" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
         </svg>
         Dados do Cliente
       </h3>
       <p className="text-sm text-gray-500 mb-4">Preencha abaixo para gerar o PDF oficial.</p>
       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Nome do Cliente *</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:border-highlight font-medium"/>
         </div>
         <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">CPF/CNPJ (Opcional)</label>
            <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:border-highlight font-medium"/>
         </div>
         <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Endereço da Obra *</label>
            <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:border-highlight font-medium"/>
         </div>
         
         {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded">{error}</p>}
         
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
    
  const [originCep, setOriginCep] = useState('13104-096');
  const [destinationCep, setDestinationCep] = useState('');
  const [fuelPrice, setFuelPrice] = useState('6.20');
  const [consumption, setConsumption] = useState('7');
  const [distance, setDistance] = useState(0);
  const [autoTollCost, setAutoTollCost] = useState(0);
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
  const [capturedImages, setCapturedImages] = useState<{imgData: string, title: string, width: number, height: number}[]>([]);
  const captureRef = useRef<HTMLDivElement>(null); // Ref para o container do desenho atual no wizard

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, setCep: (value: string) => void) => {
    let { value } = e.target;
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
    setDistance(0);
    setAutoTollCost(0);
    try {
      const { distance: routeDistance, tolls: routeTolls } = await getRouteInfoFromGemini(originCep, destinationCep);
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
        currentDistance = parseFloat(manualDistance) || 0;
        currentTolls = parseFloat(manualTollCost) || 0;
    }

    const fuelCost = calculateFreightCost(currentDistance, parseFloat(fuelPrice), parseFloat(consumption));
    setFreightCost(fuelCost);
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
      
      options.forEach(o => {
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
              finishExport(canvas.width, canvas.height); // Passa dimensões aproximadas
          }

      } catch (e) {
          console.error("Erro na captura:", e);
          alert("Erro ao capturar imagem. Tente novamente.");
      }
  };

  const finishExport = (lastW: number, lastH: number) => {
      // Gera o PDF
      // Como o state capturedImages pode não ter a última imagem ainda (devido ao async do setState),
      // precisamos usar um callback ou reconstruir aqui. 
      // OBS: setState update é assincrono. O melhor é reconstruir a lista final na hora.
      
      // FIX: Como html2canvas é async e setState tbm, melhor fazer a geração no próximo tick
      // Mas para simplificar, vamos assumir que o array tem tudo MENOS o atual, então juntamos.
      
      // Porém, dentro do 'captureCurrentStepAndNext', já chamamos setCapturedImages.
      // O 'finishExport' será chamado, mas o state 'capturedImages' ainda pode estar velho.
      // Vamos usar setTimeout para garantir update.
      
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
              <div className="bg-white w-full max-w-5xl h-[80vh] rounded-lg overflow-hidden flex flex-col shadow-2xl">
                  <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold">Assistente de Exportação ({currentExportIndex + 1}/{exportQueue.length})</h3>
                          <p className="text-sm opacity-90">{item.title}</p>
                      </div>
                      <div className="text-xs bg-blue-800 px-3 py-1 rounded">
                          {item.viewMode === '3d' ? 'Gire e ajuste o Zoom para a foto!' : 'Confira o desenho técnico'}
                      </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-100 p-4 relative overflow-hidden flex justify-center items-center">
                      <div className="w-full h-full shadow-lg border border-gray-300 bg-white relative">
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

                  <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-200">
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative">
      <div className="flex justify-between items-center mb-6 border-b-2 border-highlight pb-4">
          <h2 className="text-2xl font-black text-gray-900">Opções Calculadas</h2>
          
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
        <p className="text-sm text-gray-500 font-medium">Selecione quais versões de desenho você deseja incluir no PDF:</p>
        {options.map((originalOption) => {
            const activeOption = overriddenOptions[originalOption.optionNumber] || originalOption;
            const currentSelection = exportConfig[activeOption.optionNumber] || { ...defaultSelection };
            const totalCost = activeOption.totalPrice + freightCost + tollCost + finalInstallationCost + extrasCost;
            
            return (
                <div
                    key={activeOption.optionNumber}
                    className={`p-5 rounded-lg border-2 shadow-sm transition-colors relative bg-gray-50 border-gray-200 hover:border-highlight`}
                >
                    <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2">
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
                        <span className="text-2xl font-black text-green-700">
                            {formatCurrencyBRL(totalCost)}
                        </span>
                    </div>

                    {activeOption.isModified && (
                        <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200 flex justify-between items-center text-sm">
                            <div className="text-yellow-800">
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
                    
                    <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                        <span className="text-xs font-bold text-purple-700 uppercase block mb-2">Selecione para o PDF:</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 border-r border-gray-100 pr-2">
                                <span className="text-xs font-bold text-gray-400">Original</span>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={currentSelection.original2D} 
                                            onChange={() => toggleExportSelection(activeOption.optionNumber, 'original2D')}
                                            className="w-3 h-3 accent-purple-600"
                                        />
                                        <span className="text-xs font-medium">2D</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={currentSelection.original3D} 
                                            onChange={() => toggleExportSelection(activeOption.optionNumber, 'original3D')}
                                            className="w-3 h-3 accent-purple-600"
                                        />
                                        <span className="text-xs font-medium">3D</span>
                                    </label>
                                </div>
                            </div>
                            
                            {hasSlabInfo && (
                                <>
                                    <div className="flex flex-col gap-1 border-r border-gray-100 pr-2">
                                        <span className="text-xs font-bold text-gray-400">Solução Vão</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixOpening2D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixOpening2D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium">2D</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixOpening3D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixOpening3D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium">3D</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400">Solução Escada</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixStair2D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixStair2D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium">2D</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentSelection.fixStair3D} 
                                                    onChange={() => toggleExportSelection(activeOption.optionNumber, 'fixStair3D')}
                                                    className="w-3 h-3 accent-purple-600"
                                                />
                                                <span className="text-xs font-medium">3D</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-700 font-medium mb-4 pl-2">
                        <p><strong className="text-gray-900">Total Peças:</strong> {activeOption.steps} un</p>
                        <p><strong className="text-gray-900">Alt/Degrau:</strong> {activeOption.stepHeight.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900">Pisante:</strong> {activeOption.treadDepth.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900">Largura:</strong> {activeOption.stairWidth} cm</p>
                        <p><strong className="text-gray-900">Comp. Total:</strong> {(activeOption.totalLength / 100).toFixed(2)} m</p>
                    </div>

                    <div className="mt-3 pt-3 text-xs text-gray-500 border-t border-gray-200 flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 uppercase">Valor da Estrutura:</span>
                                <span className="text-base font-black text-gray-900">{formatCurrencyBRL(activeOption.totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      <div className="pt-6 border-t-2 border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configuração de Frete
            </h3>
            <label className="flex items-center cursor-pointer select-none">
                <span className="mr-2 text-sm font-bold text-gray-600">Cobrar Frete?</span>
                <input type="checkbox" checked={isFreightIncluded} onChange={e => setIsFreightIncluded(e.target.checked)} className="h-5 w-5 text-highlight rounded focus:ring-highlight border-gray-300"/>
            </label>
        </div>
        
        {isFreightIncluded && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
                    <button 
                        onClick={() => setFreightMode('auto')}
                        className={`w-1/2 py-2 text-sm rounded-md font-bold transition ${freightMode === 'auto' ? 'bg-white text-highlight shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        Automático (IA)
                    </button>
                    <button 
                        onClick={() => setFreightMode('manual')}
                        className={`w-1/2 py-2 text-sm rounded-md font-bold transition ${freightMode === 'manual' ? 'bg-white text-highlight shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        Manual
                    </button>
                </div>

                {freightMode === 'auto' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input type="text" value={originCep} onChange={e => handleCepChange(e, setOriginCep)} placeholder="CEP de Origem" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" maxLength={9}/>
                        <p className="text-xs text-gray-500 mt-1 italic">CEP de onde a escada vai sair.</p>
                    </div>
                    <div>
                        <input type="text" value={destinationCep} onChange={e => handleCepChange(e, setDestinationCep)} placeholder="CEP de Destino" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" maxLength={9}/>
                        <p className="text-xs text-gray-500 mt-1 italic">CEP da obra do cliente.</p>
                    </div>
                    </div>
                    <button onClick={handleAutomaticDistance} disabled={isLoading} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm">
                    {isLoading ? 'Calculando com IA...' : 'Calcular Rota com Google Maps'}
                    </button>
                    {error && <p className="text-red-600 mt-2 text-sm font-bold bg-red-50 p-2 rounded">{error}</p>}
                </>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input type="number" value={manualDistance} onChange={e => setManualDistance(e.target.value)} placeholder="Distância (km - apenas ida)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" min="0" step="any"/>
                        <p className="text-xs text-gray-500 mt-1 italic">Distância do Google Maps (só ida).</p>
                    </div>
                    <div>
                        <input type="number" value={manualTollCost} onChange={e => setManualTollCost(e.target.value)} placeholder="Custo Pedágios (R$)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" min="0" step="0.01"/>
                        <p className="text-xs text-gray-500 mt-1 italic">Valor total dos pedágios (ida e volta).</p>
                    </div>
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Preço Gasolina</label>
                        <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="R$/L" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" step="0.01" min="0"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Consumo do Veículo</label>
                        <input type="number" value={consumption} onChange={e => setConsumption(e.target.value)} placeholder="km/L" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" step="0.1" min="0"/>
                    </div>
                </div>

                {/* VISUALIZAÇÃO DO CÁLCULO */}
                {(distance > 0 || (freightMode === 'manual' && parseFloat(manualDistance) > 0)) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200 text-sm">
                        <h4 className="font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">
                            Detalhamento Logística:
                        </h4>
                        <ul className="space-y-1 text-blue-800">
                            <li>📍 Distância Ida: <strong>{(freightMode === 'auto' ? distance : parseFloat(manualDistance)).toFixed(2)} km</strong></li>
                            <li>🔄 Distância Total (Ida x 2): <strong>{((freightMode === 'auto' ? distance : parseFloat(manualDistance)) * 2).toFixed(2)} km</strong></li>
                            <li>⛽ Custo Combustível: <strong>{formatCurrencyBRL(calculateFreightCost((freightMode === 'auto' ? distance : parseFloat(manualDistance)), parseFloat(fuelPrice), parseFloat(consumption)))}</strong></li>
                            <li>🚧 Pedágios: <strong>{formatCurrencyBRL(freightMode === 'auto' ? autoTollCost : (parseFloat(manualTollCost) || 0))}</strong></li>
                            <li className="font-bold border-t border-blue-300 pt-2 mt-2 text-base text-blue-900">🚚 Total Logística: {formatCurrencyBRL(freightCost + tollCost)}</li>
                        </ul>
                    </div>
                )}
            </div>
        )}
      
        <div className="mt-6 bg-gray-100 p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <label htmlFor="installation" className="flex items-center cursor-pointer select-none">
              <input id="installation" type="checkbox" checked={isInstallationIncluded} onChange={e => setIsInstallationIncluded(e.target.checked)} className="h-5 w-5 text-highlight rounded focus:ring-highlight border-gray-300"/>
              <span className="ml-2 text-gray-900 font-bold uppercase">Incluir Instalação?</span>
            </label>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">R$</span>
                <input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} disabled={!isInstallationIncluded} className="w-24 bg-white text-black p-2 rounded-md border-2 border-gray-300 font-bold disabled:bg-gray-100 disabled:text-gray-400" step="10" min="0"/>
            </div>
          </div>
        </div>
      </div>
      
      <UserDataForm onSubmit={onGenerateProposal} />

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
