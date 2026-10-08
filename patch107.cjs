const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const anchor = `{computedQuoteType === 'stair' && (
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
                        )}`;

const replacement = `{computedQuoteType === 'stair' && (
                            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
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
                                {hasStairSideBar && (
                                    <div className="flex-1 w-full md:w-auto">
                                        <ContractInput 
                                            label="Valor da Barra Lateral" 
                                            value={stairSideBarPrice} 
                                            onChange={(e: any) => setStairSideBarPrice(e.target.value)} 
                                            type="number" 
                                        />
                                    </div>
                                )}
                            </div>
                        )}`;

if (c.indexOf(anchor) !== -1) {
    c = c.replace(anchor, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Updated Contract.tsx");
} else {
    console.log("Anchor not found in Contract.tsx");
}
