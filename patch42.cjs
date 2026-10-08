const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetChapa = `                                            <ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: parseFloat(e.target.value) || 0 })} 
                                                type="text"
                                            />`;

const replacementChapa = `                                            <ContractInput 
                                                label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : ''} 
                                                placeholder={Math.round((landing.length * landing.width / 1000) * (landing.weightPerSqm !== undefined ? landing.weightPerSqm : 29)).toString()}
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })} 
                                                type="number"
                                            />`;

c = c.replace(targetChapa, replacementChapa);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed chapa input logic');
