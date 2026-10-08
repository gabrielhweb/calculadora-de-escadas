const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetStart = '{landings.filter((l: any) => l.isAccessoriesOnly && l.hasGate).map((landing, idx) => {';
const targetEnd = '// --- SEÇÃO PATAMARES ---';

const before = c.substring(0, c.indexOf(targetStart));
const after = c.substring(c.indexOf(targetEnd));

const replacement = `{landings.filter((l: any) => l.isAccessoriesOnly && l.hasGate).map((landing, idx) => {
                                        const index = landings.indexOf(landing);
                                        
                                        const gateLength = landing.gateLength !== undefined ? landing.gateLength : 100;
                                        const gateHeight = landing.gateHeight !== undefined ? landing.gateHeight : 90;
                                        const gatePricePerMeter = landing.gatePricePerMeter !== undefined ? landing.gatePricePerMeter : 50;
                                        
                                        let innerL = gateLength - 6;
                                        if (innerL < 0) innerL = 0;
                                        const baseGaps = Math.max(1, Math.round(innerL / 15));
                                        const baseBars = baseGaps + 1;
                                        
                                        let totalBars = landing.gateBarsOverride !== undefined ? landing.gateBarsOverride : baseBars;
                                        totalBars = Math.max(2, totalBars);
                                        
                                        let totalVerticalMeters = totalBars * (gateHeight / 100);
                                        let totalHorizontalMeters = 2 * (gateLength / 100);
                                        let gateTotalMeters = totalVerticalMeters + totalHorizontalMeters;
                                        let currentGatePrice = Math.round(gateTotalMeters * gatePricePerMeter);
                                        
                                        let numInterBars = totalBars - 2;
                                        let numGaps = numInterBars + 1;
                                        let exactGap = (innerL - (numInterBars * 3)) / numGaps;

                                        const gateSidesOptions = ["Direita", "Esquerda", "Frente", "Atrás", "Início da escada", "Fim da escada"];
                                        const availableGateSides = gateSidesOptions;

                                        return (
                                            <div key={landing.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm relative">
                                                <button 
                                                    onClick={() => handleRemoveLanding(landing.id)}
                                                    type="button"
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-700"
                                                >
                                                    x
                                                </button>
                                                <span className="text-xs font-bold text-gray-500 absolute top-1 left-2 flex items-center gap-1 bg-white dark:bg-gray-800 px-1 rounded shadow-sm">
                                                    🚪 Portão Avulso #{index + 1}
                                                </span>
                                                
                                                <div className="mt-6 space-y-3">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Lado/Orientação do Portão:</label>
                                                            <select
                                                                value={landing.gateSide || ''}
                                                                onChange={(e) => updateLanding(landing.id, { gateSide: e.target.value })}
                                                                className="w-full text-xs font-bold p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                                                            >
                                                                <option value="">Selecione...</option>
                                                                {availableGateSides.map(side => (
                                                                    <option key={side} value={side}>{side}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                                        <ContractInput 
                                                            label="Comp. (cm)" 
                                                            value={gateLength.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateLength: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="Altura (cm)" 
                                                            value={gateHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="R$/Metro" 
                                                            value={gatePricePerMeter.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gatePricePerMeter: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="Valor Total (R$)" 
                                                            value={currentGatePrice.toString()} 
                                                            onChange={() => {}} 
                                                            type="text"
                                                        />
                                                    </div>

                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 text-center mt-2">
                                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Prévia do Portão</p>
                                                        <GuardrailPreview length={gateLength} height={gateHeight} totalBars={totalBars} isGate={true} />
                                                        <div className="mt-4 flex flex-col gap-2">
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase text-center">Configuração de Barras</p>
                                                            <div className="flex gap-2 items-center">
                                                                <div className="flex-1">
                                                                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Qtd. Tubos</label>
                                                                    <input
                                                                        type="number"
                                                                        min="2"
                                                                        value={totalBars}
                                                                        onChange={e => {
                                                                            const val = parseInt(e.target.value);
                                                                            if (val >= 2) updateLanding(landing.id, { gateBarsOverride: val });
                                                                        }}
                                                                        className="w-full text-sm font-bold p-2 text-center text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-center border border-gray-200 dark:border-gray-600">
                                                                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase block mb-1">Vãos de</span>
                                                                    <span className="text-sm font-black text-highlight">{exactGap.toFixed(1)} cm</span>
                                                                </div>
                                                            </div>
                                                            {landing.gateBarsOverride !== undefined && landing.gateBarsOverride !== baseBars && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateLanding(landing.id, { gateBarsOverride: undefined })}
                                                                    className="mt-1 text-[10px] text-blue-500 hover:text-blue-700 underline"
                                                                >
                                                                    Restaurar Padrão Automático
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        `;

fs.writeFileSync('src/pages/Contract.tsx', before + replacement + after);
console.log('Fixed standalone gate block');
