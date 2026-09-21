
const fs = require("fs");

let calc = fs.readFileSync("src/components/CalculatorForm.tsx", "utf-8");

// Add import
if (!calc.includes("GuardrailEditor")) {
    calc = calc.replace(
        "import { CalculatorInput, OptionalItem, LandingInfo, ReferenceDoor } from '../types';",
        "import { CalculatorInput, OptionalItem, LandingInfo, ReferenceDoor } from '../types';\nimport { GuardrailEditor } from './GuardrailEditor';"
    );
}

// Find block boundaries
const startStr = "{landing.hasGuardrail && (() => {";
const endStr = "// Soma o preo do Guarda Corpo (se houver)";
// Windows charset issues with "preo" so just look for something safe
const endStrSafe = "// Soma o pre";

const startIndex = calc.indexOf(startStr);
const endIndex = calc.indexOf(endStrSafe);

if (startIndex !== -1 && endIndex !== -1) {
    const before = calc.substring(0, startIndex);
    // Find the end of the block. We know it ends right before "// Soma o preco do Guarda Corpo"
    // Wait, let"s look for the closing of the previous block
    // Actually, I can just slice up to endIndex and see where it ends.
    // The previous block ends with:
    //                                         );
    //                                     })()}
    //                                     
    //                                     <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
    // Wait, the "Soma o pre" is inside the calculation block at the bottom, not the rendering block!
    
}
