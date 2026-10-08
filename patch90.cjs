const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const regex = /<div className="flex gap-4">\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input[^>]+checked=\{landing\.hasSideGuardrail\}[^>]+>\s*<span[^>]+>Barra Lateral<\/span>\s*<\/label>\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input[^>]+checked=\{landing\.hasFrontGuardrail\}[^>]+>\s*<span[^>]+>Barra Frontal<\/span>\s*<\/label>\s*<\/div>/g;

if (c.match(regex)) {
    c = c.replace(regex, '');
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log("Removed Barra Lateral checkboxes successfully from CalculatorForm");
} else {
    console.log("Regex failed in CalculatorForm");
}
