
import React, { useState, useEffect } from 'react';
import { CalculatorInput, OptionalItem, LandingInfo } from '../types';

interface CalculatorFormProps {
  onCalculate: (data: CalculatorInput) => void;
}

const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
  </svg>
);

const InputField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  unit?: string; 
  type?: string; 
  placeholder?: string;
  helperText?: string;
}> = ({ label, value, onChange, unit, type = "number", placeholder, helperText }) => (
  <div>
    <label className="block text-sm font-black text-gray-900 mb-1">{label}</label>
    <div className="flex items-center shadow-sm">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-white text-black p-3 rounded-l-md border-2 border-gray-300 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition font-bold text-lg"
        placeholder={placeholder || label}
        min="0"
        step="any"
      />
      {unit && <span className="bg-gray-100 text-gray-800 p-3 rounded-r-md border-2 border-l-0 border-gray-300 font-bold">{unit}</span>}
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1 italic">{helperText}</p>}
  </div>
);

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  const [totalHeight, setTotalHeight] = useState<string>('300');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm'>('cm');
  const [desiredSteps, setDesiredSteps] = useState<string>('12');
  const [stairWidth, setStairWidth] = useState<string>('70');
  const [treadDepth, setTreadDepth] = useState<string>('20');
  const [dampers, setDampers] = useState<string>('4');
  const [customStepPrice, setCustomStepPrice] = useState<string>('');
  const [customTotalLength, setCustomTotalLength] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Patamar
  const [hasLanding, setHasLanding] = useState(false);
  const [landingStep, setLandingStep] = useState(''); // Se vazio, será o último
  const [landingLength, setLandingLength] = useState('80');
  const [landingWidth, setLandingWidth] = useState('70');
  const [landingPrice, setLandingPrice] = useState('1030');

  // Itens Opcionais
  const [optionalItems, setOptionalItems] = useState<OptionalItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleAddItem = () => {
    if (newItemName && newItemPrice) {
      setOptionalItems([...optionalItems, { id: Date.now().toString(), name: newItemName, price: parseFloat(newItemPrice) || 0 }]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const handleRemoveItem = (id: string) => setOptionalItems(optionalItems.filter(item => item.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const heightInCm = heightUnit === 'm' ? parseFloat(totalHeight) * 100 : parseFloat(totalHeight);
    
    const landing: LandingInfo = {
      active: hasLanding,
      step: landingStep ? parseInt(landingStep) : parseInt(desiredSteps),
      length: parseFloat(landingLength) || 0,
      width: parseFloat(landingWidth) || 0,
      price: parseFloat(landingPrice) || 0
    };

    const formData: CalculatorInput = {
      totalHeight: heightInCm,
      desiredSteps: parseInt(desiredSteps, 10) || 0,
      stairWidth: parseInt(stairWidth, 10) || 0,
      treadDepth: parseInt(treadDepth, 10) || 0,
      dampers: parseInt(dampers, 10) || 4,
      customStepPrice: customStepPrice ? parseFloat(customStepPrice) : undefined,
      customTotalLength: customTotalLength ? parseFloat(customTotalLength) : undefined,
      optionalItems: optionalItems,
      landing: hasLanding ? landing : undefined
    };

    if (formData.totalHeight <= 0 || formData.desiredSteps <= 0) {
      setError('A altura e o número de degraus são obrigatórios.');
      return;
    }
    setError('');
    onCalculate(formData);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 sticky top-24">
      <h2 className="text-2xl font-black mb-6 text-gray-900 flex items-center border-b-2 border-highlight pb-4">
        <CalculatorIcon /> Medidas
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-gray-900 mb-1">Altura Total a Vencer</label>
          <div className="flex shadow-sm">
            <input type="number" value={totalHeight} onChange={(e) => setTotalHeight(e.target.value)} className="w-full bg-white text-black p-3 rounded-l-md border-2 border-gray-300 focus:outline-none focus:border-highlight font-bold text-lg" placeholder="Ex: 300" min="0" step="any" />
            <select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'm')} className="bg-gray-100 text-gray-800 p-3 rounded-r-md border-2 border-l-0 border-gray-300 font-bold focus:outline-none focus:border-highlight">
              <option value="cm">cm</option>
              <option value="m">m</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Número de Degraus" value={desiredSteps} onChange={e => setDesiredSteps(e.target.value)} unit="un" />
            <InputField label="Largura da Escada" value={stairWidth} onChange={e => setStairWidth(e.target.value)} unit="cm" />
            <InputField label="Profundidade Pisante" value={treadDepth} onChange={e => setTreadDepth(e.target.value)} unit="cm" />
            <InputField label="Amortecedores" value={dampers} onChange={e => setDampers(e.target.value)} unit="un" />
        </div>

        {/* SEÇÃO PATAMAR */}
        <div className="pt-4 border-t-2 border-highlight/20 bg-orange-50/30 p-4 rounded-lg">
            <label className="flex items-center cursor-pointer mb-4">
                <input type="checkbox" checked={hasLanding} onChange={e => setHasLanding(e.target.checked)} className="w-5 h-5 text-highlight rounded border-gray-300 focus:ring-highlight mr-2" />
                <span className="text-lg font-black text-gray-900">Incluir Patamar?</span>
            </label>
            
            {hasLanding && (
                <div className="space-y-4">
                    <InputField label="No degrau (nº)" value={landingStep} onChange={e => setLandingStep(e.target.value)} placeholder="Último" helperText="Vazio = Último degrau" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Comprimento (cm)" value={landingLength} onChange={e => setLandingLength(e.target.value)} unit="cm" />
                        <InputField label="Largura (cm)" value={landingWidth} onChange={e => setLandingWidth(e.target.value)} unit="cm" />
                    </div>
                    <InputField label="Valor do Patamar (R$)" value={landingPrice} onChange={e => setLandingPrice(e.target.value)} unit="R$" />
                </div>
            )}
        </div>
        
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Valor/Degrau (Opc)" value={customStepPrice} onChange={e => setCustomStepPrice(e.target.value)} unit="R$" placeholder="Automático" />
            <InputField label="Comp. Total (Opc)" value={customTotalLength} onChange={e => setCustomTotalLength(e.target.value)} unit="cm" placeholder="Automático" />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-black text-gray-900 mb-2">Itens Adicionais (Extras)</label>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Nome" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 bg-white text-black p-2 rounded border border-gray-300 text-sm font-bold" />
            <input type="number" placeholder="Valor" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 bg-white text-black p-2 rounded border border-gray-300 text-sm font-bold" />
            <button type="button" onClick={handleAddItem} className="bg-green-600 text-white px-3 rounded font-bold hover:bg-green-700">+</button>
          </div>
          {optionalItems.length > 0 && (
            <ul className="space-y-2 mb-4 bg-gray-50 p-2 rounded">
              {optionalItems.map(item => (
                <li key={item.id} className="flex justify-between items-center text-sm font-bold text-gray-800 bg-white p-2 rounded border border-gray-200">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-700">R$ {item.price.toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 font-black">×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded border border-red-200">{error}</p>}

        <button type="submit" className="w-full bg-highlight text-white font-black py-4 rounded-md hover:bg-yellow-600 shadow-md flex items-center justify-center text-xl mt-6 uppercase">
          <CalculatorIcon /> Calcular Opções
        </button>
      </form>
    </div>
  );
};

export default CalculatorForm;
