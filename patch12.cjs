const fs = require('fs');

let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const target = `  addText(\`-Capacidade máxima por degrau: \${data.stepCapacityText || '180 quilos'}\`, 11, true, 'left');
  addText(\`-Capacidade máxima da escada: \${data.stairCapacityText || '360 quilos'}\`, 11, true, 'left');`;

const replacement = `  if (data.quoteType === 'stair') {
      addText(\`-Capacidade máxima por degrau: \${data.stepCapacityText || '180 quilos'}\`, 11, true, 'left');
      addText(\`-Capacidade máxima da escada: \${data.stairCapacityText || '360 quilos'}\`, 11, true, 'left');
  }`;

c = c.replace(target, replacement);
// fallback for CRLF
c = c.replace(target.replace(/\n/g, '\r\n'), replacement);

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log('Fixed contractGenerator.ts');
