const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(/className=\{`w-full p-3 rounded-l-md/g, "className={`flex-1 min-w-0 p-3 rounded-l-md");
c = c.replace(/<input\s+type=\{type\}\s+value=\{value\}\s+onChange=\{onChange\}\s+disabled=\{disabled\}\s+className=\{`w-full/g, "<input type={type} value={value} onChange={onChange} disabled={disabled} className={`flex-1 min-w-0");

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
