const fs = require('fs');
let c = fs.readFileSync('src/utils/productionPdfGenerator.ts', 'utf8');

const regex = /doc\.text\('Afastamento \(folga\) das barras: ' \+ gapCm\.toFixed\(1\) \+ 'cm', listX, listY \+ 26\);/;

const replacement = `doc.text('Afastamento (folga) das barras: ' + gapCm.toFixed(1) + 'cm', listX, listY + 26);
            
            doc.setTextColor(79, 70, 229); // Indigo 600
            const totalMeters = (gLength + (gLength - 4) + (2 * outerHeight) + (numInnerBars * innerHeight)) / 100;
            doc.text('Comprimento Linear Total: ' + totalMeters.toFixed(2) + 'm', listX, listY + 31);`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/utils/productionPdfGenerator.ts', c);
    console.log("productionPdfGenerator updated with total length!");
} else {
    console.log("Regex failed for productionPdfGenerator");
}
