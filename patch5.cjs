const fs = require('fs');

let pd = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');
pd = pd.replace("if (!inputData.isAdendo) {\n            const escadaText = `-Valor Escada (${opt.structureSteps} degraus):`;",
                "if (!inputData.isAdendo && inputData.quoteType !== 'landing') {\n            const escadaText = `-Valor Escada (${opt.structureSteps} degraus):`;");

// Remove Capacidade máxima for landing
pd = pd.replace("if (inputData.quoteType !== 'guardrail' && !inputData.isAdendo) {",
                "if (inputData.quoteType !== 'guardrail' && inputData.quoteType !== 'landing' && !inputData.isAdendo) {");

fs.writeFileSync('src/components/ProposalDocument.tsx', pd);

let utils = fs.readFileSync('src/utils.ts', 'utf8');

// For generateProposalDescription, if landing:
utils = utils.replace("let descriptionTitle = \"Escada articulada lateral em aço carbono\";",
                      "let descriptionTitle = inputData.quoteType === 'landing' ? \"Patamar sob medida em aço carbono\" : \"Escada articulada lateral em aço carbono\";");

utils = utils.replace("let handrailDesc = \"e com corrimão de 70 centímetros\";",
                      "let handrailDesc = inputData.quoteType === 'landing' ? \"\" : \"e com corrimão de 70 centímetros\";");

utils = utils.replace("let damperDesc = ` com ${inputData.dampers} amortecedores de alívio`;",
                      "let damperDesc = inputData.quoteType === 'landing' ? \"\" : ` com ${inputData.dampers} amortecedores de alívio`;");

const target = "descriptionTitle += `, com medidas de: ${totalH} metros de altura, ${totalL} metros de comprimento, ${totalW} centímetros de largura ${handrailDesc}.\\n`;";
const replacement = "if (inputData.quoteType === 'landing') {\n        descriptionTitle += `.\\n`;\n    } else {\n        descriptionTitle += `, com medidas de: ${totalH} metros de altura, ${totalL} metros de comprimento, ${totalW} centímetros de largura ${handrailDesc}.\\n`;\n    }";
utils = utils.replace(target, replacement);

const target2 = "descriptionTitle += `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH} centímetros de altura e pisante de ${treadMat} de ${treadD} centímetros${damperDesc}.\\n`;";
const replacement2 = "if (inputData.quoteType !== 'landing') {\n        descriptionTitle += `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH} centímetros de altura e pisante de ${treadMat} de ${treadD} centímetros${damperDesc}.\\n`;\n    }";
utils = utils.replace(target2, replacement2);

fs.writeFileSync('src/utils.ts', utils);
console.log('Fixed proposal texts for landing');
