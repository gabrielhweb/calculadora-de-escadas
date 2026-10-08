const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    '{parseFloat(gatePrice) > 0 && <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice))}</span></p>}',
    '{parseFloat(gatePrice) > 0 && <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(parseFloat(gatePrice))}</span></p>}\n                                          {(hasStairSideBar && parseFloat(stairSideBarPrice) > 0) && <p className="flex justify-between text-blue-600 dark:text-blue-400"><span>Barra Lateral:</span> <span>{formatCurrencyBRL(parseFloat(stairSideBarPrice))}</span></p>}'
);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Added sidebar to Resumo de Custos in Contract.tsx");
