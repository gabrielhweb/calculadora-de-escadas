const fs = require('fs');

const calcStr = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');
const contractStr = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

// Find the start of the map in CalculatorForm
const calcStartToken = `{landings.filter(l => !l.isAccessoriesOnly).map((landing, idx) => {`;
let calcStart = calcStr.indexOf(calcStartToken);

const calcEndToken = `); })}`;
let calcEnd = calcStr.indexOf(calcEndToken, calcStart);

let calcBlock = calcStr.substring(calcStart, calcEnd + calcEndToken.length);

calcBlock = calcBlock.replace(/{landings\.filter\(l => !l\.isAccessoriesOnly\)\.map/g, '{landings.filter((l: any) => !l.isAccessoriesOnly).map');
calcBlock = calcBlock.replace(/convertToCm\(stairWidth, widthUnit\)/g, 'parseFloat(width)');

const blockRegex = /\{landings\.filter\(\(l: any\) => !l\.isAccessoriesOnly\)\.map\(\(landing, idx\) => \{[\s\S]*?\)\;[\s\S]*?\}\)\}/;
const contractMatch = contractStr.match(blockRegex);
if (!contractMatch) throw new Error('Regex match for Contract.tsx failed');

let newContractStr = contractStr.replace(blockRegex, calcBlock);

if (!newContractStr.includes('computeLandingPrice')) {
    newContractStr = newContractStr.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from '../utils/landingPricing';");
}
if (!newContractStr.includes('GuardrailPreview')) {
    newContractStr = newContractStr.replace("import { GuardrailEditor } from '../components/GuardrailEditor';", "import { GuardrailEditor } from '../components/GuardrailEditor';\nimport { GuardrailPreview } from '../components/GuardrailPreview';");
}

fs.writeFileSync('src/pages/Contract.tsx', newContractStr);
console.log('Successfully ported Patamar UI from CalculatorForm to Contract');
