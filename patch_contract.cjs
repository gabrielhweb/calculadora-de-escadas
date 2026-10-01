const fs = require('fs');

let content = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const startStr1 = '{/* NOVO: CONTROLES DE MATERIAL E DIRE';
let idxStart1 = content.indexOf(startStr1);
let idxEnd1 = content.indexOf('                    {/* Itens Opcionais / Extras */}', idxStart1);

if (idxStart1 !== -1 && idxEnd1 !== -1) {
    let before = content.substring(0, idxStart1);
    let middle = content.substring(idxStart1, idxEnd1);
    let after = content.substring(idxEnd1);
    
    let newMiddle = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n<>\n" + middle + "\n</>\n)}\n                    ";
    content = before + newMiddle + after;
}

const startStr2 = '<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 mt-4">';
const title2 = 'Ficha de Produ';
let idxStart2 = content.indexOf(startStr2);
if (idxStart2 !== -1 && content.substring(idxStart2, idxStart2 + 300).includes(title2)) {
    let idxEnd2 = content.indexOf('<div className="flex flex-col gap-4 mt-2">', idxStart2);
    if (idxEnd2 !== -1) {
        let before = content.substring(0, idxStart2);
        let middle = content.substring(idxStart2, idxEnd2);
        let after = content.substring(idxEnd2);
        
        let newMiddle = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n" + middle + "\n)}\n                        ";
        content = before + newMiddle + after;
    }
}

fs.writeFileSync('src/pages/Contract.tsx', content, 'utf8');
