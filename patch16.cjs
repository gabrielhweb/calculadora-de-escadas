const fs = require('fs');

let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

// We need to reorder the 4 fields.
// The easiest way is to extract them using regex and replace their container.

// We know they are inside `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">`
// Let's find that block.

const startStr = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">`;
const endStr = `                                    {/* Mão Francesa */}`;

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    let block = c.substring(startIndex, endIndex);

    // Extract the 4 fields
    const chapaMatch = block.match(/(<InputField\s+label="Preço da Chapa \(R\$\)"[\s\S]*?\/>)/);
    const compMatch = block.match(/(<InputField\s+label="Comp\. \(cm\)"[\s\S]*?\/>)/);
    const largMatch = block.match(/(<InputField\s+label="Larg\. \(cm\)"[\s\S]*?\/>)/);
    const baseMatch = block.match(/(<div className="col-span-1">[\s\S]*?<\/div>\s*<\/div>)/);

    if (chapaMatch && compMatch && largMatch && baseMatch) {
        // Build new block
        const newBlock = `${startStr}
                                      ${compMatch[1]}
                                      ${largMatch[1]}
                                      ${baseMatch[1].replace('</div>\n                                      </div>', '</div>')}
                                      ${chapaMatch[1]}
`;
        
        // Let's refine baseMatch extraction, it might have captured too much.
        const baseMatchBetter = block.match(/(<div className="col-span-1">\s*<InputField\s+label="Preço\/Peso Base"[\s\S]*?<\/div>)/);
        
        if (baseMatchBetter) {
             const newBlockBetter = `${startStr}
                                      ${compMatch[1]}
                                      ${largMatch[1]}
                                      ${baseMatchBetter[1]}
                                      ${chapaMatch[1]}
                                  </div>
`;
            c = c.substring(0, startIndex) + newBlockBetter + c.substring(endIndex);
            fs.writeFileSync('src/components/CalculatorForm.tsx', c);
            console.log('Reordered fields in CalculatorForm');
        } else {
            console.log('Base match better failed');
        }
    } else {
        console.log('Regex match failed');
        console.log('chapa:', !!chapaMatch);
        console.log('comp:', !!compMatch);
        console.log('larg:', !!largMatch);
        console.log('base:', !!baseMatch);
    }
} else {
    console.log('Start or end string not found');
}
