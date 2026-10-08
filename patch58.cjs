const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-4">\s*<div className="col-span-2 sm:col-span-1">\s*<ContractInput\s*label="Valor Escada \(S\/ Patamar\)"[\s\S]*?label="V\. Portão"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replace = `<div className="grid grid-cols-2 gap-4">
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
    c = c.replace(regex, replace);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Replaced successfully!");
} else {
    console.log("REGEX DID NOT MATCH!");
}
