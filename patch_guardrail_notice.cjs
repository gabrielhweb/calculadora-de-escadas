const fs = require('fs');

// =========================================================
// Add frente notice to GuardrailEditor after the side select div
// =========================================================
let ge = fs.readFileSync('src/components/GuardrailEditor.tsx', 'utf8');

const insertAfter = `                    </select>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">`;

const insertAfterReplacement = `                    </select>
                </div>
            </div>

            {/* Notice when guardrail is on the front (frente) */}
            {(() => {
                const sLower = (landing.guardrailSide || '').toLowerCase();
                const hasFrente = sLower.includes('frente') || gFormat === 'frente';
                if (!hasFrente || stairWidth <= 0) return null;
                const frontW = Math.max(0, (landing.width || 0) - (stairWidth + 10));
                return (
                    <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded text-xs text-orange-800 dark:text-orange-300">
                        <span className="font-bold">⚠️ Frente detectada:</span> Comp. da frente calculado como <strong>Patamar ({landing.width || 0}cm) − (Escada ({stairWidth}cm) + 10) = {frontW}cm</strong> para a escada abrir.
                    </div>
                );
            })()}
            
            <div className="flex flex-wrap gap-2">`;

if (ge.includes(insertAfter)) {
    ge = ge.replace(insertAfter, insertAfterReplacement);
    fs.writeFileSync('src/components/GuardrailEditor.tsx', ge);
    console.log('GuardrailEditor notice added.');
} else {
    console.log('Target not found. Trying alternate...');
    // Try to find where the side select section ends
    const altTarget = `</select>\n                </div>\n            </div>`;
    const altIdx = ge.lastIndexOf('</select>\n                </div>\n            </div>');
    console.log('Alt target at index:', altIdx);
    if (altIdx >= 0) {
        const before = ge.substring(0, altIdx + '</select>\n                </div>\n            </div>'.length);
        const after = ge.substring(altIdx + '</select>\n                </div>\n            </div>'.length);
        ge = before + `

            {/* Notice when guardrail is on the front (frente) */}
            {(() => {
                const sLower = (landing.guardrailSide || '').toLowerCase();
                const hasFrente = sLower.includes('frente') || gFormat === 'frente';
                if (!hasFrente || stairWidth <= 0) return null;
                const frontW = Math.max(0, (landing.width || 0) - (stairWidth + 10));
                return (
                    <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded text-xs text-orange-800 dark:text-orange-300">
                        <span className="font-bold">⚠️ Frente detectada:</span> Comp. da frente calculado como <strong>Patamar ({landing.width || 0}cm) − (Escada ({stairWidth}cm) + 10) = {frontW}cm</strong> para a escada abrir.
                    </div>
                );
            })()}` + after;
        fs.writeFileSync('src/components/GuardrailEditor.tsx', ge);
        console.log('GuardrailEditor notice added via alt.');
    }
}
