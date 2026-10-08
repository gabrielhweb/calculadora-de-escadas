const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

const regex = /let descriptionTitle = inputData\.quoteType === 'landing'[\s\S]*?return fullText;\s*\};/m;

const replacement = `let descriptionTitle = inputData.quoteType === 'landing' ? "Patamar sob medida em aço carbono" : "Escada articulada lateral em aço carbono";
    let hrHeight = inputData.handrailHeight || 80;
    let handrailDesc = inputData.quoteType === 'landing' ? "" : \`e com corrimão de \${hrHeight} centímetros\`;
    let damperDesc = inputData.quoteType === 'landing' ? "" : \` com \${inputData.dampers} amortecedores de alívio\`;

    let fixationText = "";
    if (inputData.isFixedStair) {
        descriptionTitle = "Escada fixa em aço carbono";
        fixationText = "";
        damperDesc = "";
    } else if (inputData.stairGeometry === 'hide') {
        fixationText = ""; 
    } else if (inputData.stairGeometry && inputData.stairGeometry.includes('Fixação')) {
        fixationText = inputData.stairGeometry.toLowerCase().replace('fixação', 'fixação'); 
    } else {
        if (inputData.wallFixation === 'frontal') {
            fixationText = "fixação FRONTAL";
        } else {
            fixationText = inputData.wallFixation === 'left' 
                ? "fixação na parede ESQUERDA" 
                : "fixação na parede DIREITA";
        }
    }

    const geometryText = (inputData.stairGeometry && !inputData.stairGeometry.includes('Fixação') && inputData.stairGeometry !== 'hide') 
        ? \`, modelo \${inputData.stairGeometry}\` 
        : "";

    if (inputData.hasWheels) {
        descriptionTitle = "Escada articulada com rodinhas em aço carbono";
        damperDesc = ""; 
        const sideMap: Record<string, string> = { 
            left: 'apenas no lado esquerdo', 
            right: 'apenas no lado direito', 
            both: 'nos dois lados' 
        };
        const sideText = sideMap[inputData.handrailSide || 'both'] || 'nos dois lados';
        handrailDesc = \`e com corrimão articulado \${sideText} de \${hrHeight} centímetros\`;
    }

    const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
    const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
    const widthCm = opt.stairWidth;
    
    let text1 = \`\${descriptionTitle} com corte à laser\`;
    if (fixationText) text1 += \`, \${fixationText}\`;
    if (geometryText) text1 += \`\${geometryText}\`;
    if (inputData.quoteType !== 'landing') {
        text1 += \`, com medidas de: \${alturaM} metros de altura, \${compM} metros de comprimento, \${widthCm} centímetros de largura \${handrailDesc}.\`;
    } else {
        text1 += \`, com medidas de: \${alturaM} metros de altura, \${compM} metros de comprimento, \${widthCm} centímetros de largura.\`;
    }

    const stepH = opt.stepHeight.toFixed(2).replace('.', ',');
    const tread = opt.treadDepth.toFixed(2).replace('.', ',');
    
    let materialText = 'de metal';
    if (inputData.treadMaterial === 'wood') {
        if (inputData.woodType === 'garapeira') {
            materialText = 'de madeira (Garapeira)';
        } else if (inputData.woodType === 'muiracatiara') {
            materialText = 'de madeira (Muiracatiara)';
        } else {
            materialText = 'de madeira (Garapeira ou Muiracatiara)';
        }
    } else if (inputData.treadMaterial === 'chapa_xadrez') {
        materialText = 'de chapa xadrez';
    } else if (inputData.treadMaterial === 'chapa_vazada') {
        materialText = 'de chapa vazada';
    }
    
    const degrausLabel = inputData.isFixedStair ? 'degraus fixos' : 'degraus articulados';
    const text2 = \`-Com \${opt.structureSteps} \${degrausLabel} com dimensões de \${stepH} centímetros de altura e pisante \${materialText} de \${tread} centímetros\${damperDesc}.\`;
    
    let fullText = \`\${text1}\\n\\n\${text2}\`;

    return fullText;
};`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/utils.ts', c);
    console.log("Updated generateProposalDescription successfully");
} else {
    console.log("Regex not matched in utils.ts");
}
