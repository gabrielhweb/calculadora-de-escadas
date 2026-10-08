const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<ContractInput\s*label="Valor Patamares \(Total\)"\s*value=\{landingsPrice\}\s*onChange=\{\(e: any\) => setLandingsPrice\(e\.target\.value\)\}\s*type="number"\s*\/>/;

const uiReplacement = `<div className="flex gap-2">
                                    <div className="flex-1">
                                        <ContractInput 
                                            label="Valor Patamares" 
                                            value={landingsPrice} 
                                            onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                            type="number"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <ContractInput 
                                            label="Valor Avulsos" 
                                            value={avulsosPrice} 
                                            onChange={(e: any) => setAvulsosPrice(e.target.value)} 
                                            type="number"
                                        />
                                    </div>
                                </div>`;

c = c.replace(regex, uiReplacement);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed UI block');
