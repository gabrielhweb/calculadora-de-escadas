const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

c = c.replace(
    'finalLandingsPrice: number;',
    'finalLandingsPrice: number;\n  hasStairSideBar?: boolean;\n  stairSideBarPrice?: number;'
);

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log("Updated ContractData interface");
