import React, { useState } from 'react';
import { WeightCalculator } from '../components/WeightCalculator';

export default function WeightCalculatorPage() {
  const [treadDepthCm, setTreadDepthCm] = useState(25);
  const [stepHeightCm, setStepHeightCm] = useState(20);
  const [widthCm, setWidthCm] = useState(70);
  const [totalSteps, setTotalSteps] = useState(15);
  const [landingsArea, setLandingsArea] = useState(0);

  // We convert manual area to a fake landing to pass to WeightCalculator
  const fakeLandings = landingsArea > 0 ? [{
    length: Math.sqrt(landingsArea * 10000),
    width: Math.sqrt(landingsArea * 10000)
  }] : [];

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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nº Degraus</label>
              <input 
                type="number" 
                value={totalSteps} 
                onChange={(e) => setTotalSteps(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Pisada (cm)</label>
              <input 
                type="number" 
                value={treadDepthCm} 
                onChange={(e) => setTreadDepthCm(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Altura / Espelho (cm)</label>
              <input 
                type="number" 
                value={stepHeightCm} 
                onChange={(e) => setStepHeightCm(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Largura Escada (cm)</label>
              <input 
                type="number" 
                value={widthCm} 
                onChange={(e) => setWidthCm(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Área Patamar (m²)</label>
              <input 
                type="number" 
                value={landingsArea} 
                onChange={(e) => setLandingsArea(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg p-3 text-lg text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
              />
            </div>
          </div>
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
            landings={fakeLandings}
            onClose={() => {}}
            isEmbedded={true}
          />
        </div>
      </div>
    </div>
  );
}
