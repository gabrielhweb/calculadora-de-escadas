const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /\{originalInputData\?\.quoteType === 'stair' && \(\s*<div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">\s*<label className="flex items-center gap-2 cursor-pointer mb-2">\s*<input\s*type="checkbox"\s*checked=\{hasStairSideBar\}\s*onChange=\{\(e\) => \{\s*setHasStairSideBar\(e\.target\.checked\);\s*if \(e\.target\.checked && \(!stairSideBarPrice \|\| stairSideBarPrice === '0'\)\) \{\s*setStairSideBarPrice\('498'\);\s*\}\s*\}\}\s*className="w-5 h-5 accent-highlight"\s*\/>\s*<span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Possui Barra Lateral da Escada\?<\/span>\s*<\/label>\s*<\/div>\s*\)\}\s*/g;

let matches = c.match(regex);
if (matches && matches.length > 1) {
    c = c.replace(regex, ''); // Remove all
    c = c.replace(/<div className="grid grid-cols-3 gap-4">\s*<ContractInput label="Total Peças"[^>]+>\s*<ContractInput label="Pisante"[^>]+>\s*<ContractInput label="Comprimento"[^>]+>\s*<\/div>\s*<\/>\s*\)\}/, 
    `<div className="grid grid-cols-3 gap-4">
                                    <ContractInput label="Total Peças" value={totalSteps} onChange={(e: any) => setTotalSteps(e.target.value)} type="number" />
                                    <ContractInput label="Pisante" value={treadDepth} onChange={(e: any) => setTreadDepth(e.target.value)} type="number" />
                                    <ContractInput label="Comprimento" value={totalLength} onChange={(e: any) => setTotalLength(e.target.value)} type="number" />
                                </div>
                            </>
                        )}
                        
                        {computedQuoteType === 'stair' && (
                            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={hasStairSideBar} 
                                        onChange={(e) => {
                                            setHasStairSideBar(e.target.checked);
                                            if (e.target.checked && (!stairSideBarPrice || stairSideBarPrice === '0')) {
                                                setStairSideBarPrice('498');
                                            }
                                        }} 
                                        className="w-5 h-5 accent-highlight"
                                    />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Possui Barra Lateral da Escada?</span>
                                </label>
                            </div>
                        )}
`);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Fixed duplicates");
} else {
    // If not exact match, just string replace the first duplicate manually
    console.log("Regex did not find multiple matches.");
}
