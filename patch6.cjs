const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(
    "const formData = getFormData();\n      if (!formData) {",
    "const formData = getFormData();\n      if (!formData || (isAdendo && landings.length === 0 && optionalItems.length === 0)) {"
);

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log('Fixed validation');
