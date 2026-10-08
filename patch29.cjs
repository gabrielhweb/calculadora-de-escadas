const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<ContractInput\s*label="Comp\. \(cm\)"\s*value=\{landing\.length\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ length: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Larg\. \(cm\)"\s*value=\{landing\.width\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ width: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>/;

const match = c.match(regex);
if (!match) {
    console.log("Could not match the two inputs!");
} else {
    console.log("Matched the two inputs!");
    const newStr = `                                            <ContractInput 
                                                label="Comp. (cm)" 
                                                value={landing.length.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { length: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Larg. (cm)" 
                                                value={landing.width.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { width: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Preço Base (R$)" 
                                                value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                                onChange={(e: any) => updateLanding(landing.id, { weightPerSqm: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <div className="col-span-2 mt-4 space-y-3 border-t pt-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={!!landing.hasFrenchBrackets}
                                                        onChange={(e) => updateLanding(landing.id, { hasFrenchBrackets: e.target.checked })}
                                                        className="w-4 h-4 text-highlight rounded border-gray-300 focus:ring-highlight"
                                                    />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Possui Mão Francesa?</span>
                                                </label>
                                                {landing.hasFrenchBrackets && (
                                                    <div className="flex gap-2">
                                                        <ContractInput 
                                                            label="Qtd." 
                                                            value={(landing.frenchBrackets !== undefined ? landing.frenchBrackets : 2).toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { frenchBrackets: parseInt(e.target.value) })} 
                                                            type="number"
                                                            className="flex-1"
                                                        />
                                                        <ContractInput 
                                                            label="Preço Unit." 
                                                            value={(landing.frenchBracketPrice !== undefined ? landing.frenchBracketPrice : 140).toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { frenchBracketPrice: parseFloat(e.target.value) })} 
                                                            type="number"
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={!!landing.hasGuardrail}
                                                        onChange={(e) => updateLanding(landing.id, { hasGuardrail: e.target.checked })}
                                                        className="w-4 h-4 text-highlight rounded border-gray-300 focus:ring-highlight"
                                                    />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Possui Guarda Corpo?</span>
                                                </label>
                                                {landing.hasGuardrail && (
                                                    <div className="p-2 border rounded bg-gray-50 dark:bg-gray-700/50">
                                                        <GuardrailEditor landing={landing} updateLanding={updateLanding} InputField={ContractInput} stairWidth={parseFloat(width)} />
                                                    </div>
                                                )}

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={!!landing.hasGate}
                                                        onChange={(e) => updateLanding(landing.id, { hasGate: e.target.checked })}
                                                        className="w-4 h-4 text-highlight rounded border-gray-300 focus:ring-highlight"
                                                    />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Possui Portãozinho?</span>
                                                </label>
                                                {landing.hasGate && (
                                                    <div className="grid grid-cols-2 gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-700/50">
                                                        <ContractInput 
                                                            label="Comp. (cm)" 
                                                            value={(landing.gateLength !== undefined ? landing.gateLength : 100).toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateLength: parseFloat(e.target.value) })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="Altura (cm)" 
                                                            value={(landing.gateHeight !== undefined ? landing.gateHeight : 90).toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateHeight: parseFloat(e.target.value) })} 
                                                            type="number"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-center">
                                                    <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase">Preço Total Deste Patamar Completo</p>
                                                    <p className="text-lg font-black text-blue-900 dark:text-blue-100">R$ {computeLandingPrice(landing)}</p>
                                                </div>
                                            </div>`;
    c = c.replace(regex, newStr);
    fs.writeFileSync('src/pages/Contract.tsx', c);
}
