const fs = require('fs');
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');

const regex = /\/\/ 4\. Preço da Barra Lateral da Escada\n      if \(data\.hasStairSideBar && data\.stairSideBarPrice\) \{\n          totalPrice \+= data\.stairSideBarPrice;\n      \}\n\n/g;

let matches = c.match(regex);
if (matches && matches.length > 1) {
    c = c.replace(regex, ''); // Replace all
    c = c.replace('// 3. Preço dos guarda-corpos avulsos', '// 3. Preço dos guarda-corpos avulsos\n' + matches[0]); // Put one back
    fs.writeFileSync('src/pages/Calculator.tsx', c);
    console.log("Fixed Calculator.tsx");
} else {
    console.log("No duplicate found");
}
