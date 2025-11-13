import React, { useState, useEffect } from 'react';
import { ProposalOption, UserData } from '../types';
import { formatCurrencyBRL, calculateFreightCost, getRouteInfoFromGemini } from '../utils';

interface ProposalOptionsProps {
  options: ProposalOption[];
  selectedOption: ProposalOption | null;
  onSelect: (option: ProposalOption) => void;
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

const UserDataForm: React.FC<{ onSubmit: (data: UserData) => void; option: ProposalOption }> = ({ onSubmit, option }) => {
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
    <div className="mt-6 p-4 bg-accent rounded-lg">
       <h3 className="text-lg font-bold text-highlight mb-4">Gerar Proposta para Opção {option.optionNumber}</h3>
       <form onSubmit={handleSubmit} className="space-y-3">
         <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Cliente (Obrigatório)" className="w-full bg-secondary text-white p-2 rounded-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-highlight"/>
         <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="CPF/CNPJ do Cliente (Opcional)" className="w-full bg-secondary text-white p-2 rounded-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-highlight"/>
         <input required type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Endereço da Obra (Obrigatório)" className="w-full bg-secondary text-white p-2 rounded-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-highlight"/>
         {error && <p className="text-red-400 text-sm">{error}</p>}
         <button type="submit" className="w-full bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-transform transform hover:scale-105">
           Confirmar Dados e Ver PDF
         </button>
       </form>
    </div>
  )
}

const ProposalOptions: React.FC<ProposalOptionsProps> = ({ 
    options, 
    selectedOption, 
    onSelect, 
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
  const [fuelPrice, setFuelPrice] = useState('5.80');
  const [consumption, setConsumption] = useState('8');
  const [distance, setDistance] = useState(0);
  const [autoTollCost, setAutoTollCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [freightMode, setFreightMode] = useState<'auto' | 'manual'>('auto');
  const [manualDistance, setManualDistance] = useState('');
  const [manualTollCost, setManualTollCost] = useState('');

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, setCep: (value: string) => void) => {
    let { value } = e.target;
    value = value.replace(/\D/g, '').slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
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

}, [freightMode, distance, autoTollCost, manualDistance, manualTollCost, fuelPrice, consumption, setFreightCost, setTollCost]);

  const finalInstallationCost = isInstallationIncluded ? installationCost : 0;
    
  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Opções de Orçamento</h2>
      <div className="space-y-4">
        {options.map((option) => {
            const totalCost = option.totalPrice + freightCost + tollCost + finalInstallationCost;
            return (
                <div
                    key={option.optionNumber}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedOption?.optionNumber === option.optionNumber
                        ? 'bg-highlight text-primary ring-2 ring-yellow-300 shadow-xl'
                        : 'bg-accent hover:bg-gray-700'
                    }`}
                    onClick={() => onSelect(option)}
                >
                    <div className="flex justify-between items-center">
                    <h3 className={`text-xl font-bold ${selectedOption?.optionNumber === option.optionNumber ? 'text-primary' : 'text-highlight'}`}>
                        Opção {option.optionNumber}
                    </h3>
                    <span className={`text-2xl font-extrabold ${selectedOption?.optionNumber === option.optionNumber ? 'text-primary' : 'text-white'}`}>
                        {formatCurrencyBRL(totalCost)}
                    </span>
                    </div>
                    <div className={`mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm ${selectedOption?.optionNumber === option.optionNumber ? 'text-blue-900' : 'text-gray-300'}`}>
                        <p><strong>Degraus:</strong> {option.steps} un</p>
                        <p><strong>Altura/Degrau:</strong> {option.stepHeight.toFixed(2)} cm</p>
                        <p><strong>Largura:</strong> {option.stairWidth} cm</p>
                        <p><strong>Comp. Total:</strong> {(option.totalLength / 100).toFixed(2)} m</p>
                    </div>
                    <div className={`mt-2 pt-2 border-t text-xs ${selectedOption?.optionNumber === option.optionNumber ? 'border-primary/30' : 'border-gray-600'}`}>
                        Escada: {formatCurrencyBRL(option.totalPrice)} | Frete: {formatCurrencyBRL(freightCost)} | Pedágios: {formatCurrencyBRL(tollCost)} | Instalação: {formatCurrencyBRL(finalInstallationCost)}
                    </div>
                </div>
            )
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Cálculo de Frete e Serviços</h3>
        
        <div className="flex bg-accent rounded-lg p-1 mb-4">
            <button 
                onClick={() => setFreightMode('auto')}
                className={`w-1/2 py-2 text-sm rounded-md font-semibold transition ${freightMode === 'auto' ? 'bg-highlight text-primary' : 'text-gray-300'}`}
            >
                Automático (IA)
            </button>
            <button 
                onClick={() => setFreightMode('manual')}
                className={`w-1/2 py-2 text-sm rounded-md font-semibold transition ${freightMode === 'manual' ? 'bg-highlight text-primary' : 'text-gray-300'}`}
            >
                Manual
            </button>
        </div>

        {freightMode === 'auto' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={originCep} onChange={e => handleCepChange(e, setOriginCep)} placeholder="CEP de Origem" className="w-full bg-accent text-white p-2 rounded-md" maxLength={9}/>
              <input type="text" value={destinationCep} onChange={e => handleCepChange(e, setDestinationCep)} placeholder="CEP de Destino" className="w-full bg-accent text-white p-2 rounded-md" maxLength={9}/>
            </div>
            <button onClick={handleAutomaticDistance} disabled={isLoading} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Calculando com IA...' : 'Calcular Rota com Google Maps'}
            </button>
             {distance > 0 && (
                <div className="text-green-400 mt-2 text-sm text-center bg-accent p-2 rounded-md">
                    <p>Distância da rota: <strong>{distance.toFixed(2)} km</strong> (ida)</p>
                    <p>Custo estimado de pedágios: <strong>{formatCurrencyBRL(autoTollCost)}</strong></p>
                </div>
            )}
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" value={manualDistance} onChange={e => setManualDistance(e.target.value)} placeholder="Distância (km - apenas ida)" className="w-full bg-accent text-white p-2 rounded-md" min="0" step="any"/>
              <input type="number" value={manualTollCost} onChange={e => setManualTollCost(e.target.value)} placeholder="Custo Pedágios (R$)" className="w-full bg-accent text-white p-2 rounded-md" min="0" step="0.01"/>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="Preço Combustível (R$/L)" className="w-full bg-accent text-white p-2 rounded-md" step="0.01" min="0"/>
          <input type="number" value={consumption} onChange={e => setConsumption(e.target.value)} placeholder="Consumo (km/L)" className="w-full bg-accent text-white p-2 rounded-md" step="0.1" min="0"/>
        </div>
      
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label htmlFor="installation" className="flex items-center cursor-pointer">
              <input id="installation" type="checkbox" checked={isInstallationIncluded} onChange={e => setIsInstallationIncluded(e.target.checked)} className="form-checkbox h-5 w-5 text-highlight bg-gray-800 border-gray-600 rounded focus:ring-highlight"/>
              <span className="ml-2 text-gray-300">Incluir Instalação?</span>
            </label>
            <input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} disabled={!isInstallationIncluded} className="w-32 bg-accent text-white p-2 rounded-md disabled:bg-gray-800 disabled:text-gray-500" step="10" min="0"/>
          </div>
        </div>
      </div>
      
      {selectedOption && (
        <UserDataForm onSubmit={onGenerateProposal} option={selectedOption} />
      )}
    </div>
  );
};

export default ProposalOptions;