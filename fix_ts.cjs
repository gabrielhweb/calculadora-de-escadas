const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');
c = c.replace(/inputData\.quoteType \|\| 'stair'/g, "originalInputData?.quoteType || 'stair'");
c = c.replace(/\{ \.\.\.inputData, quoteType: finalQuoteType \}/g, "{ ...(originalInputData as any), quoteType: finalQuoteType }");
fs.writeFileSync('src/pages/Contract.tsx', c);
