const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const anchor = `<div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Acréscimos / Parcelas (Restante)</label>`;

const replacement = `{(remainderPaymentMode.toLowerCase().includes('cartão') || remainderPaymentMode.toLowerCase().includes('boleto') || remainderPaymentMode.toLowerCase().includes('cheque')) && (
                                            <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800 animate-fade-in">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Acréscimos / Parcelas (Restante)</label>`;

const anchorEnd = `<span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                                    </div>
                                                </div>
                                            </div>`;

const replacementEnd = `<span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            )}`;

c = c.replace(anchor, replacement);
c = c.replace(anchorEnd, replacementEnd);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Updated remainder interest visibility");
