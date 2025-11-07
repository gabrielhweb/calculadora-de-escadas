import { useState } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ProposalOptions from './components/ProposalOptions';
import ProposalDocument from './components/ProposalDocument';
import { CalculatorInput, ProposalOption, UserData } from './types';
import { calculateTotalPrice } from './utils';

function App() {
  const [inputData, setInputData] = useState<CalculatorInput | null>(null);
  const [options, setOptions] = useState<ProposalOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ProposalOption | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [freightCost, setFreightCost] = useState(0);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState(true);
  const [installationCost, setInstallationCost] = useState(350);

  const handleCalculate = (data: CalculatorInput) => {
    setInputData(data);
    setUserData(null);
    setSelectedOption(null);

    const baseSteps = data.desiredSteps;
    const stepOptions = [baseSteps - 1, baseSteps, baseSteps + 1]
      .filter(s => s > 1);

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
    if (newOptions.length > 0) {
      const desiredOptionIndex = newOptions.findIndex(opt => opt.steps === baseSteps);
      setSelectedOption(newOptions[desiredOptionIndex !== -1 ? desiredOptionIndex : 0]);
    }
  };

  const handleGenerateProposal = (data: UserData) => {
    if (!selectedOption) {
      alert("Por favor, selecione uma opção antes de gerar a proposta.");
      return;
    }
    setUserData(data);
  };

  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;

  return (
    <div className="bg-primary min-h-screen text-white font-sans p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-highlight">Calculadora de Escadas</h1>
        <p className="text-gray-400 mt-2">Gere orçamentos detalhados para escadas pré-moldadas.</p>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <aside>
          <CalculatorForm onCalculate={handleCalculate} />
        </aside>
        <section className="flex flex-col">
          {userData && selectedOption && inputData ? (
            <ProposalDocument
              option={selectedOption}
              userData={userData}
              inputData={inputData}
              freightCost={freightCost}
              installationCost={finalInstallationCost}
            />
          ) : options.length > 0 ? (
            <ProposalOptions
              options={options}
              selectedOption={selectedOption}
              onSelect={setSelectedOption}
              onGenerateProposal={handleGenerateProposal}
              freightCost={freightCost}
              setFreightCost={setFreightCost}
              isInstallationIncluded={isInstallationIncluded}
              setIsInstallationIncluded={setIsInstallationIncluded}
              installationCost={installationCost}
              setInstallationCost={setInstallationCost}
            />
          ) : (
            <div className="bg-secondary p-6 rounded-lg shadow-lg h-full flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Insira as medidas na calculadora ao lado para ver as opções de orçamento.
              </p>
            </div>
          )}
        </section>
      </main>
      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Gerador de Propostas de Escada. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
