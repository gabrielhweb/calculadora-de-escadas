const fs = require('fs');
let c = fs.readFileSync('src/utils/landingPricing.ts', 'utf8');

const getLandingBasePriceTarget = `// Preço só da chapa. Acessório avulso não tem chapa.
export const getLandingBasePrice = (l: LandingInfo) => {
    if (l.isAccessoriesOnly) return 0;
    return num(l.chapaPrice, num(l.price, 0));
};`;

const getLandingBasePriceReplacement = `// Preço só da chapa. Acessório avulso não tem chapa.
export const getLandingBasePrice = (l: LandingInfo) => {
    if (l.isAccessoriesOnly) return 0;
    
    // Se o usuário digitou a chapa manualmente (e não está vazio), usa
    if (l.chapaPrice !== undefined && l.chapaPrice !== null && String(l.chapaPrice).trim() !== '') {
        return num(l.chapaPrice, 0);
    }
    
    // Caso contrário, calcula automaticamente: (Comp * Larg / 1000) * Preço Base
    const area = (num(l.length, 0) * num(l.width, 0)) / 1000;
    const computedChapa = Math.round(area * num(l.weightPerSqm, 29));
    
    // Fallback legado
    if (computedChapa === 0 && num(l.price, 0) > 0) return num(l.price, 0);
    
    return computedChapa;
};`;

c = c.replace(/export const getLandingBasePrice = \(l: LandingInfo\) => \{[\s\S]*?\};/, getLandingBasePriceReplacement);

fs.writeFileSync('src/utils/landingPricing.ts', c);
console.log('Fixed getLandingBasePrice calculation');
