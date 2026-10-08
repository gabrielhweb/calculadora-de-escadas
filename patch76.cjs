const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const regex = /const totalMaoFrancesa = data\.selectedOption\.landings\.reduce\(\(sum: number, l: any\) => sum \+ \(l\.hasFrenchBrackets \? \(l\.frenchBrackets !== undefined \? l\.frenchBrackets : 2\) : 0\), 0\);\s*if \(totalMaoFrancesa > 0\) \{\s*addText\(\`-Quantidade de Mão Francesa: \$\{totalMaoFrancesa\}\`, 11, false, 'left'\);\s*\}/;

if (c.match(regex)) {
    c = c.replace(regex, '');
    fs.writeFileSync('src/utils/contractGenerator.ts', c);
    console.log("Removed Quantidade de Mão Francesa block successfully from contractGenerator!");
} else {
    console.log("Regex failed for Mão Francesa");
}
