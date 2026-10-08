const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const effectCode = `
    // Auto-update landings price whenever landings change, especially for accessories
    useEffect(() => {
        const total = landings.reduce((acc, l) => acc + (l.isAccessoriesOnly ? computeLandingPrice(l) : Number(l.price || 0)), 0);
        setLandingsPrice(total.toFixed(2));
    }, [landings]);
`;

// Insert it right after `// Efeito para recalcular o total de Extras sempre que a lista mudar`
const target = `    // Efeito para recalcular o total de Extras sempre que a lista mudar
    useEffect(() => {
        const totalExtras = optionalItems.reduce((acc, item) => acc + item.price, 0);
        setExtrasPrice(totalExtras.toFixed(2));
    }, [optionalItems]);`;

c = c.replace(target, target + '\n' + effectCode);
fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Added useEffect to auto calculate landings');
