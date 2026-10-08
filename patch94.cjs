const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');
c = c.replace("{quoteType === 'stair' && (", "{originalInputData?.quoteType === 'stair' && (");
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed quoteType');
