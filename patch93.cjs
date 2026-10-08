const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /<div className="flex gap-4">\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input[^>]+checked=\{landing\.hasSideGuardrail\}[^>]+>\s*<span[^>]+>Barra Lateral<\/span>\s*<\/label>\s*<label className="flex items-center gap-1 cursor-pointer">\s*<input[^>]+checked=\{landing\.hasFrontGuardrail\}[^>]+>\s*<span[^>]+>Barra Frontal<\/span>\s*<\/label>\s*<\/div>/g;

if (c.match(regex)) {
    c = c.replace(regex, '');
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Removed Barra Lateral checkboxes successfully from Contract");
} else {
    // Try the fallback logic
    const s1 = c.indexOf('<div className="flex gap-4">');
    const s2 = c.indexOf('</div>', s1);

    if (s1 !== -1 && s2 !== -1) {
        c = c.substring(0, s1) + c.substring(s2 + 6);
        fs.writeFileSync('src/pages/Contract.tsx', c);
        console.log("Removed Barra Lateral checkboxes successfully from Contract (Fallback)");
    } else {
        console.log("Not found in Contract");
    }
}
