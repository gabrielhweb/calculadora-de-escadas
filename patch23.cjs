const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetStr = '    }, [optionalItems]);';

const effectCode = `
    // Auto-update landings price whenever landings change, especially for accessories
    useEffect(() => {
        const total = landings.reduce((acc, l) => acc + (l.isAccessoriesOnly ? computeLandingPrice(l) : Number(l.price || 0)), 0);
        setLandingsPrice(total.toFixed(2));
    }, [landings]);
`;

c = c.replace(targetStr, targetStr + effectCode);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Added useEffect to auto calculate landings (take 2)');
