const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

// The block starts with `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">`
// and ends right before `{/* Mão Francesa */}` or `Mão Francesa?`

const targetBlock = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <InputField 
                                        label="Preço da Chapa (R$)" 
                                        value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                        onChange={e => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        className="mb-0"
                                        tooltip="Custo apenas da chapa do patamar."
                                    />
                                    <InputField 
                                        label="Comp. (cm)" 
                                        value={landing.length.toString()} 
                                        onChange={e => updateLanding(landing.id, { length: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="cm" 
                                        className="mb-0"
                                        tooltip="Comprimento do patamar no sentido da subida."
                                    />
                                    <InputField 
                                        label="Larg. (cm)" 
                                        value={landing.width.toString()} 
                                        onChange={e => updateLanding(landing.id, { width: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="cm" 
                                        className="mb-0"
                                        tooltip="Largura lateral do patamar."
                                    />
                                    <div className="col-span-1">
                                        <InputField 
                                            label="Preço/Peso Base" 
                                            value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                            onChange={e => updateLanding(landing.id, { weightPerSqm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                            unit="R$" 
                                            className="mb-0"
                                            tooltip="Valor base para cálculo automático (R$ 29/kg padrão)."
                                        />
                                    </div>
                                </div>`;

const newBlock = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <InputField 
                                        label="Comp. (cm)" 
                                        value={landing.length.toString()} 
                                        onChange={e => updateLanding(landing.id, { length: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="cm" 
                                        className="mb-0"
                                        tooltip="Comprimento do patamar no sentido da subida."
                                    />
                                    <InputField 
                                        label="Larg. (cm)" 
                                        value={landing.width.toString()} 
                                        onChange={e => updateLanding(landing.id, { width: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="cm" 
                                        className="mb-0"
                                        tooltip="Largura lateral do patamar."
                                    />
                                    <InputField 
                                        label="Preço/Peso Base" 
                                        value={landing.weightPerSqm !== undefined ? landing.weightPerSqm.toString() : '29'} 
                                        onChange={e => updateLanding(landing.id, { weightPerSqm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        className="mb-0"
                                        tooltip="Valor base para cálculo automático (R$ 29/kg padrão)."
                                    />
                                    <InputField 
                                        label="Preço da Chapa (R$)" 
                                        value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                        onChange={e => updateLanding(landing.id, { chapaPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} 
                                        unit="R$" 
                                        className="mb-0"
                                        tooltip="Custo apenas da chapa do patamar."
                                    />
                                </div>`;

if (c.includes(targetBlock)) {
    c = c.replace(targetBlock, newBlock);
} else if (c.includes(targetBlock.replace(/\n/g, '\r\n'))) {
    c = c.replace(targetBlock.replace(/\n/g, '\r\n'), newBlock);
} else {
    // If exact match fails, let's use a regex to find the block
    const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">[\s\S]*?<InputField\s+label="Preço da Chapa \(R\$\)"[\s\S]*?<\/div>\s*<\/div>/;
    c = c.replace(regex, newBlock);
}

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log('Fixed CalculatorForm layout');
