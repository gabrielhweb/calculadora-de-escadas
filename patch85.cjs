const fs = require('fs');
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');

const target = c.substring(c.indexOf('// 3. Preço dos guarda-corpos avulsos'), c.indexOf('return {') - 1);

const replacement = `${target}\n      // 4. Preço da Barra Lateral da Escada\n      if (data.hasStairSideBar && data.stairSideBarPrice) {\n          totalPrice += data.stairSideBarPrice;\n      }\n\n`;

c = c.replace(target, replacement);
fs.writeFileSync('src/pages/Calculator.tsx', c);
console.log("Updated Calculator.tsx");
