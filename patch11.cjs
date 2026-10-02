const fs = require('fs');

let pd = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');

const targetRegex = /doc\.setFont\('helvetica', 'bold'\);\s*doc\.text\('Capacidade máxima', pageMargin, currentY\);\s*currentY \+= 6;\s*doc\.setFont\('helvetica', 'normal'\);\s*doc\.text\('Por degrau: 180 kg \(cento e oitenta quilogramas\)', pageMargin, currentY\);\s*currentY \+= 6;\s*doc\.text\('Total da escada: 360 kg \(trezentos e sessenta quilogramas\)', pageMargin, currentY\);\s*currentY \+= 10;/;

const replacement = `if (inputData.quoteType === 'stair') {
        doc.setFont('helvetica', 'bold');
        doc.text('Capacidade máxima', pageMargin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.text('Por degrau: 180 kg (cento e oitenta quilogramas)', pageMargin, currentY);
        currentY += 6;
        doc.text('Total da escada: 360 kg (trezentos e sessenta quilogramas)', pageMargin, currentY);
        currentY += 10;
    }`;

if (targetRegex.test(pd)) {
    pd = pd.replace(targetRegex, replacement);
    fs.writeFileSync('src/components/ProposalDocument.tsx', pd);
    console.log('Fixed Capacidade maxima');
} else {
    console.log('Regex did not match');
}
