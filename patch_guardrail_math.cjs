const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(/export const getAutoGuardrailLengths = \(format: string, sideStr: string, width: number, length: number\) => \{/, "export const getAutoGuardrailLengths = (format: string, sideStr: string, width: number, length: number, stairWidth: number = 0) => {");

c = c.replace(/if \(format === 'L'\) \{\s*l1 = width \|\| 0;\s*l2 = length \|\| 0;\s*\} else if \(format === 'U'\) \{\s*l1 = length \|\| 0;\s*l2 = width \|\| 0;\s*l3 = length \|\| 0;\s*\} else \{\s*if \(\(sideStr \|\| ''\)\.toLowerCase\(\)\.includes\('frente'\) \|\| \(sideStr \|\| ''\)\.toLowerCase\(\)\.includes\('atr.s'\)\) \{\s*l1 = width \|\| 0;\s*\} else \{\s*l1 = length \|\| 0;\s*\}\s*\}/, `const sLower = (sideStr || '').toLowerCase();\n    let w = width || 0;\n    if (stairWidth > 0 && sLower.includes('frente')) { w = Math.max(0, width - (stairWidth + 10)); }\n\n    if (format === 'L') { l1 = sLower.includes('frente') ? w : (width || 0); l2 = length || 0; } else if (format === 'U') { l1 = length || 0; l2 = sLower.includes('frente') ? w : (width || 0); l3 = length || 0; } else { if (sLower.includes('frente') || sLower.includes('atrás') || sLower.includes('atras')) { l1 = sLower.includes('frente') ? w : (width || 0); } else { l1 = length || 0; } }`);

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
