const fs = require('fs');

const calcStr = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');
const contractStr = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

// 1. Get the 3 blocks from CalculatorForm.tsx
const s1 = calcStr.indexOf('{/* --- SEÇÃO PATAMARES --- */}');
const e1 = calcStr.indexOf('{/* --- SEÇÃO PORTÃO AVULSO --- */}');
// find the closing div of PORTÃO AVULSO
let e2 = calcStr.indexOf('</div>', e1);
// Let's actually find the start of the next block. What's after Portão Avulso in CalculatorForm?
// Probably something like `<div className="flex gap-4">` or `Salvar`.
// Let's just grab by regex.
const fullRegex = /\{\/\* --- SEÇÃO PATAMARES --- \*\/\}[\s\S]*?\{\/\* --- SEÇÃO PORTÃO AVULSO --- \*\/\}[\s\S]*?\}\) \}\s*<\/div>\s*<\/div>\s*<\/div>/;

const match = calcStr.match(fullRegex);
if (!match) throw new Error('Could not find the 3 sections in CalculatorForm.tsx');

let replacement = match[0];
// Replacements for Contract.tsx
replacement = replacement.replace(/convertToCm\(stairWidth, widthUnit\)/g, 'parseFloat(width)');
replacement = replacement.replace(/{landings\.filter\(l => !l\.isAccessoriesOnly\)\.map/g, '{landings.filter((l: any) => !l.isAccessoriesOnly).map');
replacement = replacement.replace(/{landings\.filter\(l => l\.isAccessoriesOnly && !l\.hasGate\)\.map/g, '{landings.filter((l: any) => l.isAccessoriesOnly && !l.hasGate).map');
replacement = replacement.replace(/{landings\.filter\(l => l\.isAccessoriesOnly && l\.hasGate\)\.map/g, '{landings.filter((l: any) => l.isAccessoriesOnly && l.hasGate).map');
replacement = replacement.replace(/landings\.filter\(l => !l\.isAccessoriesOnly\)\.length/g, 'landings.filter((l: any) => !l.isAccessoriesOnly).length');
replacement = replacement.replace(/landings\.filter\(l => l\.isAccessoriesOnly && !l\.hasGate\)\.length/g, 'landings.filter((l: any) => l.isAccessoriesOnly && !l.hasGate).length');
replacement = replacement.replace(/landings\.filter\(l => l\.isAccessoriesOnly && l\.hasGate\)\.length/g, 'landings.filter((l: any) => l.isAccessoriesOnly && l.hasGate).length');

// 2. Find the target in Contract.tsx
const targetRegex = /\{\/\* --- SEÇÃO PATAMARES --- \*\/\}[\s\S]*?\{\/\* --- SEÇÃO PORTÃO AVULSO --- \*\/\}[\s\S]*?\}\)\s*\}\s*<\/div>\s*<\/div>/;
const targetMatch = contractStr.match(targetRegex);
if (!targetMatch) {
    // maybe it ends differently in Contract.tsx
    console.log("Could not find the 3 sections in Contract.tsx using regex. Will try manual indexing.");
}

const ts1 = contractStr.indexOf('{/* --- SEÇÃO PATAMARES --- */}');
const ts2 = contractStr.indexOf('{/* {/* LISTA DE ITENS ADICIONAIS EDITÁVEL E COM ADIÇÃO */}');

if (ts1 !== -1 && ts2 !== -1) {
    let newContractStr = contractStr.substring(0, ts1) + replacement + '\n\n                          ' + contractStr.substring(ts2);
    
    if (!newContractStr.includes('computeLandingPrice')) {
        newContractStr = newContractStr.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from '../utils/landingPricing';");
    }
    if (!newContractStr.includes('GuardrailPreview')) {
        newContractStr = newContractStr.replace("import { GuardrailEditor } from '../components/GuardrailEditor';", "import { GuardrailEditor } from '../components/GuardrailEditor';\nimport { GuardrailPreview } from '../components/GuardrailPreview';");
    }

    fs.writeFileSync('src/pages/Contract.tsx', newContractStr);
    console.log('Successfully copied all 3 sections to Contract.tsx');
} else {
    console.log('Indexes not found in Contract.tsx', ts1, ts2);
}
