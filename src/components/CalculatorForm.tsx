import React, { useState } from 'react';
import { CalculatorInput, OptionalItem, LandingInfo } from '../types';
import { calculateLandingPrice } from '../utils';

interface CalculatorFormProps {
  onCalculate: (data: CalculatorInput) => void;
}

const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
  </svg>
);

// Componente de Input Auxiliar
const InputField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  unit?: string; 
  type?: string; 
  placeholder?: string;
  helperText?: string;
  isOptional?: boolean; 
  onUnitChange?: (unit: 'cm' | 'm') => void; 
  currentUnit?: 'cm' | 'm';
  className?: string;
}> = ({ label, value, onChange, unit, type = "number", placeholder, helperText, isOptional, onUnitChange, currentUnit, className }) => (
  <div className={className}>
    <label className="block text-sm font-black text-gray-900 mb-1">
        {label} {isOptional ? <span className="text-gray-400 font-normal">(Opcional)</span> : <span className="text-red-500">*</span>}
    </label>
    <div className="flex items-center shadow-sm">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-white text-black p-3 rounded-l-md border-2 border-gray-300 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition font-bold text-lg"
        placeholder={placeholder || (isOptional ? "Automático" : label)}
        min="0"
        step="any"
      />
      {onUnitChange ? (
          <select 
            value={currentUnit} 
            onChange={(e) => onUnitChange(e.target.value as 'cm'|'m')}
            className="bg-gray-100 text-gray-800 p-3 rounded-r-md border-2 border-l-0 border-gray-300 font-bold focus:outline-none focus:border-highlight cursor-pointer"
          >
              <option value="cm">cm</option>
              <option value="m">m</option>
          </select>
      ) : (
        unit && <span className="bg-gray-100 text-gray-800 p-3 rounded-r-md border-2 border-l-0 border-gray-300 font-bold min-w-[3rem] text-center flex items-center justify-center">{unit}</span>
      )}
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1 italic">{helperText}</p>}
  </div>
);

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  // --- Estados Básicos ---
  const [totalHeight, setTotalHeight] = useState<string>('300');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm'>('cm');
  
  // Alterado padrão para 12
  const [desiredSteps, setDesiredSteps] = useState<string>('12');
  
  const [stairWidth, setStairWidth] = useState<string>('70');
  const [widthUnit, setWidthUnit] = useState<'cm' | 'm'>('cm');
  
  // Alterado padrão para 20
  const [treadDepth, setTreadDepth] = useState<string>('20');
  const [depthUnit, setDepthUnit] = useState<'cm' | 'm'>('cm');

  const [dampers, setDampers] = useState<string>('4');
  
  // --- Estados Avançados ---
  // Alterado padrão para 440
  const [customStepPrice, setCustomStepPrice] = useState<string>('440');
  const [customTotalLength, setCustomTotalLength] = useState<string>('');
  const [lengthUnit, setLengthUnit] = useState<'cm' | 'm'>('cm');

  // --- Estados de Patamares (Lista) ---
  const [landings, setLandings] = useState<LandingInfo[]>([]);

  // --- Estados de Itens Opcionais ---
  const [optionalItems, setOptionalItems] = useState<OptionalItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const [error, setError] = useState<string>('');

  // Handlers para Itens Extras
  const handleAddItem = () => {
    if (newItemName && newItemPrice) {
      setOptionalItems([...optionalItems, { id: Date.now().toString(), name: newItemName, price: parseFloat(newItemPrice) || 0 }]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const handleRemoveItem = (id: string) => {
    setOptionalItems(optionalItems.filter(item => item.id !== id));
  };

  // Handlers para Patamares
  const handleAddLanding = () => {
    // Configurações padrão solicitadas:
    // Degrau: Último (total de peças atual)
    // Preço: 1030
    // Comprimento: 80
    // Largura: 70
    
    const lastStep = parseInt(desiredSteps) || 1;

    const newLanding: LandingInfo = {
        id: Date.now().toString(),
        step: lastStep,
        length: 80,
        width: 70,
        price: 1030
    };
    setLandings([...landings, newLanding]);
  };

  const handleRemoveLanding = (id: string) => {
      setLandings(landings.filter(l => l.id !== id));
  };

  const updateLanding = (id: string, field: keyof LandingInfo, value: string) => {
      setLandings(landings.map(l => {
          if (l.id === id) {
              return { ...l, [field]: parseFloat(value) || 0 };
          }
          return l;
      }));
  };

  const convertToCm = (val: string, unit: 'cm' | 'm') => {
      const num = parseFloat(val);
      if (!num) return 0;
      return unit === 'm' ? num * 100 : num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const heightInCm = convertToCm(totalHeight, heightUnit);
    const widthInCm = convertToCm(stairWidth, widthUnit);
    const depthInCm = convertToCm(treadDepth, depthUnit);
    const lengthInCm = convertToCm(customTotalLength, lengthUnit);

    const formData: CalculatorInput = {
      totalHeight: heightInCm || 0,
      desiredSteps: parseInt(desiredSteps, 10) || 0,
      stairWidth: widthInCm,
      treadDepth: depthInCm,
      dampers: parseInt(dampers, 10) || 4,
      customStepPrice: customStepPrice ? parseFloat(customStepPrice) : undefined,
      customTotalLength: lengthInCm || undefined,
      optionalItems: optionalItems,
      landings: landings,
    };

    if (formData.totalHeight <= 0 || formData.desiredSteps <= 0) {
      setError('Altura e Número de Degraus são obrigatórios.');
      return;
    }
    
    // Validação básica: Não pode ter mais patamares que degraus
    if (landings.length >= formData.desiredSteps) {
        setError('O número de patamares não pode ser maior ou igual ao número total de degraus.');
        return;
    }

    setError('');
    onCalculate(formData);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 sticky top-24">
      <h2 className="text-2xl font-black mb-6 text-gray-900 flex items-center border-b-2 border-highlight pb-4">
        <CalculatorIcon /> 
        Medidas
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ALTURA E DEGRAUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-black text-gray-900 mb-1">Altura Total *</label>
            <div className="flex shadow-sm">
                <input
                type="number"
                value={totalHeight}
                onChange={(e) => setTotalHeight(e.target.value)}
                className="w-full bg-white text-black p-3 rounded-l-md border-2 border-gray-300 focus:outline-none focus:border-highlight transition font-bold text-lg"
                placeholder="300"
                min="0"
                step="any"
                />
                <select
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'm')}
                className="bg-gray-100 text-gray-800 p-3 rounded-r-md border-2 border-l-0 border-gray-300 font-bold cursor-pointer outline-none"
                >
                <option value="cm">cm</option>
                <option value="m">m</option>
                </select>
            </div>
            <p className="text-xs text-gray-500 mt-1 italic">Piso a Piso.</p>
            </div>

            <InputField 
                label="Qtd. Total Peças" 
                value={desiredSteps} 
                onChange={e => setDesiredSteps(e.target.value)} 
                unit="un"
                helperText="Subidas totais (Degraus + Patamares)."
            />
        </div>
        
        {/* LARGURA E PISANTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
                label="Largura" 
                value={stairWidth} 
                onChange={e => setStairWidth(e.target.value)} 
                isOptional={true}
                onUnitChange={setWidthUnit}
                currentUnit={widthUnit}
                helperText="Padrão: 70cm"
            />
            
            <InputField 
                label="Pisante (Passo)" 
                value={treadDepth} 
                onChange={e => setTreadDepth(e.target.value)} 
                isOptional={true}
                onUnitChange={setDepthUnit}
                currentUnit={depthUnit}
                helperText="Padrão: 24cm"
            />
        </div>
        
        {/* AMORTECEDORES E AVANÇADO */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
             <InputField 
                label="Amortecedores" 
                value={dampers} 
                onChange={e => setDampers(e.target.value)} 
                unit="un"
                helperText="Padrão: 4"
            />
            <InputField 
                label="Preço/Degrau" 
                value={customStepPrice} 
                onChange={e => setCustomStepPrice(e.target.value)} 
                unit="R$" 
                isOptional={true}
                helperText="Manual (Substitui tabela)"
            />
        </div>
        
        <InputField 
            label="Comprimento Total Manual" 
            value={customTotalLength} 
            onChange={e => setCustomTotalLength(e.target.value)} 
            isOptional={true}
            onUnitChange={setLengthUnit}
            currentUnit={lengthUnit}
            helperText="Trava o comprimento da escada"
        />

        {/* --- SEÇÃO PATAMARES --- */}
        <div className="pt-4 border-t border-gray-100 bg-orange-50 -mx-6 px-6 pb-4">
            <div className="flex items-center justify-between mb-4 mt-4">
                <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                    <span className="bg-highlight text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">P</span>
                    Patamares ({landings.length})
                </h3>
                <button type="button" onClick={handleAddLanding} className="text-xs bg-gray-800 text-white px-3 py-1 rounded font-bold hover:bg-black transition">
                    + Adicionar
                </button>
            </div>
            
            {landings.length === 0 ? (
                <p className="text-xs text-gray-500 italic mb-2">Nenhum patamar adicionado. A escada será apenas de degraus.</p>
            ) : (
                <div className="space-y-3">
                    <p className="text-[10px] text-orange-800 font-bold mb-2">* Cada patamar substitui 1 degrau na contagem final.</p>
                    {landings.map((landing, index) => (
                        <div key={landing.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm relative">
                            <button 
                                onClick={() => handleRemoveLanding(landing.id)}
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-700"
                            >
                                x
                            </button>
                            <span className="text-xs font-bold text-gray-400 absolute top-1 left-2">#{index + 1}</span>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <InputField 
                                    label="Qual Degrau?" 
                                    value={landing.step.toString()} 
                                    onChange={e => updateLanding(landing.id, 'step', e.target.value)} 
                                    unit="º" 
                                    className="mb-0"
                                />
                                <InputField 
                                    label="Preço (R$)" 
                                    value={landing.price.toString()} 
                                    onChange={e => updateLanding(landing.id, 'price', e.target.value)} 
                                    unit="R$" 
                                    className="mb-0"
                                />
                                <InputField 
                                    label="Comp. (cm)" 
                                    value={landing.length.toString()} 
                                    onChange={e => updateLanding(landing.id, 'length', e.target.value)} 
                                    unit="cm" 
                                    className="mb-0"
                                />
                                <InputField 
                                    label="Larg. (cm)" 
                                    value={landing.width.toString()} 
                                    onChange={e => updateLanding(landing.id, 'width', e.target.value)} 
                                    unit="cm" 
                                    className="mb-0"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- SEÇÃO EXTRAS --- */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-black text-gray-900 mb-2">Itens Extras (Guarda-corpo, etc)</label>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Nome do item" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-2 border-2 border-gray-200 rounded font-medium focus:border-highlight outline-none"/>
            <input type="number" placeholder="R$" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 p-2 border-2 border-gray-200 rounded font-medium focus:border-highlight outline-none"/>
            <button type="button" onClick={handleAddItem} className="bg-green-600 text-white px-3 rounded font-bold hover:bg-green-700">+</button>
          </div>
          {optionalItems.length > 0 ? (
             <div className="space-y-1">
                 {optionalItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded border border-gray-200">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">R$ {item.price}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 font-bold px-1">x</button>
                        </div>
                    </div>
                 ))}
             </div>
          ) : (
              <p className="text-xs text-gray-400 italic">Nenhum item extra adicionado.</p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded border border-red-100">{error}</p>}

        <button type="submit" className="w-full bg-highlight text-white font-black py-4 px-4 rounded-md hover:bg-yellow-600 transition-all shadow-md flex items-center justify-center text-xl mt-6 uppercase tracking-wide">
          <CalculatorIcon />
          Calcular Opções
        </button>
      </form>
    </div>
  );
};

export default CalculatorForm;