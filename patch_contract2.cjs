const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const s1 = '{/* NOVO: CONTROLES DE MATERIAL E DIREÇÃO */}';
let idx1 = c.indexOf(s1);
if (idx1 === -1) idx1 = c.indexOf('{/* NOVO: CONTROLES DE MATERIAL E DIRE');
let end1 = c.indexOf('                    {/* Itens Opcionais / Extras */}', idx1);

if (idx1 !== -1 && end1 !== -1) {
    let before = c.substring(0, idx1);
    let middle = c.substring(idx1, end1);
    let after = c.substring(end1);
    c = before + "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (<>\n                    " + middle.trim() + "\n                    </>)}\n                    " + after;
}

const s2 = '<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 mt-4">';
const title2 = 'Ficha de Produ';
let idx2 = c.indexOf(s2);
if (idx2 !== -1 && c.substring(idx2, idx2 + 300).includes(title2)) {
    let end2 = c.indexOf('<div className="flex flex-col gap-4 mt-2">', idx2);
    if (end2 !== -1) {
        let before = c.substring(0, idx2);
        let middle = c.substring(idx2, end2);
        let after = c.substring(end2);
        c = before + "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (<>\n                        " + middle.trim() + "\n                        </>)}\n                        " + after;
    }
}

fs.writeFileSync('src/pages/Contract.tsx', c);
