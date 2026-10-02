const fs = require('fs');

let pd = fs.readFileSync('src/components/ProposalOptions.tsx', 'utf8');

const targetSummaryGrid = `<div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-700 dark:text-gray-300 font-medium mb-4 pl-2">
                        <p><strong className="text-gray-900 dark:text-white">Total Peças:</strong> {activeOption.steps} un</p>
                        <p><strong className="text-gray-900 dark:text-white">Alt/Degrau:</strong> {activeOption.stepHeight.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Pisante:</strong> {activeOption.treadDepth.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Largura:</strong> {activeOption.stairWidth} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Comp. Total:</strong> {(activeOption.totalLength / 100).toFixed(2)} m</p>
                    </div>`;

const replacementSummaryGrid = `{inputData?.quoteType === 'stair' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-700 dark:text-gray-300 font-medium mb-4 pl-2">
                        <p><strong className="text-gray-900 dark:text-white">Total Peças:</strong> {activeOption.steps} un</p>
                        <p><strong className="text-gray-900 dark:text-white">Alt/Degrau:</strong> {activeOption.stepHeight.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Pisante:</strong> {activeOption.treadDepth.toFixed(2)} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Largura:</strong> {activeOption.stairWidth} cm</p>
                        <p><strong className="text-gray-900 dark:text-white">Comp. Total:</strong> {(activeOption.totalLength / 100).toFixed(2)} m</p>
                    </div>
                    )}`;

pd = pd.replace(targetSummaryGrid, replacementSummaryGrid);

const targetPriceBreakdown = `{/* Linha Degraus */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {activeOption.structureSteps} Degraus {hasCustomPrice ? '(Preço Manual)' : \`(\${formatCurrencyBRL(calculatedUnitPrice)}/un)\`}:
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {formatCurrencyBRL(hasCustomPrice ? (inputData!.customStepPrice! * activeOption.structureSteps) : structureStepsPrice)}
                                    </span>
                                </div>
                                
                                {/* Linha Patamares */}
                                {activeOption.landings.length > 0 && (
                                     <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {activeOption.landings.length} Patamares (Soma):
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(landingsPrice)}
                                        </span>
                                    </div>
                                )}`;

const replacementPriceBreakdown = `{/* Linha Degraus */}
                                {inputData?.quoteType === 'stair' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {activeOption.structureSteps} Degraus {hasCustomPrice ? '(Preço Manual)' : \`(\${formatCurrencyBRL(calculatedUnitPrice)}/un)\`}:
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(hasCustomPrice ? (inputData!.customStepPrice! * activeOption.structureSteps) : structureStepsPrice)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Linha Patamares */}
                                {activeOption.landings.length > 0 && (
                                     <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {inputData?.quoteType === 'guardrail' 
                                                ? \`\${activeOption.landings.length} Guarda-corpos/Portões:\` 
                                                : \`\${activeOption.landings.length} Patamares (Soma):\`}
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(landingsPrice)}
                                        </span>
                                    </div>
                                )}`;

pd = pd.replace(targetPriceBreakdown, replacementPriceBreakdown);

// Fix title Valor da Estrutura
const targetTitle = `<span className="font-bold text-gray-900 dark:text-white uppercase">Valor da Estrutura:</span>`;
const replacementTitle = `<span className="font-bold text-gray-900 dark:text-white uppercase">{inputData?.quoteType === 'stair' ? 'Valor da Estrutura:' : 'Valor do Produto:'}</span>`;
pd = pd.replace(targetTitle, replacementTitle);

const targetTitle2 = `<span>Total Estrutura + Extras:</span>`;
const replacementTitle2 = `<span>{inputData?.quoteType === 'stair' ? 'Total Estrutura + Extras:' : 'Total (Produtos + Extras):'}</span>`;
pd = pd.replace(targetTitle2, replacementTitle2);

fs.writeFileSync('src/components/ProposalOptions.tsx', pd);
console.log('Fixed ProposalOptions.tsx UI for Guardrails and Landings');
