const fs = require('fs');
let c = fs.readFileSync('src/components/GuardrailCalculator.tsx', 'utf8');

c = c.replace(/Port\?o/g, 'Portão');
c = c.replace(/Port\?ozinho/g, 'Portãozinho');
c = c.replace(/or\?ar/g, 'orçar');
c = c.replace(/bot\?es/g, 'botões');
c = c.replace(/r\?pida/g, 'rápida');
c = c.replace(/\?\? Somente Guarda-Corpo & Portão/g, '🚧 Somente Guarda-Corpo & Portão');
c = c.replace(/<span className="text-4xl mb-4 block">\?\?<\/span>/g, '<span className="text-4xl mb-4 block">🚧</span>');
c = c.replace(/Or\?amento/g, 'Orçamento');
c = c.replace(/se\?\?o/g, 'seção');
c = c.replace(/padr\?o/g, 'padrão');
c = c.replace(/op\?\?es/g, 'opções');
c = c.replace(/avalia\?\?o/g, 'avaliação');
c = c.replace(/simula\?\?o/g, 'simulação');
c = c.replace(/conclu\?da/g, 'concluída');
c = c.replace(/voc\?/g, 'você');
c = c.replace(/avançar/g, 'avançar'); // in case
c = c.replace(/n\?mero/g, 'número');
c = c.replace(/vis\?o/g, 'visão');
c = c.replace(/s\?o/g, 'são');
c = c.replace(/n\?o/g, 'não');

fs.writeFileSync('src/components/GuardrailCalculator.tsx', c);
