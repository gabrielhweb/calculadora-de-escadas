import React from "react";
import { LandingInfo } from "../types";
import { getAutoGuardrailLengths } from "./CalculatorForm";
import { GuardrailPreview } from "./GuardrailPreview";

export const GuardrailEditor = ({ landing, updateLanding, InputField, isGate = false }: any) => {
    const gFormat = landing.guardrailFormat || "normal";
    const gHeight = landing.guardrailHeight || 90;
    const gPricePerMeter = landing.guardrailPricePerMeter !== undefined ? landing.guardrailPricePerMeter : 50;

    const renderSegment = (length: number, override: number | undefined, updateOverride: (val: number | undefined) => void, label: string, gapOverride: number | undefined, updateGap: (val: number | undefined) => void, priceOverride: number | undefined, updatePrice: (val: number | undefined) => void) => {
        let innerL = length - 6;
        if (innerL < 0) innerL = 0;
        const baseGaps = Math.max(1, Math.round(innerL / 15));
        const baseBars = baseGaps + 1;
        
        let totalBars = override !== undefined ? override : baseBars;
        totalBars = Math.max(2, totalBars);
        
        let numInterBars = totalBars - 2;
        let numGaps = numInterBars + 1;
        let exactGap = (innerL - (numInterBars * 3)) / numGaps;
        
        let totalVerticalMeters = totalBars * (gHeight / 100);
        let totalHorizontalMeters = 2 * (length / 100);
        let gTotalMeters = totalVerticalMeters + totalHorizontalMeters;
        let currentGPrice = Math.round(gTotalMeters * gPricePerMeter);
        
        const gOptions = [
            { bars: baseBars - 1, label: "-1 Barra" },
            { bars: baseBars, label: "Padrão" },
            { bars: baseBars + 1, label: "+1 Barra" }
        ].filter(o => o.bars >= 2);

        return (
            <div className="flex flex-col mb-4 p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
                <div className="flex flex-col items-center justify-center p-4 w-full">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Prévia do {isGate ? 'Portão' : 'Guarda-Corpo'}</p>
                    <GuardrailPreview length={length} height={gHeight} totalBars={totalBars} isGate={isGate} />
                    <div className="flex gap-2 w-full max-w-[400px] mx-auto mt-6">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qtd. Tubos</span>
                            <input
                                type="number"
                                value={totalBars}
                                onChange={(e: any) => {
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val) || val < 2) return;
                                    updateOverride(val);
                                }}
                                className="w-full text-center font-bold text-sm bg-transparent outline-none border-b border-gray-300 focus:border-highlight"
                            />
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">vãos exatos</span>
                            <div className="flex items-center justify-center">
                                <input 
                                    type="number" 
                                    value={gapOverride !== undefined ? gapOverride : parseFloat(exactGap.toFixed(1))} 
                                    onChange={(e: any) => updateGap(e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                                    onBlur={(e: any) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val > 0) {
                                            const gapsCalc = (innerL + 3) / (val + 3);
                                            const impliedBars = Math.round(gapsCalc) + 1;
                                            if (impliedBars >= 2 && impliedBars !== totalBars) {
                                                if (window.confirm(`Com esse vão de ${val}cm, a quantidade ideal de tubos seria ${impliedBars} (atualmente está ${totalBars}). Deseja ajustar a quantidade de tubos automaticamente?`)) {
                                                    updateOverride(impliedBars);
                                                } else {
                                                    updateGap(undefined);
                                                }
                                            }
                                        }
                                    }}
                                    className="w-16 text-center font-bold text-highlight text-sm bg-transparent outline-none border-b border-gray-300 focus:border-highlight" 
                                    step="0.1" 
                                />
                                <span className="text-highlight font-bold text-sm ml-1">cm</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total (R$)</span>
                            <div className="flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm mr-1">R$</span>
                                <input type="number" value={priceOverride !== undefined ? priceOverride : currentGPrice} onChange={(e: any) => updatePrice(e.target.value === '' ? undefined : parseFloat(e.target.value))} className="w-16 text-center font-bold text-blue-600 text-sm bg-transparent outline-none border-b border-gray-300 focus:border-highlight" step="1" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-3">
                        <button onClick={() => { updateOverride(undefined); updateGap(undefined); updatePrice(undefined); }} className="text-[10px] text-blue-500 hover:underline">Restaurar Padrão Automático</button>
                    </div>
                </div>
            </div>
        );
    };

    const numSides = gFormat === "U" ? 3 : gFormat === "L" ? 2 : 1;

    return (
        <div className="mt-2 space-y-3">
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Formato:</label>
                    <select
                        value={gFormat}
                        onChange={(e) => {
                            const newFormat = e.target.value as any;
                            const auto = getAutoGuardrailLengths(newFormat, landing.guardrailSide || "", landing.width || 0, landing.length || 0);
                            updateLanding(landing.id, {
                                guardrailFormat: newFormat,
                                guardrailLength: auto.guardrailLength,
                                guardrailLength2: auto.guardrailLength2,
                                guardrailLength3: auto.guardrailLength3,
                                guardrailBarsOverride: undefined,
                                guardrailBarsOverride2: undefined,
                                guardrailBarsOverride3: undefined, guardrailGapOverride: undefined, guardrailGapOverride2: undefined, guardrailGapOverride3: undefined, guardrailPriceOverride: undefined, guardrailPriceOverride2: undefined, guardrailPriceOverride3: undefined
                            });
                        }}
                        className="w-full text-xs font-bold p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                    >
                        <option value="normal">Normal (Reto)</option>
                        <option value="L">Em L</option>
                        <option value="U">Em U</option>
                        <option value="frente">Apenas Frente</option>
                        <option value="atras">Apenas Atrás</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Lado/Orientação:</label>
                    <select
                        value={landing.guardrailSide || ""}
                        onChange={(e) => {
                            const newSide = e.target.value;
                            const auto = getAutoGuardrailLengths(gFormat, newSide, landing.width || 0, landing.length || 0);
                            updateLanding(landing.id, { 
                                guardrailSide: newSide,
                                guardrailLength: auto.guardrailLength,
                                guardrailLength2: auto.guardrailLength2,
                                guardrailLength3: auto.guardrailLength3
                            });
                        }}
                        className="w-full text-xs font-bold p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                    >
                        <option value="">Selecione...</option>
                        {gFormat === "normal" && (
                            <>
                                <option value="Direita">Direita</option>
                                <option value="Esquerda">Esquerda</option>
                            </>
                        )}
                        {gFormat === "L" && (
                            <>
                                <option value="Frente e Direita">Frente e Direita</option>
                                <option value="Frente e Esquerda">Frente e Esquerda</option>
                                <option value="Atrás e Direita">Atrás e Direita</option>
                                <option value="Atrás e Esquerda">Atrás e Esquerda</option>
                            </>
                        )}
                        {gFormat === "U" && (
                            <>
                                <option value="Esquerda, Frente, Direita">Esquerda, Frente, Direita</option>
                                <option value="Esquerda, Atrás, Direita">Esquerda, Atrás, Direita</option>
                            </>
                        )}
                        {(gFormat === "frente" || gFormat === "atras") && (
                            <option value={gFormat === "frente" ? "Frente" : "Atrás"}>{gFormat === "frente" ? "Frente" : "Atrás"}</option>
                        )}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[110px]">
                    <InputField 
                        label={numSides === 1 ? "Comp." : "Lado 1"} 
                        value={(landing.guardrailLength || 0).toString()} 
                        onChange={(e: any) => updateLanding(landing.id, { guardrailLength: parseFloat(e.target.value) || 0 })} 
                        unit="cm" 
                        className="mb-0"
                    />
                </div>
                {numSides >= 2 && (
                    <div className="flex-1 min-w-[110px]">
                        <InputField 
                            label="Lado 2" 
                            value={(landing.guardrailLength2 || 0).toString()} 
                            onChange={(e: any) => updateLanding(landing.id, { guardrailLength2: parseFloat(e.target.value) || 0 })} 
                            unit="cm" 
                            className="mb-0"
                        />
                    </div>
                )}
                {numSides >= 3 && (
                    <div className="flex-1 min-w-[110px]">
                        <InputField 
                            label="Lado 3" 
                            value={(landing.guardrailLength3 || 0).toString()} 
                            onChange={(e: any) => updateLanding(landing.id, { guardrailLength3: parseFloat(e.target.value) || 0 })} 
                            unit="cm" 
                            className="mb-0"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-[110px]">
                    <InputField 
                        label="Altura" 
                        value={(landing.guardrailHeight || 90).toString()} 
                        onChange={(e: any) => updateLanding(landing.id, { guardrailHeight: parseFloat(e.target.value) || 0 })} 
                        unit="cm" 
                        className="mb-0"
                    />
                </div>
                <div className="flex-1 min-w-[110px]">
                    <InputField 
                        label="R$/Metro" 
                        value={(landing.guardrailPricePerMeter !== undefined ? landing.guardrailPricePerMeter : 50).toString()} 
                        onChange={(e: any) => updateLanding(landing.id, { guardrailPricePerMeter: parseFloat(e.target.value) || 0 })} 
                        unit="R$" 
                        className="mb-0"
                    />
                </div>
            </div>

            <div className="mt-4">
                {renderSegment(landing.guardrailLength || 0, landing.guardrailBarsOverride, (val) => updateLanding(landing.id, { guardrailBarsOverride: val }), numSides > 1 ? "LADO 1" : "GUARDA-CORPO", landing.guardrailGapOverride, (val) => updateLanding(landing.id, { guardrailGapOverride: val }), landing.guardrailPriceOverride, (val) => updateLanding(landing.id, { guardrailPriceOverride: val }))}
                {numSides >= 2 && renderSegment(landing.guardrailLength2 || 0, landing.guardrailBarsOverride2, (val) => updateLanding(landing.id, { guardrailBarsOverride2: val }), "LADO 2", landing.guardrailGapOverride2, (val) => updateLanding(landing.id, { guardrailGapOverride2: val }), landing.guardrailPriceOverride2, (val) => updateLanding(landing.id, { guardrailPriceOverride2: val }))}
                {numSides >= 3 && renderSegment(landing.guardrailLength3 || 0, landing.guardrailBarsOverride3, (val) => updateLanding(landing.id, { guardrailBarsOverride3: val }), "LADO 3", landing.guardrailGapOverride3, (val) => updateLanding(landing.id, { guardrailGapOverride3: val }), landing.guardrailPriceOverride3, (val) => updateLanding(landing.id, { guardrailPriceOverride3: val }))}
            </div>
        </div>
    );
};
