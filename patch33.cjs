const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetStr = `                            <div className="col-span-2 sm:col-span-1">
                                <ContractInput 
                                    label="Valor Patamares (Total)" 
                                    value={landingsPrice} 
                                    onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                    type="number"
                                />
                            </div>`;

const newStr = `                            <div className="col-span-2 sm:col-span-1">
                                <ContractInput 
                                    label={landings.length > 0 && landings.every(l => l.isAccessoriesOnly) ? "Valor Avulsos (Total)" : (landings.some(l => l.isAccessoriesOnly) ? "Valor Patamares / Avulsos" : "Valor Patamares (Total)")} 
                                    value={landingsPrice} 
                                    onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                    type="number"
                                />
                            </div>`;

c = c.replace(targetStr, newStr);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed UI label');
