const fs = require('fs');
let c = fs.readFileSync('src/types.ts', 'utf8');

c = c.replace('isAdendo?: boolean; // NOVO: Define se é um orçamento/contrato avulso (adendo)', 'isAdendo?: boolean; // NOVO: Define se é um orçamento/contrato avulso (adendo)\n  hasStairSideBar?: boolean;\n  stairSideBarPrice?: number;');

fs.writeFileSync('src/types.ts', c);
console.log("types.ts updated");
