const fs = require('fs');
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');

c = c.replace(/const stepOptions = \[baseTotalUnits - 1, baseTotalUnits, baseTotalUnits \+ 1\]\.filter\(s => s > 1\);/, `let stepOptions = [baseTotalUnits - 1, baseTotalUnits, baseTotalUnits + 1].filter(s => s > 1);
    if (data.quoteType === 'landing' || data.quoteType === 'guardrail' || (data.isAdendo && baseTotalUnits === 0)) {
        stepOptions = [0];
    }`);

fs.writeFileSync('src/pages/Calculator.tsx', c);
