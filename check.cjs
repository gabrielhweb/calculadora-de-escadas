const fs = require('fs');
let ge = fs.readFileSync('src/components/GuardrailEditor.tsx', 'utf8');
const idx = ge.indexOf('Notice when guardrail');
console.log('Notice found:', idx >= 0);
console.log(ge.substring(idx - 100, idx + 700));
