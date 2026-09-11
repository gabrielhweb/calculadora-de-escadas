import React, { useState } from 'react';
import { patamarBase64 } from '../utils/patamarBase64';

// Imagens de degraus que já temos no sistema
import { lisaEsquerdaBase64, vazadaEsquerdaBase64 } from '../utils/cleanImages';

interface WeightCalculatorProps {
  totalSteps: number;
  stepHeightCm: number;
  treadDepthCm: number;
  widthCm: number;
  totalLengthCm: number;
  totalHeightCm: number;
  cutStepType: string;
  landings: any[];
  onClose: () => void;
}

export const WeightCalculator: React.FC<WeightCalculatorProps> = ({
  totalSteps, stepHeightCm, treadDepthCm, widthCm, totalLengthCm, totalHeightCm, cutStepType, landings, onClose
}) => {
  // Densidade do Aço Carbono: 7850 kg/m³
  const STEEL_DENSITY = 7850;
  
  // Opções de espessura de chapa (mm)
  const thicknessOptions = [
    { label: 'Chapa 14 (1.90mm)', value: 1.90 },
    { label: 'Chapa 1/8" (3.17mm)', value: 3.17 },
    { label: 'Chapa 3mm (Comercial)', value: 3.0 },
    { label: 'Chapa 3/16" (4.76mm)', value: 4.76 },
    { label: 'Chapa 1/4" (6.35mm)', value: 6.35 }
  ];

  const [selectedThickness, setSelectedThickness] = useState<number>(3.0);
  
  const thicknessM = selectedThickness / 1000;

  // 1. CÁLCULO DOS DEGRAUS
  // Área de 1 degrau: (pisada + 6cm) x largura
  // O +6cm é referente às dobras/abas da chapa de aço no degrau
  const stepAreaM2 = ((treadDepthCm + 6) / 100) * (widthCm / 100);
  const stepsVolumeM3 = stepAreaM2 * thicknessM * totalSteps;
  const stepsWeightKg = stepsVolumeM3 * STEEL_DENSITY;

  // 2. CÁLCULO DOS PATAMARES
  let landingsAreaM2 = 0;
  landings.forEach(l => {
    const lLen = l.length || 0;
    const lWid = l.width || 0;
    landingsAreaM2 += (lLen * lWid) / 10000; // cm² para m²
  });
  const landingsVolumeM3 = landingsAreaM2 * thicknessM;
  const landingsWeightKg = landingsVolumeM3 * STEEL_DENSITY;

  // 3. CÁLCULO DAS VIGAS LATERAIS
  // Linha vermelha: Hipotenusa (rampa) calculada pelo teorema de Pitágoras em 1 degrau x quantidade
  const stepHypotenuseCm = Math.sqrt(Math.pow(treadDepthCm, 2) + Math.pow(stepHeightCm, 2));
  const redLineCm = stepHypotenuseCm * totalSteps;

  // Linha azul: Altura do triângulo do degrau (cateto1 * cateto2 / hipotenusa)
  const blueLineCm = (treadDepthCm * stepHeightCm) / stepHypotenuseCm;

  // Largura da viga (linha azul + 9 cm de dobra)
  const stringerWidthCm = blueLineCm + 9;

  // Cálculo final: (Linha Vermelha) x (Linha Azul + 9) x Espessura x Densidade x 2 corpos
  const stringerAreaM2 = (redLineCm / 100) * (stringerWidthCm / 100) * 2;
  const stringerVolumeM3 = stringerAreaM2 * thicknessM;
  const stringerWeightKg = stringerVolumeM3 * STEEL_DENSITY;

  // Total
  const totalWeightKg = stepsWeightKg + landingsWeightKg + stringerWeightKg;

  // Selecionar imagem representativa baseada no tipo de escada
  const isHollow = cutStepType.startsWith('hollow');
  const stepImage = isHollow ? vazadaEsquerdaBase64 : lisaEsquerdaBase64;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            <h2 className="text-2xl font-bold uppercase tracking-wider">Calculadora de Peso Estrutural</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle text-white hover:bg-white hover:text-primary">
            <span className="text-xl">✖</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700">
                <span className="text-xl">📏</span>
                Espessura da Chapa (Aço Carbono)
              </h3>
              <p className="text-sm text-slate-500 mt-1">Altere a espessura para recalcular o peso instantaneamente.</p>
            </div>
            
            <div className="flex gap-2 flex-wrap justify-end">
              {thicknessOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedThickness(opt.value)}
                  className={`btn ${selectedThickness === opt.value ? 'btn-primary' : 'btn-outline border-slate-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* DEGRAUS */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-t-blue-500 overflow-hidden flex flex-col">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-bold text-lg text-blue-800 text-center uppercase">Degraus ({totalSteps} un)</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center">
                <img src={stepImage} alt="Degrau" className="h-32 object-contain mb-4 filter drop-shadow-md" />
                <div className="text-center w-full">
                  <p className="text-sm text-slate-500 mb-1">Área total: {(stepAreaM2 * totalSteps).toFixed(2)} m²</p>
                  <p className="text-3xl font-black text-blue-600">{stepsWeightKg.toFixed(1)} <span className="text-lg font-normal">kg</span></p>
                </div>
              </div>
            </div>

            {/* PATAMARES */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-t-emerald-500 overflow-hidden flex flex-col">
              <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                <h3 className="font-bold text-lg text-emerald-800 text-center uppercase">Patamares ({landings.length} un)</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center">
                {landings.length > 0 ? (
                  <>
                    <img src={patamarBase64} alt="Patamar" className="h-32 object-contain mb-4 filter drop-shadow-md" />
                    <div className="text-center w-full">
                      <p className="text-sm text-slate-500 mb-1">Área total: {landingsAreaM2.toFixed(2)} m²</p>
                      <p className="text-3xl font-black text-emerald-600">{landingsWeightKg.toFixed(1)} <span className="text-lg font-normal">kg</span></p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 flex flex-col items-center">
                    <span className="text-6xl opacity-30 mb-2">🔲</span>
                    <p>Nenhum patamar</p>
                    <p className="text-2xl font-black text-slate-300 mt-2">0.0 <span className="text-lg font-normal">kg</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* ESTRUTURA VIGAS */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-t-amber-500 overflow-hidden flex flex-col">
              <div className="p-4 bg-amber-50 border-b border-amber-100">
                <h3 className="font-bold text-lg text-amber-800 text-center uppercase">Vigas Laterais (Par)</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center">
                <span className="text-7xl mb-6 drop-shadow-sm">📉</span>
                <div className="text-center w-full">
                  <p className="text-sm text-slate-500 mb-1">Corte Zigue-Zague ({stringerLengthM.toFixed(2)}m linear)</p>
                  <p className="text-3xl font-black text-amber-600">{stringerWeightKg.toFixed(1)} <span className="text-lg font-normal">kg</span></p>
                </div>
              </div>
            </div>

          </div>

          {/* TOTAL BANNER */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-8 flex flex-col md:flex-row items-center justify-between text-white">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <span className="text-4xl">⚖️</span>
              </div>
              <div>
                <h2 className="text-xl text-slate-300 uppercase tracking-widest font-semibold">Peso Total Estimado</h2>
                <p className="text-sm text-slate-400">Aço Carbono • Densidade 7850 kg/m³</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-6xl font-black">{totalWeightKg.toFixed(1)}</span>
              <span className="text-2xl text-slate-400 ml-2">kg</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2 text-slate-500 text-sm">
            <span className="text-lg">ℹ️</span>
            <p>Nota: O cálculo acima é uma estimativa matemática baseada no volume das chapas de aço. Corrimão, parafusos, solda, tinta e suportes extras não estão inclusos. Pode haver variação de acordo com sobras de corte e projeto final.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
