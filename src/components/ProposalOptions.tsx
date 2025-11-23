import React, { useState, useEffect } from 'react';
import { ProposalOption, UserData } from '../types';
import { formatCurrencyBRL, calculateFreightCost, getRouteInfoFromGemini } from '../utils';

interface ProposalOptionsProps {
  options: ProposalOption[];
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

const ProposalOptions: React.FC<ProposalOptionsProps> = ({ 
    options, 
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-black mb-6 text-gray-900 border-b-2 border-highlight pb-4">Opções Calculadas</h2>
      
      {/* Seção de Opções - Apenas visualização */}
      <div className="space-y-4 mb-8">
        <p className="text-sm text-gray-500 font-medium">Confira as 3 opções geradas:</p>
        {options.map((option) => {
            const totalCost = option.totalPrice + freightCost + tollCost + finalInstallationCost;
            return (
                <div
                    key={option.optionNumber}
                    className="p-5 rounded-lg bg-gray-50 border-2 border-gray-200 shadow-sm hover:border-highlight transition-colors"
                >
                    <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                        <h3 className="text-lg font-black text-gray-900">
                            Opção {option.optionNumber}
                        </h3>
                        <span className="text-2xl font-black text-green-700">
                            {formatCurrencyBRL(totalCost)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-700 font-medium">
                        <p><strong className="text-gray-900">Degraus:</strong> {option.steps} un</p>
                        <p><strong className="text-gray-900">Alt/Degrau:</strong> {option.stepHeight.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900">Largura:</strong> {option.stairWidth} cm</p>
                        <p><strong className="text-gray-900">Comp. Total:</strong> {(option.totalLength / 100).toFixed(2)} m</p>
                    </div>
                    <div className="mt-3 pt-2 text-xs text-gray-500 border-t border-gray-200 flex justify-between">
                        <span>Estrutura: <strong>{formatCurrencyBRL(option.totalPrice)}</strong></span>
                        <span>Logística/Instalação: <strong>{formatCurrencyBRL(freightCost + tollCost + finalInstallationCost)}</strong></span>
                    </div>
                </div>
            )
        })}
      </div>

      <div className="pt-6 border-t-2 border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Configuração de Frete
        </h3>
        
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
              <input type="text" value={originCep} onChange={e => handleCepChange(e, setOriginCep)} placeholder="CEP de Origem" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" maxLength={9}/>
              <input type="text" value={destinationCep} onChange={e => handleCepChange(e, setDestinationCep)} placeholder="CEP de Destino" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" maxLength={9}/>
            </div>
            <button onClick={handleAutomaticDistance} disabled={isLoading} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm">
              {isLoading ? 'Calculando com IA...' : 'Calcular Rota com Google Maps'}
            </button>
             {distance > 0 && (
                <div className="text-green-800 mt-2 text-sm text-center bg-green-100 p-3 rounded-md border border-green-200 font-bold">
                    <p>Distância da rota: {distance.toFixed(2)} km (ida)</p>
                    <p>Custo estimado de pedágios: {formatCurrencyBRL(autoTollCost)}</p>
                </div>
            )}
            {error && <p className="text-red-600 mt-2 text-sm font-bold bg-red-50 p-2 rounded">{error}</p>}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" value={manualDistance} onChange={e => setManualDistance(e.target.value)} placeholder="Distância (km - apenas ida)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" min="0" step="any"/>
              <input type="number" value={manualTollCost} onChange={e => setManualTollCost(e.target.value)} placeholder="Custo Pedágios (R$)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" min="0" step="0.01"/>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="Preço Combustível (R$/L)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" step="0.01" min="0"/>
          <input type="number" value={consumption} onChange={e => setConsumption(e.target.value)} placeholder="Consumo (km/L)" className="w-full bg-white text-black p-3 rounded-md border-2 border-gray-300 font-medium" step="0.1" min="0"/>
        </div>
      
        <div className="mt-6 bg-gray-100 p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <label htmlFor="installation" className="flex items-center cursor-pointer select-none">
              <input id="installation" type="checkbox" checked={isInstallationIncluded} onChange={e => setIsInstallationIncluded(e.target.checked)} className="h-5 w-5 text-highlight rounded focus:ring-highlight border-gray-300"/>
              <span className="ml-2 text-gray-900 font-bold">Incluir Instalação?</span>
            </label>
            <input type="number" value={installationCost} onChange={e => setInstallationCost(parseFloat(e.target.value) || 0)} disabled={!isInstallationIncluded} className="w-32 bg-white text-black p-2 rounded-md border-2 border-gray-300 font-bold disabled:bg-gray-100 disabled:text-gray-400" step="10" min="0"/>
          </div>
        </div>
      </div>
      
      {/* Formulário de Dados do Cliente - Agora sempre visível se houver opções */}
      <UserDataForm onSubmit={onGenerateProposal} />
    </div>
  );
};

export default ProposalOptions;