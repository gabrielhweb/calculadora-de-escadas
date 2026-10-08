const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    '<p className="flex justify-between"><span>Patamar (estrutura):</span> <span>{formatCurrencyBRL(getLandingBasePrice(landing) + getFrenchBracketsPrice(landing))}</span></p>',
    '<p className="flex justify-between"><span>Patamar (estrutura):</span> <span>{formatCurrencyBRL(getLandingBasePrice(landing))}</span></p>\n                                                          {landing.hasFrenchBrackets && <p className="flex justify-between"><span>Mão Francesa ({landing.frenchBrackets || 2}un):</span> <span>{formatCurrencyBRL(getFrenchBracketsPrice(landing))}</span></p>}'
);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Separated mao francesa");
