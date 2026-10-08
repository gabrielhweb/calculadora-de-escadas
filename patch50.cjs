const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    "import { GuardrailEditor } from '../components/GuardrailEditor';",
    "import { GuardrailEditor } from '../components/GuardrailEditor';\nimport { GuardrailPreview } from '../components/GuardrailPreview';"
);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed imports');
