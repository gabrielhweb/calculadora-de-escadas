const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const s = c.indexOf('<InputField \n                                        label="Comp. (cm)"');
console.log(c.substring(s - 500, s + 100));
