const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const regexStructureTotal = /const structureTotal = data\.finalStairPrice \+ data\.finalLandingsPrice;/;
if (c.match(regexStructureTotal)) {
    c = c.replace(regexStructureTotal, `if (data.hasStairSideBar) {
      addText(\`-Escada com Barra Lateral: \${formatCurrencyBRL(data.stairSideBarPrice)}\`, 11, false, 'left');
  }
  
  const structureTotal = data.finalStairPrice + data.finalLandingsPrice + (data.hasStairSideBar ? (data.stairSideBarPrice || 0) : 0);`);
}

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log("Updated contractGenerator.ts");
