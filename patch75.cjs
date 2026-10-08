const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const importRegex = /import \{ computeLandingPrice \} from '\.\.\/utils\/landingPricing';/;
if (c.match(importRegex)) {
    c = c.replace(importRegex, `import { computeLandingPrice, getLandingBasePrice, getGuardrailPrice, getGatePrice, getFrenchBracketsPrice } from '../utils/landingPricing';`);
} else {
    console.log("Import regex failed!");
}

const blockRegex = /<div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900\/20 rounded border border-blue-100 dark:border-blue-800 text-center">\s*<p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase">Preço Total Deste Patamar Completo<\/p>\s*<p className="text-lg font-black text-blue-900 dark:text-blue-100">R\$ \{computeLandingPrice\(landing\)\}<\/p>\s*<\/div>/g;

const newBlock = `<div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
                                                        Resumo do Patamar
                                                    </h4>
                                                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                        <p className="flex justify-between"><span>Patamar (estrutura):</span> <span>{formatCurrencyBRL(getLandingBasePrice(landing) + getFrenchBracketsPrice(landing))}</span></p>
                                                        {landing.hasGuardrail && <p className="flex justify-between"><span>Guarda-Corpo:</span> <span>{formatCurrencyBRL(getGuardrailPrice(landing))}</span></p>}
                                                        {landing.hasGate && <p className="flex justify-between"><span>Portão:</span> <span>{formatCurrencyBRL(getGatePrice(landing))}</span></p>}
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 font-bold text-blue-700 dark:text-blue-300 flex justify-between items-center">
                                                        <span className="text-xs uppercase">Total Deste Patamar:</span>
                                                        <span className="text-sm">R$ {computeLandingPrice(landing)}</span>
                                                    </div>
                                                </div>`;

if (c.match(blockRegex)) {
    c = c.replace(blockRegex, newBlock);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Patamar Breakdown applied successfully to Contract.tsx!");
} else {
    console.log("Block regex failed!");
}
