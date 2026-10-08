const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(/parseFloat\(landing\.length\) \|\| 0/g, "Number(landing.length) || 0");
c = c.replace(/parseFloat\(landing\.width\) \|\| 0/g, "Number(landing.width) || 0");

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed TS Error');
