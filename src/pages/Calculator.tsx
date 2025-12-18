
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
    const effectiveWidth = data.stairWidth > 0 ? data.stairWidth : 70;
    const effectiveTread = data.treadDepth > 0 ? data.treadDepth : 24;

    setInputData(data);
    setUserData(null);

    const baseSteps = data.desiredSteps;
    const stepOptions = [baseSteps - 1, baseSteps, baseSteps + 1].filter(s => s > 1);

    const newOptions: ProposalOption[] = stepOptions.map((steps, index) => {
      const stepHeight = data.totalHeight / (steps + 1);
      let totalLength = data.customTotalLength || (steps * (effectiveTread + 1));
      let finalTreadDepth = data.customTotalLength ? (totalLength / steps) - 1 : effectiveTread;

      // Cálculo de Preço Estrutura
      let structurePrice = data.customStepPrice ? (data.customStepPrice * steps) : calculateTotalPrice(effectiveWidth, finalTreadDepth, steps);

      // Adiciona Valor do Patamar se ativo
      const landingData = data.landing?.active ? {
          ...data.landing,
          step: data.landing.step || steps // Se não definido, assume o último
      } : undefined;

      const totalPriceWithLanding = structurePrice + (landingData ? landingData.price : 0);

      return {
        optionNumber: index + 1,
        steps,
        stepHeight,
        totalLength,
        totalPrice: totalPriceWithLanding,
        stairWidth: effectiveWidth,
        treadDepth: finalTreadDepth,
        landing: landingData
      };
    });
    
    setOptions(newOptions);
  };

  const handleGenerateProposal = (data: UserData) => setUserData(data);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase">Calculadora Oficial Zilinski</h1>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <aside>
          <CalculatorForm onCalculate={handleCalculate} />
        </aside>
        <section className="flex flex-col">
          {userData && inputData && options.length > 0 ? (
            <ProposalDocument
              options={options} userData={userData} inputData={inputData}
              freightCost={freightCost} tollCost={tollCost} installationCost={isInstallationIncluded ? installationCost : 0}
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
            <div className="bg-white p-10 rounded-lg text-center shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-400 font-bold uppercase">Preencha as medidas ao lado para ver as opções</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Calculator;
