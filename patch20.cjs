const fs = require('fs');

let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

if (!c.includes('computeLandingPrice')) {
    c = c.replace("import { formatCurrencyBRL } from '../utils';", "import { formatCurrencyBRL } from '../utils';\nimport { computeLandingPrice } from '../utils/landingPricing';");
}
if (!c.includes('GuardrailPreview')) {
    c = c.replace("import { GuardrailEditor } from '../components/GuardrailEditor';", "import { GuardrailEditor } from '../components/GuardrailEditor';\nimport { GuardrailPreview } from '../components/GuardrailPreview';");
}

// Fix sum of validLandings
c = c.replace(
    `const totalL = validLandings.reduce((acc: number, l: LandingInfo) => acc + Number(l.price || 0), 0);`,
    `const totalL = validLandings.reduce((acc: number, l: LandingInfo) => acc + (l.isAccessoriesOnly ? computeLandingPrice(l) : Number(l.price || 0)), 0);`
);

// We need to fix the second sum!
c = c.replace(
    `const totalL = safeLandings.reduce((acc: number, l: LandingInfo) => acc + Number(l.price || 0), 0);`,
    `const totalL = safeLandings.reduce((acc: number, l: LandingInfo) => acc + (l.isAccessoriesOnly ? computeLandingPrice(l) : Number(l.price || 0)), 0);`
);

// We need to fix the PDF generator call so the items have a price!
// Actually, it's easier to just intercept `landings` in `handleSaveContract` and recalculate `price` for accessories!
c = c.replace(
    `const contractData = {`,
    `// Atualiza o preço dos itens avulsos para que vá pro PDF
        const finalLandings = landings.map(l => l.isAccessoriesOnly ? { ...l, price: computeLandingPrice(l) } : l);

        const contractData = {`
);

c = c.replace(
    `landings,`,
    `landings: finalLandings,`
);

// Wait, the state `landings` is what the UI shows. If I update `finalLandings`, I should probably also update `landingsPrice` whenever `landings` changes!
// Let's add an effect to auto-update landingsPrice if they are accessories!

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed reduce and PDF payload for Contract.tsx');
