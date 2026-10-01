const fs = require('fs');

let content = fs.readFileSync('src/utils/aceiteObraGenerator.ts', 'utf8');

const targetStr = "let descricaoEscada = '';\n  if (data.inputData?.isAdendo) {";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, `let descricaoEscada = '';
  if (data.inputData?.quoteType === 'guardrail') {
      descricaoEscada = 'guarda-corpos e/ou portões metálicos avulsos';
  } else if (data.inputData?.isAdendo) {`);
} else {
    // support CRLF
    const targetStr2 = "let descricaoEscada = '';\r\n  if (data.inputData?.isAdendo) {";
    if (content.includes(targetStr2)) {
        content = content.replace(targetStr2, `let descricaoEscada = '';\r\n  if (data.inputData?.quoteType === 'guardrail') {\r\n      descricaoEscada = 'guarda-corpos e/ou portões metálicos avulsos';\r\n  } else if (data.inputData?.isAdendo) {`);
    }
}

fs.writeFileSync('src/utils/aceiteObraGenerator.ts', content, 'utf8');
