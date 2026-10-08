const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetStr = '<ContractInput label="Comprimento" value={totalLength} onChange={(e: any) => setTotalLength(e.target.value)} type="number" />';
const idx = c.indexOf(targetStr);

if (idx !== -1) {
    const endOfBlock = c.indexOf('</>', idx);
    const insertionPoint = c.indexOf(')}', endOfBlock) + 2;
    
    if (insertionPoint > 2) {
        const toInsert = `
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
                        `;
        c = c.substring(0, insertionPoint) + toInsert + c.substring(insertionPoint);
        fs.writeFileSync('src/pages/Contract.tsx', c);
        console.log("Injected Barra Lateral logic safely");
    }
}
