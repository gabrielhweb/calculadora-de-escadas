const fs = require('fs');
let c = fs.readFileSync('src/components/GuardrailPreview.tsx', 'utf8');

const regex = /<p className="text-\[10px\] text-pink-500 font-bold mt-2 pt-2 border-t border-pink-100">Afastamento das barras \(folga\): \{gapCm.toFixed\(1\)\}cm<\/p>/;
const replacement = `<p className="text-[10px] text-pink-500 font-bold mt-2 pt-2 border-t border-pink-100 dark:border-pink-900/30">Afastamento das barras (folga): {gapCm.toFixed(1)}cm</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">Comprimento Linear Total: {((length + (length - 4) + (2 * outerHeight) + (numInnerBars * innerHeight)) / 100).toFixed(2)}m</p>`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/components/GuardrailPreview.tsx', c);
    console.log("GuardrailPreview.tsx updated!");
} else {
    console.log("Regex failed for GuardrailPreview.tsx");
}
