
import React, { useState } from 'react';
import { CalculatorInput, OptionalItem, LandingInfo } from '../types';

interface CalculatorFormProps {
  onCalculate: (data: CalculatorInput) => void;
}

const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
  </svg>
);

const TooltipIcon: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative flex items-center justify-center cursor-help ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 hover:text-purple-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-purple-900 text-white text-xs font-medium p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed border border-purple-700">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-6 border-transparent border-t-purple-900"></div>
        </div>
    </div>
);

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
  tooltip?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, unit, type = "number", placeholder, helperText, isOptional, onUnitChange, currentUnit, className, tooltip, disabled }) => (
  <div className={className}>
    <div className="flex items-center mb-1">
        <label className={`text-sm font-black mr-1 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {label}
        </label>
        {isOptional ? <span className="text-gray-400 font-normal text-xs mr-1">(Opcional)</span> : <span className="text-red-500 font-bold mr-1">*</span>}
        
        {tooltip && <TooltipIcon text={tooltip} />}
    </div>
    <div className="flex items-center shadow-sm">
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-3 rounded-l-md border-2 border-gray-300 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition font-bold text-lg ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-black'}`}
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
  const [desiredSteps, setDesiredSteps] = useState<string>('12');
  const [stairWidth, setStairWidth] = useState<string>('70');
  const [widthUnit, setWidthUnit] = useState<'cm' | 'm'>('cm');
  const [treadDepth, setTreadDepth] = useState<string>('20');
  const [depthUnit, setDepthUnit] = useState<'cm' | 'm'>('cm');
  const [dampers, setDampers] = useState<string>('4');
  const [slabThickness, setSlabThickness] = useState<string>('15');
  const [slabOpening, setSlabOpening] = useState<string>('');
  const [openingUnit, setOpeningUnit] = useState<'cm' | 'm'>('cm');
  const [customStepPrice, setCustomStepPrice] = useState<string>('440');
  const [customTotalLength, setCustomTotalLength] = useState<string>('');
  const [lengthUnit, setLengthUnit] = useState<'cm' | 'm'>('cm');
  const [landings, setLandings] = useState<LandingInfo[]>([]);
  const [optionalItems, setOptionalItems] = useState<OptionalItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [error, setError] = useState<string>('');

  // Handlers para Itens Extras e Patamares
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

  const handleAddLanding = () => {
    const lastStep = parseInt(desiredSteps) || 1;
    const newLanding: LandingInfo = {
        id: Date.now().toString(),
        step: lastStep,
        length: 80,
        width: 70,
        price: 1030,
        isLastStep: false,
        direction: 'straight'
    };
    setLandings([...landings, newLanding]);
  };

  const handleRemoveLanding = (id: string) => {
      setLandings(landings.filter(l => l.id !== id));
  };

  const updateLanding = (id: string, field: keyof LandingInfo, value: any) => {
      setLandings(landings.map(l => {
          if (l.id === id) {
              if (field === 'isLastStep') return { ...l, isLastStep: value };
              if (field === 'direction') return { ...l, direction: value };
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
    const openingInCm = convertToCm(slabOpening, openingUnit);
    const slabThickInCm = parseFloat(slabThickness) || 0;

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
      slabThickness: slabThickInCm,
      slabOpening: openingInCm || undefined,
      // Logística removida desta etapa
    };

    if (formData.totalHeight <= 0 || formData.desiredSteps <= 0) {
      setError('Altura e Número de Degraus são obrigatórios.');
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
                <div className="flex items-center mb-1">
                    <label className="block text-sm font-black text-gray-900 mr-1">Altura Piso-Piso</label>
                    <span className="text-red-500 font-bold mr-1">*</span>
                    <TooltipIcon text="Distância vertical exata do chão de baixo até o chão de cima (já considerando o piso acabado)." />
                </div>
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
            </div>

            <InputField 
                label="Qtd. Total Peças" 
                value={desiredSteps} 
                onChange={e => setDesiredSteps(e.target.value)} 
                unit="un"
                helperText="Subidas totais (Degraus + Patamares)."
                tooltip="Quantidade total de espelhos (subidas). Inclui a soma de degraus comuns + patamares."
            />
        </div>
        
        {/* AMBIENTE (LAJE/VÃO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-100">
             <InputField 
                label="Tamanho do Vão" 
                value={slabOpening} 
                onChange={e => setSlabOpening(e.target.value)} 
                isOptional={true}
                onUnitChange={setOpeningUnit}
                currentUnit={openingUnit}
                helperText="Abertura na laje superior"
                className="mb-0"
                tooltip="Comprimento livre do buraco na laje superior. Se a escada for maior que este valor, o usuário baterá a cabeça ao subir."
            />
             <InputField 
                label="Espessura Laje" 
                value={slabThickness} 
                onChange={e => setSlabThickness(e.target.value)} 
                unit="cm"
                isOptional={true}
                helperText="Para calcular 'cabeçada'"
                className="mb-0"
                tooltip="Altura total da laje (concreto + acabamento). Essencial para calcular a altura livre (cabeçada) e garantir segurança."
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
                tooltip="Largura útil da escada. Padrão comercial é 70cm, mas pode variar conforme necessidade."
            />
            
            <InputField 
                label="Pisante (Passo)" 
                value={treadDepth} 
                onChange={e => setTreadDepth(e.target.value)} 
                isOptional={true}
                onUnitChange={setDepthUnit}
                currentUnit={depthUnit}
                helperText="Padrão: 24cm"
                tooltip="Profundidade do degrau onde se coloca o pé. Padrão confortável é entre 25cm e 30cm."
            />
        </div>
        
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
             <InputField 
                label="Amortecedores" 
                value={dampers} 
                onChange={e => setDampers(e.target.value)} 
                unit="un"
                helperText="Padrão: 4"
                tooltip="Borrachas instaladas entre a estrutura da escada e a parede para reduzir vibração e ruído."
            />
            <InputField 
                label="Preço/Degrau" 
                value={customStepPrice} 
                onChange={e => setCustomStepPrice(e.target.value)} 
                unit="R$" 
                isOptional={true}
                helperText="Manual (Substitui tabela)"
                tooltip="Define um preço fixo por degrau, ignorando a tabela de preços automática baseada na largura."
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
            tooltip="Força a escada a ter um comprimento exato, ajustando o pisante automaticamente se necessário."
        />

        {/* --- SEÇÃO PATAMARES --- */}
        <div className="pt-4 border-t border-gray-100 bg-orange-50 -mx-6 px-6 pb-4">
            <div className="flex items-center justify-between mb-4 mt-4">
                <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                    <span className="bg-highlight text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">P</span>
                    Patamares ({landings.length})
                    <TooltipIcon text="Plataformas de descanso ou curva. Cada patamar substitui 1 degrau na contagem total de peças." />
                </h3>
                <button type="button" onClick={handleAddLanding} className="text-xs bg-gray-800 text-white px-3 py-1 rounded font-bold hover:bg-black transition">
                    + Adicionar
                </button>
            </div>
            
            {landings.length === 0 ? (
                <p className="text-xs text-gray-500 italic mb-2">Nenhum patamar adicionado.</p>
            ) : (
                <div className="space-y-3">
                    <p className="text-[10px] text-orange-800 font-bold mb-2">* Cada patamar substitui 1 degrau.</p>
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
                                <div className="mb-0 col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                         <label className="text-sm font-black text-gray-900 mr-1">Qual Degrau?</label>
                                         <label className="flex items-center gap-1 cursor-pointer">
                                             <input 
                                                type="checkbox" 
                                                checked={landing.isLastStep} 
                                                onChange={(e) => updateLanding(landing.id, 'isLastStep', e.target.checked)} 
                                                className="w-4 h-4 accent-highlight"
                                             />
                                             <span className="text-xs font-bold text-highlight uppercase">Último?</span>
                                         </label>
                                    </div>
                                    <input
                                        type="number"
                                        value={landing.isLastStep ? "" : landing.step.toString()}
                                        disabled={landing.isLastStep}
                                        onChange={e => updateLanding(landing.id, 'step', e.target.value)}
                                        className={`w-full p-2 rounded border-2 focus:outline-none transition font-bold ${landing.isLastStep ? 'bg-gray-200 border-gray-300 text-gray-400' : 'bg-white border-gray-300 focus:border-highlight text-black'}`}
                                        placeholder={landing.isLastStep ? "Auto (Topo)" : "Ex: 5"}
                                    />
                                </div>
                                <div className="col-span-2 mb-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    <label className="text-xs font-black text-gray-800 mb-1 block">Direção / Curva:</label>
                                    <div className="flex gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, 'direction', 'left')}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'left' ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            ⬅️ Esq
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, 'direction', 'straight')}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${(!landing.direction || landing.direction === 'straight') ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            ⬆️ Reto
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, 'direction', 'right')}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'right' ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            Dir ➡️
                                        </button>
                                    </div>
                                </div>
                                <InputField 
                                    label="Preço (R$)" 
                                    value={landing.price.toString()} 
                                    onChange={e => updateLanding(landing.id, 'price', e.target.value)} 
                                    unit="R$" 
                                    className="mb-0"
                                    tooltip="Custo unitário deste patamar."
                                />
                                <InputField 
                                    label="Comp. (cm)" 
                                    value={landing.length.toString()} 
                                    onChange={e => updateLanding(landing.id, 'length', e.target.value)} 
                                    unit="cm" 
                                    className="mb-0"
                                    tooltip="Comprimento do patamar no sentido da subida."
                                />
                                <InputField 
                                    label="Larg. (cm)" 
                                    value={landing.width.toString()} 
                                    onChange={e => updateLanding(landing.id, 'width', e.target.value)} 
                                    unit="cm" 
                                    className="mb-0"
                                    tooltip="Largura lateral do patamar."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- SEÇÃO EXTRAS --- */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center mb-2">
            <label className="block text-sm font-black text-gray-900 mr-2">Itens Extras</label>
            <TooltipIcon text="Adicione custos adicionais como corrimão extra, pintura especial, guarda-corpo, etc." />
          </div>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Nome do item" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-2 border-2 border-gray-200 rounded font-medium focus:border-highlight outline-none"/>
            <input type="number" placeholder="R$" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 p-2 border-2 border-gray-200 rounded font-medium focus:border-highlight outline-none"/>
            <button type="button" onClick={handleAddItem} className="bg-green-600 text-white px-3 rounded font-bold hover:bg-green-700">+</button>
          </div>
          {optionalItems.length > 0 && (
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
