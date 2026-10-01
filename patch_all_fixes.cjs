const fs = require('fs');

// =========================================================
// FIX 1: InputField - the outer div needs overflow-hidden to prevent truncation
// The problem is the container div doesn't constrain the input width.
// =========================================================
let calc = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

// Fix the outer wrapper of InputField to have min-w-0 and overflow-hidden
calc = calc.replace(
    `<div className="flex items-center shadow-sm">`,
    `<div className="flex items-center shadow-sm overflow-hidden">`
);

// Fix GuardrailEditor call - pass stairWidth
calc = calc.replace(
    'GuardrailEditor landing={landing} updateLanding={updateLanding} InputField={InputField} />}',
    'GuardrailEditor landing={landing} updateLanding={updateLanding} InputField={InputField} stairWidth={convertToCm(stairWidth, widthUnit)} />}'
);

fs.writeFileSync('src/components/CalculatorForm.tsx', calc);
console.log('CalculatorForm patched.');

// =========================================================
// FIX 2: GuardrailEditor - show visual indicator when guardrail is on "frente"
// =========================================================
let ge = fs.readFileSync('src/components/GuardrailEditor.tsx', 'utf8');

// Find the guardrailSide select and add a notice after it
const sideSelectEnd = ge.indexOf('</select>\n                </div>');
const afterSelect = ge.indexOf('</div>', sideSelectEnd);

// Add a visual notice about the front measurement after the side select section
const noticeSnippet = `
                {/* Notice when guardrail is on the front (frente) */}
                {(gFormat === 'normal' ? (landing.guardrailSide || '').toLowerCase().includes('frente') : ['L','U'].includes(gFormat)) && stairWidth > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded text-xs text-orange-800 dark:text-orange-300">
                        <span className="font-bold">⚠️ Lado Frente detectado:</span> O comprimento do guarda-corpo da frente foi calculado como <strong>Largura do Patamar ({landing.width || 0}cm) - (Largura da Escada ({stairWidth}cm) + 10cm) = {Math.max(0, (landing.width || 0) - (stairWidth + 10))}cm</strong> para garantir que a escada consiga abrir.
                    </div>
                )}`;

// Insert the notice after the format selector section
const insertAfter = '</select>\n                </div>\n                <div className="flex-1">';
ge = ge.replace(insertAfter, `</select>\n                </div>${noticeSnippet}\n                <div className="flex-1">`);

fs.writeFileSync('src/components/GuardrailEditor.tsx', ge);
console.log('GuardrailEditor patched.');

// =========================================================
// FIX 3: ContractsList - add payment status badge between client name and contract date
// =========================================================
let cl = fs.readFileSync('src/pages/ContractsList.tsx', 'utf8');

// Find the card header section and add payment status badge
// The card shows: h4 (client name) | edit/delete buttons
// Then below is date, then the status badges
// We need to add payment status right after client name h4

const clientNameH4End = `                                    </h4>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">`;

const clientNameH4EndReplacement = `                                    </h4>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">`;

// Find where contract date is shown and add payment badge before it
// The date section starts with: <div className="text-sm text-gray-500
const dateDiv = `<div className="text-sm text-gray-500 dark:text-gray-400 mb-3">`;
const dateDivReplacement = `<div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {contract.paymentStatus === 'recebido' ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700">💰 Recebido</span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700">⏳ A Receber</span>
                                        )}
                                        {contract.deliveryStatus === 'a_entregar' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700">🚚 A Entregar</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">`;

cl = cl.replace(dateDiv, dateDivReplacement);

fs.writeFileSync('src/pages/ContractsList.tsx', cl);
console.log('ContractsList patched.');
