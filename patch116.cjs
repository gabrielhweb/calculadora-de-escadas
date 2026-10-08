const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<div className="flex bg-white dark:bg-gray-800 rounded p-1">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/m;

const replacement = `$&
                                    {(cashMethodName.toLowerCase().includes('cartão') || cashMethodName.toLowerCase().includes('boleto') || cashMethodName.toLowerCase().includes('cheque')) && (
                                        <div className="pt-3 mt-3 border-t border-blue-200 dark:border-blue-800 animate-fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Acréscimos / Parcelas (Sinal)</label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input type="checkbox" checked={enableSignalInterest} onChange={e => setEnableSignalInterest(e.target.checked)} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"/>
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Somar Juros (Opcional)</span>
                                                </label>
                                            </div>
                                            {enableSignalInterest && (
                                                <>
                                                    <input type="number" placeholder="Valor total dos juros do sinal (R$)" value={signalInterestValue} onChange={e => setSignalInterestValue(e.target.value)} className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded mb-2 text-sm bg-white dark:bg-gray-800 text-black dark:text-white"/>
                                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                        <input type="checkbox" checked={hideSignalInterestLabel} onChange={e => setHideSignalInterestLabel(e.target.checked)} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"/>
                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Ocultar palavra "com juros" no PDF</span>
                                                    </label>
                                                </>
                                            )}
                                            <div className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Parcelas</span>
                                                    <input type="number" value={signalInstallments} onChange={e => setSignalInstallments(parseInt(e.target.value)||1)} className="w-full p-2 border rounded font-bold text-center bg-white dark:bg-gray-800 text-black dark:text-white dark:border-gray-600"/>
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Valor da Parcela</span>
                                                    <span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(signalInstallmentVal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Added Signal Interest UI block");
} else {
    console.log("Regex not matched for UI block");
}
