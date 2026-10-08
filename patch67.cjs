const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetSummary = `                        {/* RESUMO DE CUSTOS */}
                        <div className="mb-4 bg-white dark:bg-gray-700 p-3 rounded border border-gray-300 dark:border-gray-600">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 border-b border-gray-200 dark:border-gray-600 pb-1">
                                Resumo de Custos
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {parseFloat(stairPrice) > 0 && <p className="flex justify-between"><span>Escada:</span> <span>{formatCurrencyBRL(parseFloat(stairPrice))}</span></p>}
                                {parseFloat(landingsPrice) > 0 && <p className="flex justify-between"><span>Patamar(es):</span> <span>{formatCurrencyBRL(parseFloat(landingsPrice))}</span></p>}
                                {parseFloat(guardrailPrice) > 0 && <p className="flex justify-between"><span>Guarda-Corpo:</span> <span>{formatCurrencyBRL(parseFloat(guardrailPrice))}</span></p>}
                                {parseFloat(gatePrice) > 0 && <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice))}</span></p>}
                                {parseFloat(freightPrice) > 0 && <p className="flex justify-between"><span>Frete:</span> <span>{formatCurrencyBRL(parseFloat(freightPrice))}</span></p>}
                                {parseFloat(installationPrice) > 0 && <p className="flex justify-between"><span>Instalação:</span> <span>{formatCurrencyBRL(parseFloat(installationPrice))}</span></p>}
                                {parseFloat(extrasPrice) > 0 && <p className="flex justify-between"><span>Extras:</span> <span>{formatCurrencyBRL(parseFloat(extrasPrice))}</span></p>}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 font-bold text-gray-800 dark:text-gray-200 flex justify-between">
                                <span>Total Original:</span> <span>{formatCurrencyBRL(totalGeralBase)}</span>
                            </div>
                        </div>`;

if (c.includes(targetSummary)) {
    c = c.replace(targetSummary, '');
}

const targetLocation = `<p className="flex justify-between"><span>Valor Original:</span> <span className="line-through">{formatCurrencyBRL(totalGeralBase)}</span></p>`;

const newLocation = `{/* INJETADO RESUMO DE CUSTOS AQUI COMO O CLIENTE PEDIU */}
                                    <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-600 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                        {parseFloat(stairPrice) > 0 && <p className="flex justify-between"><span>Escada:</span> <span>{formatCurrencyBRL(parseFloat(stairPrice))}</span></p>}
                                        {parseFloat(landingsPrice) > 0 && <p className="flex justify-between"><span>Patamar(es):</span> <span>{formatCurrencyBRL(parseFloat(landingsPrice))}</span></p>}
                                        {parseFloat(guardrailPrice) > 0 && <p className="flex justify-between"><span>Guarda-Corpo:</span> <span>{formatCurrencyBRL(parseFloat(guardrailPrice))}</span></p>}
                                        {parseFloat(gatePrice) > 0 && <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice))}</span></p>}
                                        {parseFloat(freightPrice) > 0 && <p className="flex justify-between"><span>Frete:</span> <span>{formatCurrencyBRL(parseFloat(freightPrice))}</span></p>}
                                        {parseFloat(installationPrice) > 0 && <p className="flex justify-between"><span>Instalação:</span> <span>{formatCurrencyBRL(parseFloat(installationPrice))}</span></p>}
                                        {parseFloat(extrasPrice) > 0 && <p className="flex justify-between"><span>Extras:</span> <span>{formatCurrencyBRL(parseFloat(extrasPrice))}</span></p>}
                                    </div>
                                    ` + targetLocation;

c = c.replace(targetLocation, newLocation);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Moved summary to right above Valor Original');
