const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

// 1. Change "Valor em Dinheiro/Pix" to "Valor em {cashMethodName}"
const anchor1 = `Valor em Dinheiro/Pix ({Number(signalPercent).toFixed(1)}%)`;
const repl1 = `Valor em {cashMethodName} ({Number(signalPercent).toFixed(1)}%)`;
c = c.replace(anchor1, repl1);

// 2. Change "Quando pagar o Pix/Dinheiro?" to "Quando pagar o Sinal?"
const anchor2 = `Quando pagar o Pix/Dinheiro?`;
const repl2 = `Quando pagar o Sinal?`;
c = c.replace(anchor2, repl2);

// 3. Add Juros section to Hybrid mode's Remainder
const anchor3 = `                                            {['PIX', 'Maquininha de Cartão (Na Entrega)', 'Link de Pagamento (Cartão)', 'Boleto Bancário', 'Cheque Pré', 'Dinheiro na Entrega', 'Transferência Bancária'].map(opt => (
                                                    <button`;
const insertion = `
                                            <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Acréscimos / Parcelas (Restante)</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"/>
                                                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Somar Juros (Opcional)</span>
                                                    </label>
                                                </div>
                                                {enableInterest && (
                                                    <>
                                                        <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 dark:border-orange-600 rounded mb-2 text-sm bg-white dark:bg-gray-800 text-black dark:text-white"/>
                                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                            <input type="checkbox" checked={hideInterestLabel} onChange={e => setHideInterestLabel(e.target.checked)} className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"/>
                                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Ocultar palavra "com juros" no PDF</span>
                                                        </label>
                                                    </>
                                                )}
                                                <div className="flex gap-2 items-center">
                                                    <div className="flex-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Parcelas</span>
                                                        <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value)||1)} className="w-full p-2 border rounded font-bold text-center bg-white dark:bg-gray-800 text-black dark:text-white dark:border-gray-600"/>
                                                    </div>
                                                    <div className="flex-1 text-right">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Valor da Parcela</span>
                                                        <span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                                    </div>
                                                </div>
                                            </div>

`;

c = c.replace(anchor3, insertion + anchor3);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Updated Contract.tsx with responsive hybrid payment");
