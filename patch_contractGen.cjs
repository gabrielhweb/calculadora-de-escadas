const fs = require('fs');

let content = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const targetStr = "let objText = '';\n  let stepsText = '';\n  if (data.inputData.isAdendo) {";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, `let objText = '';
  let stepsText = '';
  if (data.inputData.quoteType === 'guardrail') {
      objText = 'Guarda-corpos e/ou Portões metálicos fabricados em aço carbono, sob medida.';
      stepsText = '';
  } else if (data.inputData.isAdendo) {`);
} else {
    // support CRLF
    const targetStr2 = "let objText = '';\r\n  let stepsText = '';\r\n  if (data.inputData.isAdendo) {";
    content = content.replace(targetStr2, `let objText = '';\r\n  let stepsText = '';\r\n  if (data.inputData.quoteType === 'guardrail') {\r\n      objText = 'Guarda-corpos e/ou Portões metálicos fabricados em aço carbono, sob medida.';\r\n      stepsText = '';\r\n  } else if (data.inputData.isAdendo) {`);
}

fs.writeFileSync('src/utils/contractGenerator.ts', content, 'utf8');
