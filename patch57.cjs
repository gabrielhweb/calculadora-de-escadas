const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const regex = /<InputField\s*label="Comp\. \(cm\)"[\s\S]*?tooltip="Largura lateral do patamar\."\s*\/>\s*<\/div>\s*<div className="grid grid-cols-1 gap-3 mt-3">/;

const match = c.match(regex);
if (match) {
    c = c.replace(regex, match[0].replace('</div>\n                                <div className="grid grid-cols-1 gap-3 mt-3">', ''));
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log('Fixed CalculatorForm grid');
} else {
    console.log('Regex did not match');
}
