const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

// TASK 1: Fix Chapa 0 placeholder bug
const targetChapa = `<ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                placeholder={Math.round((landing.length * landing.width / 1000) * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                type="number"
                                            />`;

const replacementChapa = `<ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                placeholder={Math.round(((parseFloat(landing.length) || 0) * (parseFloat(landing.width) || 0) / 1000) * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                type="number"
                                            />`;

if(c.includes(targetChapa)) {
    c = c.replace(targetChapa, replacementChapa);
} else {
    // If patch42.cjs was silent error
    const oldChapa = `<ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: parseFloat(e.target.value) || 0 })} 
                                                type="text"
                                            />`;
    c = c.replace(oldChapa, replacementChapa);
}


// TASK 2: Portao UI
const portaoTarget = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                                    </div>`;

const portaoReplacement = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                                                    </div>`;

c = c.replace(portaoTarget, portaoReplacement);


// TASK 3: Split Avulsos into Guardrail and Gate
c = c.replace("const [avulsosPrice, setAvulsosPrice] = useState('0');", "const [guardrailPrice, setGuardrailPrice] = useState('0');\n    const [gatePrice, setGatePrice] = useState('0');");
c = c.replace("setAvulsosPrice(avulsosTotal.toFixed(2));", "setGuardrailPrice(landings.filter(l => l.isAccessoriesOnly && l.hasGuardrail).reduce((acc, l) => acc + computeLandingPrice(l), 0).toFixed(2));\n        setGatePrice(landings.filter(l => l.isAccessoriesOnly && l.hasGate).reduce((acc, l) => acc + computeLandingPrice(l), 0).toFixed(2));");

c = c.replace("const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0) + (parseFloat(avulsosPrice) || 0);", "const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0) + (parseFloat(guardrailPrice) || 0) + (parseFloat(gatePrice) || 0);");
c = c.replace(/finalLandingsPrice: \(parseFloat\(landingsPrice\) \|\| 0\) \+ \(parseFloat\(avulsosPrice\) \|\| 0\),/g, "finalLandingsPrice: (parseFloat(landingsPrice) || 0) + (parseFloat(guardrailPrice) || 0) + (parseFloat(gatePrice) || 0),");

const uiSplitTarget = `<div className="flex gap-2">
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

const uiSplitReplacement = `<div className="flex gap-2">
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
                                            label="V. Guarda-Corpo" 
                                            value={guardrailPrice} 
                                            onChange={(e: any) => setGuardrailPrice(e.target.value)} 
                                            type="number"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <ContractInput 
                                            label="V. Portão" 
                                            value={gatePrice} 
                                            onChange={(e: any) => setGatePrice(e.target.value)} 
                                            type="number"
                                        />
                                    </div>
                                </div>`;

c = c.replace(uiSplitTarget, uiSplitReplacement);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed Contract.tsx tasks');
