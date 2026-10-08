const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalOptions.tsx', 'utf8');

const patamaresBlock = `{inputData?.quoteType !== 'guardrail' && (() => {
                                    const realLandings = activeOption.landings.filter(l => !l.isAccessoriesOnly);
                                    if (realLandings.length === 0) return null;
                                    return (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {realLandings.length} Patamares (Soma):
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                                {formatCurrencyBRL(landingsPrice)}
                                            </span>
                                        </div>
                                    );
                                })()}`;

const patamaresNew = `{inputData?.quoteType !== 'guardrail' && activeOption.landings.filter(l => !l.isAccessoriesOnly).map((landing, idx) => (
                                    <div key={'pat-'+idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                        <span>Patamar {idx + 1} (Completo):</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(landing.price)}
                                        </span>
                                    </div>
                                ))}`;

const gcBlock = `{inputData?.quoteType !== 'guardrail' && inputData?.standaloneGuardrails && inputData.standaloneGuardrails.length > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {inputData.standaloneGuardrails.length} Guarda-Corpos/Portões:
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(inputData.standaloneGuardrails.reduce((acc, g) => acc + (g.price || 0), 0))}
                                        </span>
                                    </div>
                                )}`;

const gcNew = `{inputData?.quoteType !== 'guardrail' && inputData?.standaloneGuardrails && inputData.standaloneGuardrails.map((g, idx) => (
                                    <div key={'gc-'+idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                        <span>{(g.hasGate && !g.hasGuardrail) ? 'Portão Avulso' : 'Guarda-Corpo Avulso'} {idx + 1}:</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(g.price || 0)}
                                        </span>
                                    </div>
                                ))}`;

c = c.replace(patamaresBlock, patamaresNew);
c = c.replace(gcBlock, gcNew);

fs.writeFileSync('src/components/ProposalOptions.tsx', c);
console.log("Updated ProposalOptions to detailed breakdown");
