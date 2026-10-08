const fs = require('fs');
let c = fs.readFileSync('src/utils/landingPricing.ts', 'utf8');

const target = `    // Se o usuário digitou a chapa manualmente (e não está vazio), usa
    if (l.chapaPrice !== undefined && l.chapaPrice !== null && String(l.chapaPrice).trim() !== '') {
        return num(l.chapaPrice, 0);
    }`;

const replacement = `    // Se o usuário digitou a chapa manualmente e for maior que 0, usa
    if (l.chapaPrice !== undefined && l.chapaPrice !== null && String(l.chapaPrice).trim() !== '' && num(l.chapaPrice, 0) > 0) {
        return num(l.chapaPrice, 0);
    }`;

c = c.replace(target, replacement);

fs.writeFileSync('src/utils/landingPricing.ts', c);
console.log('Fixed landingPricing 0 bug');
