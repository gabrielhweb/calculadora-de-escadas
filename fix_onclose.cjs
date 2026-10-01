const fs = require('fs');
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');
c = c.replace(/onClose=\{[^}]+\}/, "onClose={() => setActiveTab('stair')}");
fs.writeFileSync('src/pages/Calculator.tsx', c);
