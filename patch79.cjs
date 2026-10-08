const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

const regex = /<div className="col-span-2 sm:col-span-1">\s*<p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Opções Adicionais:<\/p>\s*<div className="flex gap-4">\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input\s*type="checkbox"\s*checked=\{landing\.hasSideGuardrail\}\s*onChange=\{\(e\) => updateLanding\(landing\.id, \{ hasSideGuardrail: e\.target\.checked \}\)\}\s*className="w-4 h-4 accent-blue-600"\s*\/>\s*<span className="text-xs font-medium text-gray-600 dark:text-gray-300">Barra Lateral<\/span>\s*<\/label>\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input\s*type="checkbox"\s*checked=\{landing\.hasFrontGuardrail\}\s*onChange=\{\(e\) => updateLanding\(landing\.id, \{ hasFrontGuardrail: e\.target\.checked \}\)\}\s*className="w-4 h-4 accent-blue-600"\s*\/>\s*<span className="text-xs font-medium text-gray-600 dark:text-gray-300">Barra Frontal<\/span>\s*<\/label>\s*<\/div>\s*<\/div>/g;

if (c.match(regex)) {
    c = c.replace(regex, '');
    fs.writeFileSync('src/components/CalculatorForm.tsx', c);
    console.log("Removed Barra Lateral from CalculatorForm.tsx");
} else {
    console.log("Regex failed in CalculatorForm.tsx");
}
