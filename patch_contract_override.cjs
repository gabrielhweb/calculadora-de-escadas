const fs = require('fs'); 
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8'); 

c = c.replace(/const \[isListening, setIsListening\] = useState\(false\);/, "const [isListening, setIsListening] = useState(false);\n    const [contractFormatOverride, setContractFormatOverride] = useState<'auto' | 'stair' | 'landing' | 'guardrail'>('auto');"); 

c = c.replace(/const finalHybridSignal = parseFloat\(hybridSignalValue\) \|\| \(discountedBase \* \(signalPercent\/100\)\);/g, `const finalHybridSignal = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent/100));\n\n        const finalQuoteType = contractFormatOverride !== 'auto' ? contractFormatOverride : (inputData.quoteType || 'stair');\n        const finalInputData = { ...inputData, quoteType: finalQuoteType };\n        if (finalQuoteType === 'landing' || finalQuoteType === 'guardrail') { finalInputData.isAdendo = true; } else { finalInputData.isAdendo = false; }`); 

c = c.replace(/inputData: inputData,/g, 'inputData: finalInputData,'); 

const radioUI = `<div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Formato do Contrato (Texto)</h3>
                                  <div className="flex flex-col sm:flex-row gap-4">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="formatOverride" checked={contractFormatOverride === 'auto'} onChange={() => setContractFormatOverride('auto')} className="text-highlight focus:ring-highlight" />
                                          <span className="text-sm text-gray-800 dark:text-gray-200">Automático</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="formatOverride" checked={contractFormatOverride === 'stair'} onChange={() => setContractFormatOverride('stair')} className="text-highlight focus:ring-highlight" />
                                          <span className="text-sm text-gray-800 dark:text-gray-200">Escada Completa</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="formatOverride" checked={contractFormatOverride === 'landing'} onChange={() => setContractFormatOverride('landing')} className="text-highlight focus:ring-highlight" />
                                          <span className="text-sm text-gray-800 dark:text-gray-200">Somente Patamar(es)</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="formatOverride" checked={contractFormatOverride === 'guardrail'} onChange={() => setContractFormatOverride('guardrail')} className="text-highlight focus:ring-highlight" />
                                          <span className="text-sm text-gray-800 dark:text-gray-200">Guarda-Corpo/Portão</span>
                                      </label>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">Escolha se deseja forçar o PDF a omitir a escada principal no texto do objeto contratual.</p>
                              </div>
                              <div className="flex gap-4">
                                  <button onClick={handleGeneratePDF}`;

c = c.replace(/<div className="flex gap-4">\s*<button onClick=\{handleGeneratePDF\}/, radioUI); 

fs.writeFileSync('src/pages/Contract.tsx', c);
