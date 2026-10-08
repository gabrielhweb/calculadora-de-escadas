const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const sIdx = c.indexOf('<SectionTitle title="3. Valores & Entrega" />');
// Start AFTER the parent grid opening
const start = c.indexOf('<div className="col-span-2 sm:col-span-1">', sIdx);
const end = c.indexOf('<div className="col-span-2">', start);

console.log("Replacing:\n", c.substring(start, end));

const replacement = `<ContractInput 
                                label="Valor Escada" 
                                value={stairPrice} 
                                onChange={(e: any) => setStairPrice(e.target.value)} 
                                type="number" 
                            />
                            <ContractInput 
                                label="Valor Patamares" 
                                value={landingsPrice} 
                                onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                type="number"
                            />
                            <ContractInput 
                                label="V. Guarda-Corpo" 
                                value={guardrailPrice} 
                                onChange={(e: any) => setGuardrailPrice(e.target.value)} 
                                type="number"
                            />
                            <ContractInput 
                                label="V. Portão" 
                                value={gatePrice} 
                                onChange={(e: any) => setGatePrice(e.target.value)} 
                                type="number"
                            />
                            
                            `;

c = c.substring(0, start) + replacement + c.substring(end);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Done perfectly without breaking divs!");
