const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalOptions.tsx', 'utf8');

c = c.replace(
    'const hasCustomPrice = inputData?.customStepPrice && inputData.customStepPrice > 0;',
    'const hasCustomPrice = inputData?.customStepPrice && inputData.customStepPrice > 0;\n            const stairSideBarPrice = inputData?.hasStairSideBar ? (inputData.stairSideBarPrice || 0) : 0;'
);

c = c.replace(
    '                                {/* Detalhamento dos Patamares */}',
    `                                {/* Barra Lateral */}
                                {stairSideBarPrice > 0 && (
                                    <div className="flex justify-between items-center text-blue-700 dark:text-blue-300">
                                        <span>Barra Lateral da Escada:</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrencyBRL(stairSideBarPrice)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Detalhamento dos Patamares */}`
);

fs.writeFileSync('src/components/ProposalOptions.tsx', c);
console.log("Added sidebar to ProposalOptions");
