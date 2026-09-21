
const fs = require("fs");
let content = fs.readFileSync("src/components/CalculatorForm.tsx", "utf-8");
content = content.replace("const InputField: React.FC<{", "export const InputField: React.FC<{");
fs.writeFileSync("src/components/CalculatorForm.tsx", content);
