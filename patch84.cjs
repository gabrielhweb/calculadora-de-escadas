const fs = require('fs');
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');

const replacement = `      // 3. Preço dos guarda-corpos avulsos
      if (data.standaloneGuardrails) {
          totalPrice += data.standaloneGuardrails.reduce((acc, g) => acc + g.price, 0);
      }

      // 4. Preço da Barra Lateral da Escada
      if (data.hasStairSideBar && data.stairSideBarPrice) {
          totalPrice += data.stairSideBarPrice;
      }`;

const target = `      // 3. Preço dos guarda-corpos avulsos
      if (data.standaloneGuardrails) {
          totalPrice += data.standaloneGuardrails.reduce((acc, g) => acc + g.price, 0);
      }`;

if (c.indexOf(target) !== -1) {
    c = c.replace(target, replacement);
    fs.writeFileSync('src/pages/Calculator.tsx', c);
    console.log("Updated Calculator.tsx with Sidebar price!");
} else {
    console.log("Failed to find target in Calculator.tsx");
}
