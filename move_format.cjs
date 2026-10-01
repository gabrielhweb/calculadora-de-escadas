const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const formatBlockRegex = /<div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">\s*<h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Formato do Contrato \(Texto\)<\/h3>[\s\S]*?<p className="text-xs text-gray-500 mt-2">Escolha se deseja forçar o PDF a omitir a escada principal no texto do objeto contratual.<\/p>\s*<\/div>/;

const match = c.match(formatBlockRegex);
if (match) {
    const formatBlock = match[0];
    c = c.replace(formatBlockRegex, '');
    c = c.replace(/\{\/\* NOVO: CONTROLES DE MATERIAL E DIREÇÃO \*\/\}/, formatBlock + '\n\n                      {/* NOVO: CONTROLES DE MATERIAL E DIREÇÃO */}');
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Moved format block successfully");
} else {
    console.log("Format block not found");
}
