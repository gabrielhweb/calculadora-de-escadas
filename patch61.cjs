const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<SectionTitle title="3\. Valores & Entrega" \/>\s*\{\/\* SEPARAÇÃO: PREÇO ESCADA E PREÇO PATAMARES \*\/}\s*<div className="grid grid-cols-2 gap-4">\s*<div className="col-span-2 sm:col-span-1">\s*<ContractInput\s*label="Valor Escada \(S\/ Patamar\)"[\s\S]*?label="V\. Portão"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

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
                        </div>`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Success with regex!");
} else {
    console.log("Regex missed!");
}
