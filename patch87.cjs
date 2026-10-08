const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    'const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0) + (parseFloat(guardrailPrice) || 0) + (parseFloat(gatePrice) || 0);',
    'const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0) + (parseFloat(guardrailPrice) || 0) + (parseFloat(gatePrice) || 0) + (hasStairSideBar ? (parseFloat(stairSideBarPrice) || 0) : 0);'
);

// Add to the breakdown table in Contract.tsx
const breakdownReplace = `
                                    <p className="flex justify-between"><span>Patamar(es):</span> <span>{formatCurrencyBRL(parseFloat(landingsPrice) || 0)}</span></p>
                                    <p className="flex justify-between"><span>Guarda-Corpo:</span> <span>{formatCurrencyBRL(parseFloat(guardrailPrice) || 0)}</span></p>
                                    <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice) || 0)}</span></p>
`;
const breakdownNew = `
                                    <p className="flex justify-between"><span>Patamar(es):</span> <span>{formatCurrencyBRL(parseFloat(landingsPrice) || 0)}</span></p>
                                    <p className="flex justify-between"><span>Guarda-Corpo:</span> <span>{formatCurrencyBRL(parseFloat(guardrailPrice) || 0)}</span></p>
                                    <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice) || 0)}</span></p>
                                    {hasStairSideBar && <p className="flex justify-between"><span>Barra Lateral:</span> <span>{formatCurrencyBRL(parseFloat(stairSideBarPrice) || 0)}</span></p>}
`;
c = c.replace(breakdownReplace, breakdownNew);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Updated totalStructure and breakdown in Contract.tsx");
