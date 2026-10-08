const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<ContractInput\s*label="Comp\. \(cm\)"\s*value=\{landing\.length\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ length: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Larg\. \(cm\)"\s*value=\{landing\.width\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ width: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Preço Base \(R\$\)"\s*value=\{landing\.weightPerSqm !== undefined \? landing\.weightPerSqm\.toString\(\) : '29'\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ weightPerSqm: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Chapa \(R\$\)"\s*value=\{landing\.chapaPrice !== undefined \? landing\.chapaPrice\.toString\(\) : ''\}\s*placeholder=\{[^}]+\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ chapaPrice: e\.target\.value === '' \? undefined : \(parseFloat\(e\.target\.value\) \|\| 0\) \}\)\}\s*type="number"\s*\/>/;

const replaceUI = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                <ContractInput 
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
                                                    label="Preço/Peso Base (R$)" 
                                                    value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                                    onChange={(e: any) => updateLanding(landing.id, { weightPerSqm: parseFloat(e.target.value) })} 
                                                    type="number"
                                                />
                                                <ContractInput 
                                                    label="Preço da Chapa (R$)" 
                                                    value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                    placeholder={Math.round(((((Number(landing.length) || 0) + 20) / 100) * (((Number(landing.width) || 0) + 20) / 100)) * 0.00334 * 7850 * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                    onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                    type="number"
                                                />
                                            </div>`;

c = c.replace(regex, replaceUI);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed grid with regex');
