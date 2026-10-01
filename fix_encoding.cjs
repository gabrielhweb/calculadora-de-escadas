const fs = require('fs'); 
let c = fs.readFileSync('src/pages/Calculator.tsx', 'utf8'); 
c = c.replace(/<span className="text-2xl">\?\?<\/span>\s*Escada Completa/g, '<span className="text-2xl">🪜</span>\n                  Escada Completa'); 
c = c.replace(/<span className="text-2xl">\?\?<\/span>\s*Somente Patamar/g, '<span className="text-2xl">🔲</span>\n                  Somente Patamar'); 
c = c.replace(/<span className="text-2xl">\?\?<\/span>\s*Guarda-corpo\/Port.o/g, '<span className="text-2xl">🚧</span>\n                  Guarda-corpo/Portão'); 
c = c.replace(/<span className="text-2xl">\?\?<\/span>\s*C.lculo de Peso/g, '<span className="text-2xl">⚖️</span>\n                  Cálculo de Peso'); 
fs.writeFileSync('src/pages/Calculator.tsx', c);
