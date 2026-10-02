const fs = require('fs');

let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const target1 = '{/* AMBIENTE (LAJE/VÃO) */}';
const target2 = '{/* --- SEÇÃO PATAMARES --- */}';

if (c.includes(target1) && c.includes(target2)) {
    c = c.replace(target1, `{mode !== 'landing' && ( <>\n        ${target1}`);
    c = c.replace(target2, `</>\n        )}\n\n        ${target2}`);
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log('Successfully wrapped the section.');
} else {
    console.log('Targets not found!');
}
