const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalOptions.tsx', 'utf8');

const s1 = c.indexOf("{/* Linha Patamares */}");
const s2 = c.indexOf("{/* Linha Extras */}");

if (s1 !== -1 && s2 !== -1) {
    const replacement = `{/* Linha Patamares */}
                                {inputData?.quoteType !== 'guardrail' && activeOption.landings.filter(l => !l.isAccessoriesOnly).map((landing, idx) => (
                                    <div key={'pat-'+idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                        <span>Patamar {idx + 1} (Completo):</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(landing.price)}
                                        </span>
                                    </div>
                                ))}
                                
                                {/* Linha Acessórios (Guarda-Corpo/Portão Avulso na Escada) */}
                                {inputData?.quoteType !== 'guardrail' && inputData?.standaloneGuardrails && inputData.standaloneGuardrails.map((g, idx) => (
                                    <div key={'gc-'+idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                        <span>{(g.hasGate && !g.hasGuardrail) ? 'Portão Avulso' : (g.hasGate && g.hasGuardrail) ? 'Guarda-Corpo c/ Portão' : 'Guarda-Corpo Avulso'} {idx + 1}:</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(g.price || 0)}
                                        </span>
                                    </div>
                                ))}

                                `;
                                
    c = c.substring(0, s1) + replacement + c.substring(s2);
    fs.writeFileSync('src/components/ProposalOptions.tsx', c);
    console.log("Replaced successfully");
} else {
    console.log("Could not find boundaries");
}
