
import { useState } from 'react';
import CalculatorForm from '../components/CalculatorForm';
import ProposalOptions from '../components/ProposalOptions';
import ProposalDocument from '../components/ProposalDocument';
import { CalculatorInput, ProposalOption, UserData } from '../types';
import { calculateTotalPrice } from '../utils';

function Calculator() {
  const [inputData, setInputData] = useState<CalculatorInput | null>(null);
  const [options, setOptions] = useState<ProposalOption[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [freightCost, setFreightCost] = useState(0);
  const [tollCost, setTollCost] = useState(0);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState(true);
  const [installationCost, setInstallationCost] = useState(290);

  const handleCalculate = (data: CalculatorInput) => {
    // 1. Aplica Valores Padrão se vierem vazios
    const effectiveWidth = data.stairWidth > 0 ? data.stairWidth : 70;
    const effectiveTread = data.treadDepth > 0 ? data.treadDepth : 24;

    const enrichedData = { ...data, stairWidth: effectiveWidth, treadDepth: effectiveTread };
    setInputData(enrichedData);
    setUserData(null);

    // 2. Atualiza Logística se veio do formulário
    if (data.logistics) {
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

      const numRisers = totalUnits + 1;
      const calculatedStepHeight = data.totalHeight / numRisers;
      
      let totalLength = 0;
      let finalTreadDepth = effectiveTread;
      
      if (data.customTotalLength && data.customTotalLength > 0) {
          totalLength = data.customTotalLength;
          finalTreadDepth = (totalLength / totalUnits); 
          const landingsLen = adjustedLandings.reduce((acc, l) => acc + l.length, 0);
          const stairsLen = totalLength - landingsLen;
          if (structureSteps > 0) {
              finalTreadDepth = stairsLen / structureSteps;
          }
      } else {
          const gapPerStep = 1; 
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

  const handleGenerateProposal = (data: UserData) => setUserData(data);
  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Calculadora Oficial</h1>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <aside>
          <CalculatorForm onCalculate={handleCalculate} />
        </aside>
        <section className="flex flex-col">
          {userData && inputData && options.length > 0 ? (
            <ProposalDocument
              options={options} userData={userData} inputData={inputData}
              freightCost={freightCost} tollCost={tollCost} installationCost={finalInstallationCost}
              onBack={() => setUserData(null)}
            />
          ) : options.length > 0 && inputData ? (
            <ProposalOptions
              options={options} inputData={inputData} onGenerateProposal={handleGenerateProposal}
              freightCost={freightCost} setFreightCost={setFreightCost}
              tollCost={tollCost} setTollCost={setTollCost}
              isInstallationIncluded={isInstallationIncluded} setIsInstallationIncluded={setIsInstallationIncluded}
              installationCost={installationCost} setInstallationCost={setInstallationCost}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-700">Aguardando Medidas</h3>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Calculator;
