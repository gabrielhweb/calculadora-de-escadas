import React, { useState } from 'react';
import { WeightCalculator } from '../components/WeightCalculator';
import { GuardrailEditor } from '../components/GuardrailEditor';

export default function WeightCalculatorPage() {
  const [treadDepthCm, setTreadDepthCm] = useState(25);
  const [stepHeightCm, setStepHeightCm] = useState(20);
  const [widthCm, setWidthCm] = useState(70);
  const [totalSteps, setTotalSteps] = useState(15);
  const [landings, setLandings] = useState<any[]>([]);
  const [guardrails, setGuardrails] = useState<any[]>([]);

  const handleAddLanding = () => {
    setLandings([...landings, { id: Date.now().toString(), length: 100, width: 100, type: 'fixed', frenchBrackets: 0 }]);
  };

  const updateLanding = (id: string, updates: any) => {
    setLandings(landings.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleRemoveLanding = (id: string) => {
    setLandings(landings.filter(l => l.id !== id));
  };

  const handleAddGuardrail = () => {
    setGuardrails([...guardrails, { id: Date.now().toString(), guardrailFormat: "normal", guardrailLength: 100, guardrailHeight: 90, guardrailPricePerMeter: 50 }]);
  };

  const updateGuardrail = (id: string, updates: any) => {
    setGuardrails(guardrails.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleRemoveGuardrail = (id: string) => {
    setGuardrails(guardrails.filter(g => g.id !== id));
  };

  // Dummy InputField for GuardrailEditor
  const InputField = ({ label, value, onChange, type = "text", placeholder, icon, addon }: any) => (
      <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
          <div className="relative">
              {icon && <span className="absolute left-2.5 top-2.5 text-gray-400">{icon}</span>}
              <input
                  type={type}
                  value={value === 0 ? '' : value}
                  onChange={onChange}
                  placeholder={placeholder}
                  className={`w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-highlight focus:border-highlight outline-none ${icon ? 'pl-8' : ''} ${addon ? 'pr-8' : ''}`}
              />
              {addon && <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">{addon}</span>}
          </div>
      </div>
  );

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚖️</span>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-800">Cálculo Rápido de Peso</h2>
              <p className="text-slate-500 text-sm">Insira as medidas para calcular o peso da chapa e custo de material</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nº Degraus</label>
              <input 
                type="number" 
                value={totalSteps} 
                onChange={(e) => setTotalSteps(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Pisada (cm)</label>
              <input 
                type="number" 
                value={treadDepthCm} 
                onChange={(e) => setTreadDepthCm(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Altura / Espelho (cm)</label>
              <input 
                type="number" 
                value={stepHeightCm} 
                onChange={(e) => setStepHeightCm(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Largura Escada (cm)</label>
              <input 
                type="number" 
                value={widthCm} 
                onChange={(e) => setWidthCm(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* SESSÃO DE PATAMARES */}
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800 uppercase flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">P</span>
                  Patamares ({landings.length})
              </h3>
              <button type="button" onClick={handleAddLanding} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded font-bold hover:bg-black transition">
                  + Adicionar Patamar
              </button>
          </div>

          {landings.length === 0 ? (
              <p className="text-sm text-slate-500 italic mb-2">Nenhum patamar adicionado.</p>
          ) : (
              <div className="space-y-3">
                  <p className="text-xs text-indigo-600 font-bold mb-2">* O cálculo de peso do patamar usa a fórmula: (Comprimento + 10) × (Largura + 10).</p>
                  {landings.map((landing, index) => (
                      <div key={landing.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm relative">
                          <button 
                              onClick={() => handleRemoveLanding(landing.id)}
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow hover:bg-red-700"
                          >
                              x
                          </button>
                          <span className="text-xs font-bold text-slate-400 absolute top-2 left-3">#{index + 1}</span>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                  <label className="text-xs font-black text-slate-700 mb-1 block">Comprimento (cm):</label>
                                  <input
                                      type="number"
                                      value={landing.length || ''}
                                      onChange={e => updateLanding(landing.id, { length: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                                      className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-black text-slate-700 mb-1 block">Largura (cm):</label>
                                  <input
                                      type="number"
                                      value={landing.width || ''}
                                      onChange={e => updateLanding(landing.id, { width: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                                      className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-black text-slate-700 mb-1 block">Tipo:</label>
                                  <select 
                                      value={landing.type || 'fixed'} 
                                      onChange={e => updateLanding(landing.id, { type: e.target.value })}
                                      className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500"
                                  >
                                      <option value="fixed">Fixo</option>
                                      <option value="articulated">Articulado</option>
                                      <option value="free">Livre</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-black text-slate-700 mb-1 block">Mão Francesa:</label>
                                  <select
                                      value={landing.frenchBrackets || 0}
                                      onChange={e => updateLanding(landing.id, { frenchBrackets: parseInt(e.target.value) })}
                                      className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500"
                                  >
                                      <option value={0}>0</option>
                                      <option value={1}>1</option>
                                      <option value={2}>2</option>
                                      <option value={3}>3</option>
                                      <option value={4}>4</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Re-use the Weight Calculator component but hide its fixed modal wrapper */}
        <div className="relative bg-transparent h-auto">
          <WeightCalculator 
            totalSteps={totalSteps}
            stepHeightCm={stepHeightCm}
            treadDepthCm={treadDepthCm}
            widthCm={widthCm}
            totalLengthCm={treadDepthCm * totalSteps}
            totalHeightCm={stepHeightCm * totalSteps}
            cutStepType="none"
            landings={landings}
            onClose={() => {}}
            isEmbedded={true}
          />
        </div>
      </div>
    </div>
  );
}
