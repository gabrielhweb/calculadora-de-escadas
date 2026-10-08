const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetStart = '{/* SEPARAÇÃO: PREÇO ESCADA E PREÇO PATAMARES */}';
const targetEnd = '{/* 3.1. INFORMAÇÕES DE FRETE E INSTALAÇÃO */}';

const before = c.substring(0, c.indexOf(targetStart));
const after = c.substring(c.indexOf(targetEnd));

const replacement = `{/* SEPARAÇÃO: PREÇO ESCADA E PREÇO PATAMARES */}
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

fs.writeFileSync('src/pages/Contract.tsx', before + replacement + after);
console.log("Replaced perfectly!");
