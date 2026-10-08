const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');

const regex = /y \+= \(splitInstall2\.length \* 5\) \+ 4;\s*return y;\s*\};/;

c = c.replace(regex, `y += (splitInstall2.length * 5) + 4;
        
        if (inputData?.referenceDoor?.isActive) {
            y += 4;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const doorText = 'Portas e/ou janelas representadas nos desenhos são ilustrativas e pertencem ao cliente, sendo utilizadas apenas como referência de espaço. Não são fabricadas ou fornecidas pela empresa.';
            const splitDoor = doc.splitTextToSize(doorText, pageWidth - (pageMargin * 2));
            doc.text(splitDoor, pageMargin, y);
            y += (splitDoor.length * 5) + 4;
            doc.setFont('helvetica', 'normal'); // reset
        }

        return y;
    };`);

fs.writeFileSync('src/components/ProposalDocument.tsx', c);
console.log("Updated end note via regex");
