const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const s1 = c.indexOf('<p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Opções Adicionais:</p>');
const s2 = c.indexOf('</div>', c.indexOf('Barra Frontal</span>') + 20) + 6;

if (s1 !== -1 && s2 !== -1) {
    let blockStart = c.lastIndexOf('<div', s1);
    c = c.substring(0, blockStart) + c.substring(s2);
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log("Removed from CalculatorForm!");
} else {
    console.log("Not found in CalculatorForm!");
}
