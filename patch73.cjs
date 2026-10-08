const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /\{landing\.hasGate && \(\s*<div className="grid grid-cols-2 gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-700\/50">\s*<ContractInput\s*label="Comp\. \(cm\)"\s*value=\{\(landing\.gateLength !== undefined \? landing\.gateLength : 100\)\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ gateLength: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Altura \(cm\)"\s*value=\{\(landing\.gateHeight !== undefined \? landing\.gateHeight : 90\)\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ gateHeight: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<\/div>\s*\)\}/;

const replacement = `{landing.hasGate && (() => {
                                                    const gateLength = landing.gateLength !== undefined ? landing.gateLength : 100;
                                                    const gateHeight = landing.gateHeight !== undefined ? landing.gateHeight : 90;
                                                    
                                                    let innerL = gateLength - 6;
                                                    if (innerL < 0) innerL = 0;
                                                    const baseGaps = Math.max(1, Math.round(innerL / 15));
                                                    const baseBars = baseGaps + 1;
                                                    
                                                    let totalBars = landing.gateBarsOverride !== undefined ? landing.gateBarsOverride : baseBars;
                                                    totalBars = Math.max(2, totalBars);
                                                    
                                                    let numInterBars = totalBars - 2;
                                                    let numGaps = numInterBars + 1;
                                                    let exactGap = (innerL - (numInterBars * 3)) / numGaps;

                                                    const gateSidesOptions = ["Direita", "Esquerda", "Frente", "Atrás", "Início da escada", "Fim da escada"];

                                                    return (
                                                        <div className="flex flex-col mb-4 p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                                                            <div className="flex gap-2 mb-3">
                                                                <div className="flex-1">
                                                                    <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Lado/Orientação do Portão:</label>
                                                                    <select
                                                                        value={landing.gateSide || ''}
                                                                        onChange={(e) => updateLanding(landing.id, { gateSide: e.target.value })}
                                                                        className="w-full text-xs font-bold p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                                                                    >
                                                                        <option value="">Selecione...</option>
                                                                        {gateSidesOptions.map(side => (
                                                                            <option key={side} value={side}>{side}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 mb-4">
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
                                                            </div>

                                                            <div className="flex flex-col items-center justify-center p-4 w-full bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Prévia do Portão</p>
                                                                <GuardrailPreview length={gateLength} height={gateHeight} totalBars={totalBars} isGate={true} />
                                                                
                                                                <div className="flex gap-2 w-full max-w-[400px] mx-auto mt-6">
                                                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                                                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qtd. Tubos</span>
                                                                        <input
                                                                            type="number"
                                                                            value={totalBars}
                                                                            onChange={e => {
                                                                                const val = parseInt(e.target.value);
                                                                                if (!isNaN(val) && val >= 2) updateLanding(landing.id, { gateBarsOverride: val });
                                                                            }}
                                                                            className="w-full text-center font-bold text-lg p-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 outline-none"
                                                                            min={2}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                                                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Folga/Vão</span>
                                                                        <span className="block font-bold text-lg py-1">{exactGap.toFixed(1)}</span>
                                                                    </div>
                                                                </div>
                                                                {landing.gateBarsOverride !== undefined && (
                                                                    <button onClick={() => updateLanding(landing.id, { gateBarsOverride: undefined })} className="mt-3 text-[10px] text-blue-500 underline uppercase">Restaurar Padrão Automático</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Contract.tsx gate inside patamar replaced successfully!");
} else {
    console.log("Regex for Contract.tsx failed!");
}
