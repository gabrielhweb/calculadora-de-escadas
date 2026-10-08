const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const s1 = c.indexOf('<div className="flex gap-4">');
const s2 = c.indexOf('</div>', s1);

if (s1 !== -1 && s2 !== -1) {
    c = c.substring(0, s1) + c.substring(s2 + 6);
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log("Removed Barra Lateral checkboxes successfully from CalculatorForm");
} else {
    console.log("Not found in CalculatorForm");
}
