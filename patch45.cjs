const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">\s*<ContractInput\s*label="Comp\. \(cm\)"\s*value=\{gateLength\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ gateLength: parseFloat\(e\.target\.value\) \|\| 0 \}\)\}\s*type="number"\s*\/>\s*<ContractInput\s*label="Altura \(cm\)"\s*value=\{gateHeight\.toString\(\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ gateHeight: parseFloat\(e\.target\.value\) \|\| 0 \}\)\}\s*type="number"\s*\/>\s*<\/div>/, `<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <ContractInput 
                                                            label="Comp. (cm)" 
                                                            value={gateLength.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateLength: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="Altura (cm)" 
                                                            value={gateHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                        <ContractInput 
                                                            label="R$/Metro" 
                                                            value={(landing.gatePricePerMeter !== undefined ? landing.gatePricePerMeter : 50).toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gatePricePerMeter: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                    </div>`);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed portao with regex');
