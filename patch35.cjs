const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace("const [landingsPrice, setLandingsPrice] = useState('0'); // Preço total dos patamares", "const [landingsPrice, setLandingsPrice] = useState('0');\n    const [avulsosPrice, setAvulsosPrice] = useState('0');");

const useEffectTarget = `    // Auto-update landings price whenever landings change, especially for accessories
    useEffect(() => {
        const total = landings.reduce((acc, l) => acc + (l.isAccessoriesOnly ? computeLandingPrice(l) : Number(l.price || 0)), 0);
        setLandingsPrice(total.toFixed(2));
    }, [landings]);`;

const useEffectReplacement = `    // Auto-update landings and avulsos price whenever landings change
    useEffect(() => {
        // ALWAYS use computeLandingPrice so newly created real patamares aren't zero!
        const patamaresTotal = landings.filter(l => !l.isAccessoriesOnly).reduce((acc, l) => acc + computeLandingPrice(l), 0);
        const avulsosTotal = landings.filter(l => l.isAccessoriesOnly).reduce((acc, l) => acc + computeLandingPrice(l), 0);
        
        // We only auto-update if we are computing from scratch, otherwise we might overwrite manual edits.
        // Actually, to be safe and fix the bug where Patamar price is zero, we ALWAYS update them when landings array changes.
        setLandingsPrice(patamaresTotal.toFixed(2));
        setAvulsosPrice(avulsosTotal.toFixed(2));
    }, [landings]);`;

c = c.replace(useEffectTarget, useEffectReplacement);

c = c.replace("const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0);", "const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0) + (parseFloat(avulsosPrice) || 0);");

// And for the PDF and DB payloads, we need to pass both! 
// Wait, to NOT break contractGenerator.ts completely, we can just send the SUM as finalLandingsPrice!
// finalLandingsPrice: (parseFloat(landingsPrice) || 0) + (parseFloat(avulsosPrice) || 0)

c = c.replace(/finalLandingsPrice: parseFloat\(landingsPrice\) \|\| 0,/g, "finalLandingsPrice: (parseFloat(landingsPrice) || 0) + (parseFloat(avulsosPrice) || 0),");

// Now for the UI!
const uiTarget = `                            <div className="col-span-2 sm:col-span-1">
                                <ContractInput 
                                    label={landings.length > 0 && landings.every(l => l.isAccessoriesOnly) ? "Valor Avulsos (Total)" : (landings.some(l => l.isAccessoriesOnly) ? "Valor Patamares / Avulsos" : "Valor Patamares (Total)")} 
                                    value={landingsPrice} 
                                    onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                    type="number"
                                />
                            </div>`;

const uiReplacement = `                            <div className="col-span-2 sm:col-span-1 flex gap-2">
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

c = c.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed states, useEffect, total calculations and UI for Avulsos');
