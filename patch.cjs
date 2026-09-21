
const fs = require("fs");

let types = fs.readFileSync("src/types.ts", "utf-8");
if (!types.includes("guardrailLength2")) {
    types = types.replace(
        /guardrailLength\?: number;\s*\/\/.*$/m,
        "guardrailLength?: number;\n  guardrailLength2?: number;\n  guardrailLength3?: number;"
    ).replace(
        /guardrailBarsOverride\?: number;\s*\/\/.*$/m,
        "guardrailBarsOverride?: number;\n  guardrailBarsOverride2?: number;\n  guardrailBarsOverride3?: number;"
    );
    fs.writeFileSync("src/types.ts", types);
}

// Just checking if JS execution works
console.log("Types patched");
