const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetUI = `<ContractInput 
                                                label="Comp. (cm)" 
                                                value={landing.length.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { length: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Larg. (cm)" 
                                                value={landing.width.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { width: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Preço Base (R$)" 
                                                value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                                onChange={(e: any) => updateLanding(landing.id, { weightPerSqm: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                placeholder={Math.round(((Number(landing.length) || 0) * (Number(landing.width) || 0) / 1000) * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                type="number"
                                            />`;

const replaceUI = `<div className="grid grid-cols-2 gap-3 mt-4">
                                                <ContractInput 
                                                    label="Comp. (cm)" 
                                                    value={landing.length.toString()} 
                                                    onChange={(e: any) => updateLanding(landing.id, { length: parseFloat(e.target.value) })} 
                                                    type="number"
                                                />
                                                <ContractInput 
                                                    label="Larg. (cm)" 
                                                    value={landing.width.toString()} 
                                                    onChange={(e: any) => updateLanding(landing.id, { width: parseFloat(e.target.value) })} 
                                                    type="number"
                                                />
                                                <ContractInput 
                                                    label="Preço Base (R$)" 
                                                    value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                                    onChange={(e: any) => updateLanding(landing.id, { weightPerSqm: parseFloat(e.target.value) })} 
                                                    type="number"
                                                />
                                                <ContractInput 
                                                    label="Chapa (R$)" 
                                                    value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                    placeholder={Math.round(((((Number(landing.length) || 0) + 20) / 100) * (((Number(landing.width) || 0) + 20) / 100)) * 0.00334 * 7850 * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                    onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                    type="number"
                                                />
                                            </div>`;

c = c.replace(targetUI, replaceUI);
fs.writeFileSync('src/pages/Contract.tsx', c);

let l = fs.readFileSync('src/utils/landingPricing.ts', 'utf8');
const targetL = `const area = (num(l.length, 0) * num(l.width, 0)) / 1000;
    const computedChapa = Math.round(area * num(l.weightPerSqm, 29));`;
const replaceL = `const length = num(l.length, 0) + 20;
    const width = num(l.width, 0) + 20;
    const area = (length / 100) * (width / 100);
    const weightKg = area * 0.00334 * 7850;
    const computedChapa = Math.round(weightKg * num(l.weightPerSqm, 29));`;

l = l.replace(targetL, replaceL);
fs.writeFileSync('src/utils/landingPricing.ts', l);

let cg = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');
cg = cg.replace(/Portão \$\{idx \+ 1\}:/g, 'Portão:');
cg = cg.replace(/Guarda-Corpo \$\{idx \+ 1\}:/g, 'Guarda-Corpo:');
cg = cg.replace(/Portão \$\{accIdx\}:/g, 'Portão:');
cg = cg.replace(/Guarda-Corpo \$\{accIdx\}:/g, 'Guarda-Corpo:');
fs.writeFileSync('src/utils/contractGenerator.ts', cg);

console.log('Fixed issue 1, 3, 4');
