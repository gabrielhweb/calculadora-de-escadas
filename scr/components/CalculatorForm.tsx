
import React, { useState } from 'react';
import { CalculatorInput } from '../types';

interface CalculatorFormProps {
  onCalculate: (data: CalculatorInput) => void;
}

const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
  </svg>
);


const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  const [totalHeight, setTotalHeight] = useState<string>('300');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm'>('cm');
  const [desiredSteps, setDesiredSteps] = useState<string>('12');
  const [stairWidth, setStairWidth] = useState<string>('70');
  const [treadDepth, setTreadDepth] = useState<string>('20');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      totalHeight: parseFloat(totalHeight) || 0,
      desiredSteps: parseInt(desiredSteps, 10) || 0,
      stairWidth: parseInt(stairWidth, 10) || 0,
      treadDepth: parseInt(treadDepth, 10) || 0,
    };

    if (Object.values(formData).some(val => val <= 0)) {
      setError('Todos os campos devem ser preenchidos com valores positivos.');
      return;
    }
    setError('');

    const heightInCm = heightUnit === 'm' ? formData.totalHeight * 100 : formData.totalHeight;

    onCalculate({ ...formData, totalHeight: heightInCm });
  };

  const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; unit?: string; type?: string; children?: React.ReactNode }> = ({ label, value, onChange, unit, type = "number", children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="flex items-center">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full bg-accent text-white p-3 rounded-l-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition"
          placeholder={label}
          min="0"
          step="any"
        />
        {unit && <span className="bg-secondary p-3 rounded-r-md border-y-2 border-r-2 border-secondary">{unit}</span>}
        {children}
      </div>
    </div>
  );
  
  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg sticky top-8">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center"><CalculatorIcon /> Inserir Medidas</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Altura Total a Vencer</label>
          <div className="flex">
            <input
              type="number"
              value={totalHeight}
              onChange={(e) => setTotalHeight(e.target.value)}
              className="w-full bg-accent text-white p-3 rounded-l-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition"
              placeholder="Ex: 300"
              min="0"
              step="any"
            />
            <select
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'm')}
              className="bg-secondary text-white p-3 rounded-r-md border-y-2 border-r-2 border-secondary focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <option value="cm">cm</option>
              <option value="m">m</option>
            </select>
          </div>
        </div>

        <InputField label="Número de Degraus Desejado (pisos)" value={desiredSteps} onChange={e => setDesiredSteps(e.target.value)} unit="un"/>
        <InputField label="Largura da Escada" value={stairWidth} onChange={e => setStairWidth(e.target.value)} unit="cm"/>
        <InputField label="Profundidade do Pisante" value={treadDepth} onChange={e => setTreadDepth(e.target.value)} unit="cm"/>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" className="w-full bg-highlight text-primary font-bold py-3 px-4 rounded-md hover:bg-yellow-500 transition-transform transform hover:scale-105 shadow-md flex items-center justify-center">
          <CalculatorIcon />
          Calcular Opções
        </button>
      </form>
    </div>
  );
};

export default CalculatorForm;