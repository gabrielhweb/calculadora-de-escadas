const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /\{hasStairSideBar && \(\s*<ContractInput\s*label="V\. Barra Lateral"\s*value=\{stairSideBarPrice\}\s*onChange=\{\(e: any\) => setStairSideBarPrice\(e\.target\.value\)\}\s*type="number"\s*\/>\s*\)\}/g;

let matches = c.match(regex);
if (matches && matches.length > 1) {
    c = c.replace(regex, ''); // Remove all
    // Add it exactly ONCE back, right after setGuardrailPrice
    const anchor = `<ContractInput 
                                label="V. Guarda-Corpo" 
                                value={guardrailPrice} 
                                onChange={(e: any) => setGuardrailPrice(e.target.value)} 
                                type="number"
                            />`;
    c = c.replace(anchor, `${anchor}
                            {hasStairSideBar && (
                                <ContractInput 
                                    label="V. Barra Lateral" 
                                    value={stairSideBarPrice} 
                                    onChange={(e: any) => setStairSideBarPrice(e.target.value)} 
                                    type="number"
                                />
                            )}`);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Fixed duplicate Barra Lateral input in Contract.tsx");
} else {
    console.log("No duplicate found");
}
