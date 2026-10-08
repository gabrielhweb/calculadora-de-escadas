const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

// Change type="number" to type="text" to hide arrows
// Wait, if I change InputField type to text globally, we lose number keyboards on mobile!
// Let's just override it for these two inputs!

const basePriceInput = `<InputField 
                                        label="Preço/Peso Base" 
                                        value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                        onChange={e => updateLanding(landing.id, { weightPerSqm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        className="mb-0"
                                        tooltip="Valor base para cálculo automático (R$ 29/kg padrão)."
                                    />`;

const basePriceReplacement = `<InputField 
                                        label="Preço/Peso Base" 
                                        value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                        onChange={e => updateLanding(landing.id, { weightPerSqm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        type="text"
                                        className="mb-0"
                                        tooltip="Valor base para cálculo automático (R$ 29/kg padrão)."
                                    />`;

const chapaPriceInput = `<InputField 
                                        label="Preço da Chapa (R$)" 
                                        value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                        onChange={e => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        className="mb-0"
                                        tooltip="Valor personalizado para este patamar (sobrepõe cálculo base)."
                                    />`;

const chapaPriceReplacement = `<InputField 
                                        label="Preço da Chapa (R$)" 
                                        value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                        onChange={e => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        type="text"
                                        className="mb-0"
                                        tooltip="Valor personalizado para este patamar (sobrepõe cálculo base)."
                                    />`;

c = c.replace(basePriceInput, basePriceReplacement);
c = c.replace(chapaPriceInput, chapaPriceReplacement);

// Also globally reduce the padding of the unit suffix slightly in InputField
c = c.replace(/px-4 py-3 border-y-2/g, "px-3 py-3 border-y-2 text-sm");
c = c.replace(/p-3 rounded-l-md border-2/g, "p-2 rounded-l-md border-2"); // reduce input padding

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log('Fixed InputField CSS and added type text to price fields');
