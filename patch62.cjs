const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const start = c.indexOf('<SectionTitle title="3. Valores & Entrega" />');
const end = c.indexOf('{/* 3.1. INFORMAÇÕES DE FRETE E INSTALAÇÃO */}');

console.log(c.substring(start, end));

const replacement = `<SectionTitle title="3. Valores & Entrega" />
                        
                        {/* SEPARAÇÃO: PREÇO ESCADA E PREÇO PATAMARES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ContractInput 
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
                        </div>

                        `;

c = c.substring(0, start) + replacement + c.substring(end);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Done");
