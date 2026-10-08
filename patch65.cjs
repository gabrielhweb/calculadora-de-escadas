const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const sIdx = c.indexOf('<SectionTitle title="4. Pagamento (Item 6)" />');
console.log('Index in Contract.tsx:', sIdx);

let cg = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');
const pIdx = cg.indexOf('Patamar ${patamarIdx}');
console.log('Index in contractGenerator.ts:', pIdx);
