const fs = require('fs');
let c = fs.readFileSync('src/components/GuardrailCalculator.tsx', 'utf8');
c = c.replace(
    "className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none ${icon ? 'pl-8' : ''} ${addon ? 'pr-8' : ''}`}",
    "className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none ${icon ? 'pl-8' : ''} ${addon ? 'pr-8' : ''}`}"
);
// Wait, if it didn't match, maybe it was the w-full bg-white without backticks.
c = c.replace(
    "className={w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none  }",
    "className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none ${icon ? 'pl-8' : ''} ${addon ? 'pr-8' : ''}`}"
);
fs.writeFileSync('src/components/GuardrailCalculator.tsx', c);

let d = fs.readFileSync('src/pages/Contract.tsx', 'utf8');
// Fix the unclosed <> issue by just doing a clean replace again.
d = d.replace(/\{originalInputData\?\.quoteType !== 'landing' && originalInputData\?\.quoteType !== 'guardrail' && \(\r?\n<>\r?\n/g, "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n");
d = d.replace(/\{originalInputData\?\.quoteType !== 'landing' && originalInputData\?\.quoteType !== 'guardrail' && \(\r?\n<><div/g, "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n<div");
d = d.replace(/\r?\n\s*<\/>\)\}/g, "\n)}");

// Now apply <> where it ACTUALLY wraps correctly.
const start1 = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n<div className=\"space-y-6";
d = d.replace(start1, "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (<>\n<div className=\"space-y-6");

const end1 = "\n)}\n                    {/* Itens Opcionais";
d = d.replace(end1, "\n</>)}\n                    {/* Itens Opcionais");

const start2 = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n<div className=\"bg-gray-50";
d = d.replace(start2, "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (<>\n<div className=\"bg-gray-50");

const end2 = "\n)}\n                        <div className=\"flex flex-col gap-4 mt-2\">";
d = d.replace(end2, "\n</>)}\n                        <div className=\"flex flex-col gap-4 mt-2\">");

fs.writeFileSync('src/pages/Contract.tsx', d);
