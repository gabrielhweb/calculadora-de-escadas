const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(/font-bold text-lg/g, "font-bold text-base");

// Let's also reduce the unit block padding even more!
c = c.replace(/px-3 py-3 border-y-2 text-sm/g, "px-2 py-2 border-y-2 text-xs");
c = c.replace(/p-2 rounded-l-md border-2/g, "p-1.5 px-2 rounded-l-md border-2"); // reduce input padding

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log('Fixed Input CSS');
