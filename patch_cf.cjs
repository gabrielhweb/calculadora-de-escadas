
const fs = require("fs");

let content = fs.readFileSync("src/components/CalculatorForm.tsx", "utf-8");

if (!content.includes("GuardrailEditor")) {
    content = content.replace(
        "import { CalculatorInput, OptionalItem, LandingInfo, ReferenceDoor } from '../types';",
        "import { CalculatorInput, OptionalItem, LandingInfo, ReferenceDoor } from '../types';\nimport { GuardrailEditor } from './GuardrailEditor';"
    );
}

const startMarker = "{landing.hasGuardrail && (() => {";
const endMarker = "})()}";

const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    // Find the NEXT occurrence of endMarker AFTER startIndex
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex !== -1) {
        const fullEndIndex = endIndex + endMarker.length;
        const replacement = `{landing.hasGuardrail && <GuardrailEditor landing={landing} updateLanding={updateLanding} InputField={InputField} />}`;
        content = content.substring(0, startIndex) + replacement + content.substring(fullEndIndex);
        fs.writeFileSync("src/components/CalculatorForm.tsx", content);
        console.log("Successfully replaced block in CalculatorForm.tsx");
    } else {
        console.log("Could not find endMarker");
    }
} else {
    console.log("Could not find startMarker");
}
