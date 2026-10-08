const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

// Change type="text" back to type="number"
c = c.replace(/unit="R\$"\s*type="text"/g, 'unit="R$"\n                                        type="number"');

// Change the grid around the 4 inputs!
// Right now they are all inside: <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
// I will split them into two grids!
const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <InputField 
                                        label="Comp. (cm)"`;

const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <InputField 
                                        label="Comp. (cm)"`;

// Wait, I can just wrap the last two inputs in their own grid!
const inputsPart = `                                    <InputField 
                                        label="Preço/Peso Base"`;

const newInputsPart = `                                </div>
                                <div className="grid grid-cols-1 gap-3 mt-3">
                                    <InputField 
                                        label="Preço/Peso Base"`;

c = c.replace(inputsPart, newInputsPart);

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log('Fixed calculator grid and spinner');
