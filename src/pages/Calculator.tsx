
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CalculatorForm from '../components/CalculatorForm';
import ProposalOptions from '../components/ProposalOptions';
import { ProposalDocument } from '../components/ProposalDocument';
import { CalculatorInput, ProposalOption, UserData, SavedQuote } from '../types';
import { calculateTotalPrice } from '../utils';
import { saveQuote } from '../services/storage';

function Calculator() {
  const [inputData, setInputData] = useState<CalculatorInput | null>(null);
  const [options, setOptions] = useState<ProposalOption[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [freightCost, setFreightCost] = useState(0);
  const [tollCost, setTollCost] = useState(0);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState(true);
  const [installationCost, setInstallationCost] = useState(290);
  const [freightMode, setFreightMode] = useState<'auto' | 'manual' | 'fixed' | 'transportadora'>('auto');
  const [isSaving, setIsSaving] = useState(false);

  const location = useLocation();

  // Verifica se veio de uma restauração de orçamento
  useEffect(() => {
    if (location.state && location.state.restoreData) {
        const saved: SavedQuote = location.state.restoreData;
        setInputData(saved.inputData);
        if (saved.userData) setUserData(saved.userData);
        setFreightCost(saved.freightCost);
        setTollCost(saved.tollCost);
        setInstallationCost(saved.installationCost);
        setIsInstallationIncluded(saved.isInstallationIncluded);
        if (saved.inputData.logistics?.freightMode) {
            setFreightMode(saved.inputData.logistics.freightMode);
        }
        
        // Recalcula opções
        handleCalculate(saved.inputData, true); // true = silent (sem scroll se quisesse)
        
        // Limpa o state para não restaurar novamente num F5 indesejado
        window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCalculate = (data: CalculatorInput, isRestoring = false) => {
    // 1. Aplica Valores Padrão se vierem vazios
    const effectiveWidth = data.stairWidth > 0 ? data.stairWidth : 70;
    const effectiveTread = data.treadDepth > 0 ? data.treadDepth : 24;

    const enrichedData = { ...data, stairWidth: effectiveWidth, treadDepth: effectiveTread };
    setInputData(enrichedData);
    if (!isRestoring) setUserData(null);

    // 2. Atualiza Logística se veio do formulário (apenas se não estiver restaurando, ou se quiser sobrescrever)
    if (data.logistics && !isRestoring) {
        setFreightCost(data.logistics.totalFreightCost);
        setTollCost(data.logistics.tolls);
    }

    const baseTotalUnits = data.desiredSteps; // Número TOTAL de peças (degraus + patamares)
    // Opções variam a quantidade total de peças
    const stepOptions = [baseTotalUnits - 1, baseTotalUnits, baseTotalUnits + 1].filter(s => s > 1);

    const numLandings = data.landings.length;

    const newOptions: ProposalOption[] = stepOptions.map((totalUnits, index) => {
      const structureSteps = totalUnits - numLandings;
      
      if (structureSteps < 0) {
          return {
            optionNumber: index + 1,
            steps: totalUnits,
            structureSteps: 0,
            stepHeight: 0,
            totalLength: 0,
            totalPrice: 0,
            stairWidth: effectiveWidth,
            treadDepth: effectiveTread,
            landings: data.landings
          }
      }

      // AJUSTE DINÂMICO DE PATAMARES (Último Degrau)
      const adjustedLandings = data.landings.map(l => {
          if (l.isLastStep) {
              return { ...l, step: totalUnits };
          }
          return l;
      });

      // CORREÇÃO: Cálculo correto de Espelhos (Risers)
      // Se tiver patamar rente à laje (no topo), ele já é o nível final, então NumEspelhos = NumPeças.
      // Se não tiver (ou for abaixo), precisa de mais 1 espelho para chegar na laje.
      const hasFlushTopLanding = adjustedLandings.some(l => l.isLastStep && l.isFlushWithSlab);
      const numRisers = hasFlushTopLanding ? totalUnits : totalUnits + 1;
      
      const calculatedStepHeight = data.totalHeight / numRisers;
      
      let totalLength = 0;
      let finalTreadDepth = effectiveTread;
      
      const optionNumber = index + 1;
      const applyLimiter = data.customTotalLength && data.customTotalLength > 0 && 
                           (!data.customTotalLengthOption || data.customTotalLengthOption === 'all' || data.customTotalLengthOption === optionNumber.toString());

      if (applyLimiter) {
          totalLength = data.customTotalLength!;
          // finalTreadDepth = (totalLength / totalUnits); <-- Lógica antiga simples
          
          const landingsLen = adjustedLandings.reduce((acc, l) => acc + l.length, 0);
          const stairsLen = totalLength - landingsLen;
          
          if (structureSteps > 0) {
              // SOLICITAÇÃO AUDIO 1: Descontar 1cm automaticamente da pisada útil quando houver limitador
              // A estrutura ocupa o espaço total, mas a pisada útil visualizada é menor.
              finalTreadDepth = (stairsLen / structureSteps) - 1;
          }
      } else {
          // *** ALTERAÇÃO: GAP AGORA É 0.5cm ***
          const gapPerStep = 0.5; 
          const stairsLength = structureSteps * (finalTreadDepth + gapPerStep);
          const landingsLength = adjustedLandings.reduce((acc, l) => acc + l.length, 0);
          totalLength = stairsLength + landingsLength;
      }

      // Preço
      let totalPrice = 0;
      
      // 1. Preço dos degraus comuns
      if (data.customStepPrice && data.customStepPrice > 0) {
          totalPrice += data.customStepPrice * structureSteps; 
      } else {
          totalPrice += calculateTotalPrice(effectiveWidth, finalTreadDepth, structureSteps); 
      }

      // 2. Preço dos patamares
      const landingsPrice = adjustedLandings.reduce((acc, l) => acc + l.price, 0);
      totalPrice += landingsPrice;

      return {
        optionNumber: index + 1,
        steps: totalUnits, // Visualmente mostramos o total de peças
        structureSteps: structureSteps, // Internamente sabemos quantos degraus são
        stepHeight: calculatedStepHeight,
        totalLength,
        totalPrice,
        stairWidth: effectiveWidth,
        treadDepth: finalTreadDepth,
        landings: adjustedLandings
      };
    });
    
    setOptions(newOptions);
  };

  const handleGenerateProposal = (data: UserData, modifiedOptions?: ProposalOption[]) => {
      if (modifiedOptions) {
          setOptions(modifiedOptions);
      }
      setUserData(data);
  };

  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;

  const handleSaveQuote = async () => {
    if (!inputData) return;
    
    let clientName = userData?.name || "";
    if (!clientName) {
        const name = prompt("Digite um nome para identificar este orçamento:");
        if (!name) return;
        clientName = name;
    }

    setIsSaving(true);
    await saveQuote({
        clientName,
        inputData: {
            ...inputData,
            logistics: {
                ...(inputData.logistics || {
                    originCep: '',
                    destinationCep: '',
                    distance: 0,
                    tolls: 0,
                    fuelPrice: 0,
                    consumption: 0,
                    totalFreightCost: freightCost
                }),
                freightMode
            }
        },
        userData: userData || undefined,
        freightCost,
        tollCost,
        installationCost,
        isInstallationIncluded
    });
    setIsSaving(false);

    alert("Orçamento salvo! Disponível em 'Salvos' em todos os dispositivos.");
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="text-center mb-8 flex justify-center relative">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Calculadora Oficial</h1>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <aside>
          <CalculatorForm onCalculate={handleCalculate} />
        </aside>
        <section className="flex flex-col relative">
          
          {/* BOTÃO FLUTUANTE DE SALVAR */}
          {inputData && options.length > 0 && (
             <button 
                onClick={handleSaveQuote}
                disabled={isSaving}
                className="absolute -top-12 right-0 bg-white dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg shadow border border-gray-200 dark:border-gray-600 font-bold hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-sm z-10 disabled:opacity-50"
             >
                {isSaving ? (
                    <span className="animate-spin h-5 w-5 border-2 border-highlight rounded-full border-t-transparent"></span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                )}
                {isSaving ? "Salvando..." : "Salvar Orçamento"}
             </button>
          )}

          {userData && inputData && options.length > 0 ? (
            <ProposalDocument
              options={options} userData={userData} inputData={inputData}
              freightCost={freightCost} tollCost={tollCost} installationCost={finalInstallationCost}
              isTransportadora={freightMode === 'transportadora'}
              onBack={() => setUserData(null)}
            />
          ) : options.length > 0 && inputData ? (
            <ProposalOptions
              options={options} inputData={inputData} onGenerateProposal={handleGenerateProposal}
              freightCost={freightCost} setFreightCost={setFreightCost}
              tollCost={tollCost} setTollCost={setTollCost}
              isInstallationIncluded={isInstallationIncluded} setIsInstallationIncluded={setIsInstallationIncluded}
              installationCost={installationCost} setInstallationCost={setInstallationCost}
              freightMode={freightMode} setFreightMode={setFreightMode}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Aguardando Medidas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Preencha o formulário ao lado para ver as opções.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Calculator;
