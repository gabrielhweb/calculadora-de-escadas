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
  const [installationCost, setInstallationCost] = useState(350);

  const handleCalculate = (data: CalculatorInput) => {
    setInputData(data);
    setUserData(null); // Reseta dados do cliente ao recalcular

    const baseSteps = data.desiredSteps;
    // Gera 3 opções: menos degraus, degraus exatos, mais degraus
    const stepOptions = [baseSteps - 1, baseSteps, baseSteps + 1]
      .filter(s => s > 1); // Garante que não tenha degrau negativo ou zero

    const newOptions: ProposalOption[] = stepOptions.map((steps, index) => {
      const stepHeight = data.totalHeight / steps;
      const totalLength = (steps - 1) * data.treadDepth;
      const totalPrice = calculateTotalPrice(data.stairWidth, data.treadDepth, steps);

      return {
        optionNumber: index + 1,
        steps,
        stepHeight,
        totalLength,
        totalPrice,
        stairWidth: data.stairWidth,
        treadDepth: data.treadDepth,
      };
    });
    
    setOptions(newOptions);
  };

  const handleGenerateProposal = (data: UserData) => {
    setUserData(data);
  };

  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Calculadora Oficial</h1>
        <p className="text-gray-500 mt-2 font-light">Ferramenta interna para geração de propostas comerciais.</p>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <aside>
          <CalculatorForm onCalculate={handleCalculate} />
        </aside>
        <section className="flex flex-col">
          {/* Lógica de Exibição */}
          {userData && inputData && options.length > 0 ? (
            <ProposalDocument
              options={options}
              userData={userData}
              inputData={inputData}
              freightCost={freightCost}
              tollCost={tollCost}
              installationCost={finalInstallationCost}
              onBack={() => setUserData(null)}
            />
          ) : options.length > 0 ? (
            <ProposalOptions
              options={options}
              onGenerateProposal={handleGenerateProposal}
              freightCost={freightCost}
              setFreightCost={setFreightCost}
              tollCost={tollCost}
              setTollCost={setTollCost}
              isInstallationIncluded={isInstallationIncluded}
              setIsInstallationIncluded={setIsInstallationIncluded}
              installationCost={installationCost}
              setInstallationCost={setInstallationCost}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Aguardando Medidas</h3>
                  <p className="text-gray-500 mt-2">
                    Preencha o formulário ao lado para iniciar.
                  </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Calculator;