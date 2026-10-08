const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(/const numLandings = landings\.length;/g, 'const numLandings = landings.filter(l => !l.isAccessoriesOnly).length;');

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed numLandings in Contract.tsx');
