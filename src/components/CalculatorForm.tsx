
import React, { useState, useEffect } from 'react';
import { CalculatorInput, OptionalItem, LandingInfo, ReferenceDoor } from '../types';

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
        <label className={`text-sm font-black mr-1 ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {label}
        </label>
        {isOptional ? <span className="text-gray-400 dark:text-gray-500 font-normal text-xs mr-1">(Opcional)</span> : <span className="text-red-500 font-bold mr-1">*</span>}
        
        {tooltip && <TooltipIcon text={tooltip} />}
    </div>
    <div className="flex items-center shadow-sm">
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-3 rounded-l-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition font-bold text-lg ${disabled ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-black dark:text-white'}`}
        placeholder={placeholder || (isOptional ? "Automático" : label)}
        min="0"
        step="any"
      />
      {onUnitChange ? (
          <select 
            value={currentUnit} 
            onChange={(e) => onUnitChange(e.target.value as 'cm'|'m')}
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-r-md border-2 border-l-0 border-gray-300 dark:border-gray-600 font-bold focus:outline-none focus:border-highlight cursor-pointer"
            disabled={disabled}
          >
              <option value="cm">cm</option>
              <option value="m">m</option>
          </select>
      ) : (
        unit && <span className={`bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-r-md border-2 border-l-0 border-gray-300 dark:border-gray-600 font-bold min-w-[3rem] text-center flex items-center justify-center ${disabled ? 'text-gray-400' : ''}`}>{unit}</span>
      )}
    </div>
    {helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{helperText}</p>}
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
  const [hasWheels, setHasWheels] = useState(false);
  const [handrailSide, setHandrailSide] = useState<'left' | 'right' | 'both'>('both'); 
  
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

  // Estados de Visualização Avançada
  const [stairDirection, setStairDirection] = useState<'standard' | 'mirrored'>('standard');
  const [stairGeometry, setStairGeometry] = useState<string>(''); // Novo campo de geometria
  const [doorActive, setDoorActive] = useState(false);
  const [doorWidth, setDoorWidth] = useState('80');
  const [doorHeight, setDoorHeight] = useState('210');
  const [doorDistance, setDoorDistance] = useState('100'); // Distância do início da escada
  const [doorPosition, setDoorPosition] = useState<'ground' | 'upper'>('upper'); // Padrão: Laje

  // Efeito para garantir que amortecedores sejam 0 se tiver rodinhas
  useEffect(() => {
      if (hasWheels) {
          setDampers('0');
      }
  }, [hasWheels]);

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

  // ADICIONAR PATAMAR GENÉRICO
  const handleAddLanding = () => {
    const lastStep = parseInt(desiredSteps) || 1;
    const newLanding: LandingInfo = {
        id: Date.now().toString(),
        step: Math.floor(lastStep / 2), // Default no meio
        length: 80,
        width: 70,
        price: 1030,
        type: 'articulated',
        isLastStep: false,
        isFlushWithSlab: false,
        direction: 'straight',
        hasSideGuardrail: false,
        hasFrontGuardrail: false
    };
    setLandings([...landings, newLanding]);
  };

  // ADICIONAR PATAMAR DE TOPO (ESPECÍFICO DO PEDIDO)
  const handleAddTopLanding = () => {
    const lastStep = parseInt(desiredSteps) || 1;
    const newLanding: LandingInfo = {
        id: Date.now().toString(),
        step: lastStep,
        length: 75, // Conforme vídeo (70~75)
        width: 70,
        price: 1030,
        type: 'fixed', // Topo geralmente é fixo
        isLastStep: true,
        isFlushWithSlab: true, // Padrão rente
        direction: 'straight',
        hasSideGuardrail: true,
        hasFrontGuardrail: false
    };
    setLandings([...landings, newLanding]);
  };

  const handleRemoveLanding = (id: string) => {
      setLandings(landings.filter(l => l.id !== id));
  };

  const updateLanding = (id: string, updates: Partial<LandingInfo>) => {
      setLandings(prev => prev.map(l => {
          if (l.id === id) {
              return { ...l, ...updates };
          }
          return l;
      }));
  };

  const convertToCm = (val: string, unit: 'cm' | 'm') => {
      const num = parseFloat(val);
      if (!num) return 0;
      return unit === 'm' ? num * 100 : num;
  };

  const handleToggleWheels = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setHasWheels(isChecked);
      // O useEffect cuidará de zerar os amortecedores
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const heightInCm = convertToCm(totalHeight, heightUnit);
    const widthInCm = convertToCm(stairWidth, widthUnit);
    const depthInCm = convertToCm(treadDepth, depthUnit);
    const lengthInCm = convertToCm(customTotalLength, lengthUnit);
    const openingInCm = convertToCm(slabOpening, openingUnit);
    const slabThickInCm = parseFloat(slabThickness) || 0;

    // Se tiver rodinhas, força amortecedores a 0 na submissão também
    let finalDampers = 0;
    if (!hasWheels) {
        const dampersInt = parseInt(dampers, 10);
        finalDampers = isNaN(dampersInt) ? 0 : dampersInt;
    }

    const referenceDoorData: ReferenceDoor = {
        isActive: doorActive,
        width: parseFloat(doorWidth) || 0,
        height: parseFloat(doorHeight) || 0,
        distance: parseFloat(doorDistance) || 0,
        position: doorPosition
    };

    const formData: CalculatorInput = {
      totalHeight: heightInCm || 0,
      desiredSteps: parseInt(desiredSteps, 10) || 0,
      stairWidth: widthInCm,
      treadDepth: depthInCm,
      dampers: finalDampers,
      hasWheels: hasWheels,
      handrailSide: hasWheels ? handrailSide : undefined, 
      customStepPrice: customStepPrice ? parseFloat(customStepPrice) : undefined,
      customTotalLength: lengthInCm || undefined,
      optionalItems: optionalItems,
      landings: landings,
      slabThickness: slabThickInCm,
      slabOpening: openingInCm || undefined,
      stairDirection: stairDirection,
      stairGeometry: stairGeometry, // Novo campo
      referenceDoor: referenceDoorData
    };

    if (formData.totalHeight <= 0 || formData.desiredSteps <= 0) {
      setError('Altura e Número de Degraus são obrigatórios.');
      return;
    }

    setError('');
    onCalculate(formData);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24">
      <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white flex items-center border-b-2 border-highlight pb-4">
        <CalculatorIcon /> 
        Medidas
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ALTURA E DEGRAUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <div className="flex items-center mb-1">
                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mr-1">Altura Piso-Piso</label>
                    <span className="text-red-500 font-bold mr-1">*</span>
                    <TooltipIcon text="Distância vertical exata do chão de baixo até o chão de cima (já considerando o piso acabado)." />
                </div>
                <div className="flex shadow-sm">
                    <input
                    type="number"
                    value={totalHeight}
                    onChange={(e) => setTotalHeight(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-l-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight transition font-bold text-lg"
                    placeholder="300"
                    min="0"
                    step="any"
                    />
                    <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'm')}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-r-md border-2 border-l-0 border-gray-300 dark:border-gray-600 font-bold cursor-pointer outline-none"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-100 dark:border-gray-700">
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
        
        {/* VISUALIZAÇÃO AVANÇADA */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 -mx-6 px-6 pb-4 mb-4">
             <h3 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase flex items-center gap-2 mb-3 mt-4">
                <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">👁</span>
                Configuração & Ambiente
             </h3>

             <div className="grid grid-cols-1 gap-4">
                 {/* Controle de Direção da Escada */}
                 <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sentido da Subida</label>
                     <div className="flex gap-1 mb-3">
                         <button 
                             type="button"
                             onClick={() => setStairDirection('standard')}
                             className={`flex-1 py-2 text-xs font-bold rounded border ${stairDirection === 'standard' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200'}`}
                         >
                             Subir p/ Direita ↗️
                         </button>
                         <button 
                             type="button"
                             onClick={() => setStairDirection('mirrored')}
                             className={`flex-1 py-2 text-xs font-bold rounded border ${stairDirection === 'mirrored' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200'}`}
                         >
                             Subir p/ Esquerda ↖️
                         </button>
                     </div>

                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Formato / Fixação</label>
                     <select 
                        value={stairGeometry}
                        onChange={(e) => setStairGeometry(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-900 dark:text-white"
                     >
                         <option value="">Não Especificar (Padrão)</option>
                         <option value="Reta (Parede à Esquerda)">Reta (Fixação Parede Esquerda)</option>
                         <option value="Reta (Parede à Direita)">Reta (Fixação Parede Direita)</option>
                         <option value="Formato L (Vira Esquerda)">Formato L (Vira Esquerda)</option>
                         <option value="Formato L (Vira Direita)">Formato L (Vira Direita)</option>
                         <option value="Formato U">Formato U</option>
                     </select>
                 </div>

                 {/* Controle de Porta/Janela (Reformulado) */}
                 <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                     <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setDoorActive(!doorActive)}>
                        <input type="checkbox" checked={doorActive} onChange={e => setDoorActive(e.target.checked)} className="accent-blue-600 w-5 h-5 cursor-pointer"/>
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-800 dark:text-white cursor-pointer">Adicionar Porta ou Janela</label>
                            <span className="text-[10px] text-gray-500">Ajuda a ver se a escada vai passar na frente de algo.</span>
                        </div>
                     </div>
                     
                     {doorActive && (
                        <div className="grid grid-cols-2 gap-3 mt-2 animate-fade-in bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <div className="col-span-2 flex bg-gray-200 dark:bg-gray-600 rounded p-1 mb-1">
                                <button 
                                    type="button"
                                    onClick={() => setDoorPosition('ground')}
                                    className={`flex-1 py-1 text-xs font-bold rounded transition ${doorPosition === 'ground' ? 'bg-white dark:bg-gray-800 shadow text-blue-700' : 'text-gray-500'}`}
                                >
                                    No Térreo (Baixo)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setDoorPosition('upper')}
                                    className={`flex-1 py-1 text-xs font-bold rounded transition ${doorPosition === 'upper' ? 'bg-white dark:bg-gray-800 shadow text-blue-700' : 'text-gray-500'}`}
                                >
                                    Na Laje (Cima)
                                </button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase mb-1">Largura</label>
                                <div className="flex items-center">
                                    <input type="number" value={doorWidth} onChange={e => setDoorWidth(e.target.value)} className="w-full text-sm p-2 border rounded font-bold text-blue-700" placeholder="80" />
                                    <span className="ml-1 text-xs font-bold text-gray-400">cm</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase mb-1">Altura</label>
                                <div className="flex items-center">
                                    <input type="number" value={doorHeight} onChange={e => setDoorHeight(e.target.value)} className="w-full text-sm p-2 border rounded font-bold text-blue-700" placeholder="210" />
                                    <span className="ml-1 text-xs font-bold text-gray-400">cm</span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase mb-1 flex justify-between">
                                    <span>Distância do 1º Degrau</span>
                                    {doorPosition === 'ground' && <span className="text-blue-500 cursor-help" title="Distância do começo da escada (pé) até o começo da porta">?</span>}
                                </label>
                                {doorPosition === 'ground' ? (
                                    <>
                                        <div className="flex items-center">
                                            <input type="number" value={doorDistance} onChange={e => setDoorDistance(e.target.value)} className="w-full text-sm p-2 border rounded font-bold text-blue-700" placeholder="100" />
                                            <span className="ml-1 text-xs font-bold text-gray-400">cm</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 italic">Ex: Se a porta está a 1 metro do início da escada, coloque 100.</p>
                                    </>
                                ) : (
                                    <div className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 text-xs text-gray-500 dark:text-gray-300 italic flex items-center gap-2">
                                        <span className="text-lg">🔒</span> 
                                        <span className="font-bold">Fixa no final da escada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                     )}
                 </div>
             </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
             {/* Opção Com Rodinhas */}
             <div className="flex flex-col gap-2">
                 <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition h-14">
                     <input 
                        type="checkbox" 
                        checked={hasWheels} 
                        onChange={handleToggleWheels}
                        className="w-5 h-5 accent-highlight"
                     />
                     <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">Com Rodinhas?</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Zera amortecedores</span>
                     </div>
                 </label>

                 {/* Sub-opção: Lado do Corrimão (Só aparece se hasWheels) */}
                 {hasWheels && (
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                         <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">Posição Corrimão:</label>
                         <select 
                            value={handrailSide} 
                            onChange={(e) => setHandrailSide(e.target.value as 'left'|'right'|'both')}
                            className="w-full text-xs font-bold p-1 rounded bg-white dark:bg-gray-700 text-black dark:text-white border border-blue-200 dark:border-blue-700"
                         >
                             <option value="left">Só Esquerdo</option>
                             <option value="right">Só Direito</option>
                             <option value="both">Nos Dois Lados</option>
                         </select>
                     </div>
                 )}
             </div>

             <InputField 
                label="Amortecedores" 
                value={dampers} 
                onChange={e => setDampers(e.target.value)} 
                unit="un"
                helperText={hasWheels ? "Desativado (Rodinhas)" : "Aceita 0"}
                tooltip="Borrachas instaladas entre a estrutura da escada e a parede. Se 'Com Rodinhas' estiver ativo, deve ser 0."
                disabled={hasWheels}
            />
            <InputField 
                label="Preço/Degrau" 
                value={customStepPrice} 
                onChange={e => setCustomStepPrice(e.target.value)} 
                unit="R$" 
                isOptional={true}
                helperText="Manual (Substitui tabela)"
                tooltip="Define um preço fixo por degrau, ignorando a tabela de preços automática baseada na largura."
                className="col-span-1 md:col-span-2"
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
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20 -mx-6 px-6 pb-4">
            <div className="flex items-center justify-between mb-4 mt-4">
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
                    <span className="bg-highlight text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">P</span>
                    Patamares ({landings.length})
                    <TooltipIcon text="Plataformas de descanso ou curva. Cada patamar substitui 1 degrau na contagem total de peças." />
                </h3>
                <div className="flex gap-2">
                    <button type="button" onClick={handleAddTopLanding} className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-bold hover:bg-orange-700 transition" title="Patamar no Topo (Acesso Lateral)">
                        + Chegada
                    </button>
                    <button type="button" onClick={handleAddLanding} className="text-xs bg-gray-800 dark:bg-gray-700 text-white px-3 py-1 rounded font-bold hover:bg-black dark:hover:bg-gray-600 transition">
                        + Meio
                    </button>
                </div>
            </div>
            
            {landings.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">Nenhum patamar adicionado.</p>
            ) : (
                <div className="space-y-3">
                    <p className="text-[10px] text-orange-800 dark:text-orange-300 font-bold mb-2">* Cada patamar substitui 1 degrau.</p>
                    {landings.map((landing, index) => (
                        <div key={landing.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm relative">
                            <button 
                                onClick={() => handleRemoveLanding(landing.id)}
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-700"
                            >
                                x
                            </button>
                            <span className="text-xs font-bold text-gray-400 absolute top-1 left-2">#{index + 1}</span>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {/* Campos do patamar mantidos como estavam */}
                                <div className="mb-0 col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                         <label className="text-sm font-black text-gray-900 dark:text-gray-100 mr-1">Posição</label>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                                        <label className="flex items-center gap-1 cursor-pointer select-none">
                                             <input 
                                                type="checkbox" 
                                                checked={!!landing.isLastStep} 
                                                onChange={(e) => {
                                                    updateLanding(landing.id, {
                                                        isLastStep: e.target.checked,
                                                        isFlushWithSlab: e.target.checked ? landing.isFlushWithSlab : false
                                                    });
                                                }} 
                                                className="w-4 h-4 accent-highlight"
                                             />
                                             <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Topo (Chegada)?</span>
                                        </label>
                                        
                                        {landing.isLastStep && (
                                            <label className="flex items-center gap-1 cursor-pointer select-none" title="Para porta nivelada com o piso superior">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!landing.isFlushWithSlab} 
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        updateLanding(landing.id, {
                                                            isFlushWithSlab: isChecked,
                                                            isLastStep: isChecked ? true : landing.isLastStep 
                                                        });
                                                    }} 
                                                    className="w-4 h-4 accent-highlight"
                                                />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Rente à Laje?</span>
                                            </label>
                                        )}
                                    </div>

                                    <input
                                        type="number"
                                        value={landing.isLastStep ? "" : landing.step.toString()}
                                        disabled={landing.isLastStep}
                                        onChange={e => updateLanding(landing.id, { step: parseFloat(e.target.value) })}
                                        className={`w-full p-2 rounded border-2 focus:outline-none transition font-bold ${landing.isLastStep ? 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-400 dark:text-gray-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-highlight text-black dark:text-white'}`}
                                        placeholder={landing.isLastStep ? "Automático (Último Degrau)" : "Nº do Degrau (Ex: 5)"}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Tipo de Fixação:</label>
                                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                        <button 
                                            type="button" 
                                            onClick={() => updateLanding(landing.id, { type: 'articulated' })}
                                            className={`flex-1 py-1 text-xs font-bold rounded ${(!landing.type || landing.type === 'articulated') ? 'bg-white dark:bg-gray-600 shadow text-highlight' : 'text-gray-500'}`}
                                        >
                                            Articulado
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => updateLanding(landing.id, { type: 'fixed' })}
                                            className={`flex-1 py-1 text-xs font-bold rounded ${landing.type === 'fixed' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}
                                        >
                                            Fixo
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Barras de Proteção:</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={landing.hasSideGuardrail} 
                                                onChange={(e) => updateLanding(landing.id, { hasSideGuardrail: e.target.checked })} 
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Lateral</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={landing.hasFrontGuardrail} 
                                                onChange={(e) => updateLanding(landing.id, { hasFrontGuardrail: e.target.checked })} 
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Frontal</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="col-span-2 mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Direção / Curva:</label>
                                    <div className="flex gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, { direction: 'left' })}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'left' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                        >
                                            ⬅️ Esq
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, { direction: 'straight' })}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${(!landing.direction || landing.direction === 'straight') ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                        >
                                            ⬆️ Reto
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => updateLanding(landing.id, { direction: 'right' })}
                                            className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'right' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                        >
                                            Dir ➡️
                                        </button>
                                    </div>
                                </div>
                                <InputField 
                                    label="Preço (R$)" 
                                    value={landing.price.toString()} 
                                    onChange={e => updateLanding(landing.id, { price: parseFloat(e.target.value) })} 
                                    unit="R$" 
                                    className="mb-0"
                                    tooltip="Custo unitário deste patamar."
                                />
                                <InputField 
                                    label="Comp. (cm)" 
                                    value={landing.length.toString()} 
                                    onChange={e => updateLanding(landing.id, { length: parseFloat(e.target.value) })} 
                                    unit="cm" 
                                    className="mb-0"
                                    tooltip="Comprimento do patamar no sentido da subida."
                                />
                                <InputField 
                                    label="Larg. (cm)" 
                                    value={landing.width.toString()} 
                                    onChange={e => updateLanding(landing.id, { width: parseFloat(e.target.value) })} 
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
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mr-2">Itens Extras</label>
            <TooltipIcon text="Adicione custos adicionais como corrimão extra, pintura especial, guarda-corpo, etc." />
          </div>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Nome do item" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-2 border-2 border-gray-200 dark:border-gray-600 rounded font-medium focus:border-highlight outline-none bg-white dark:bg-gray-800 text-black dark:text-white"/>
            <input type="number" placeholder="R$" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 p-2 border-2 border-gray-200 dark:border-gray-600 rounded font-medium focus:border-highlight outline-none bg-white dark:bg-gray-800 text-black dark:text-white"/>
            <button type="button" onClick={handleAddItem} className="bg-green-600 text-white px-3 rounded font-bold hover:bg-green-700">+</button>
          </div>
          {optionalItems.length > 0 && (
             <div className="space-y-1">
                 {optionalItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700 dark:text-green-400">R$ {item.price}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold px-1">x</button>
                        </div>
                    </div>
                 ))}
             </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-900">{error}</p>}

        <button type="submit" className="w-full bg-highlight text-white font-black py-4 px-4 rounded-md hover:bg-yellow-600 transition-all shadow-md flex items-center justify-center text-xl mt-6 uppercase tracking-wide">
          <CalculatorIcon />
          Calcular Opções
        </button>
      </form>
    </div>
  );
};

export default CalculatorForm;
