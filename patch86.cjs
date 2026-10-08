const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    "const [hasWheels, setHasWheels] = useState(false);",
    "const [hasWheels, setHasWheels] = useState(false);\n    const [hasStairSideBar, setHasStairSideBar] = useState(false);\n    const [stairSideBarPrice, setStairSideBarPrice] = useState('0');"
);

c = c.replace(
    "setDampers(String(fallbackInput.dampers || '4'));",
    "setDampers(String(fallbackInput.dampers || '4'));\n                    setHasStairSideBar(!!fallbackInput.hasStairSideBar);\n                    if (fallbackInput.hasStairSideBar && fallbackInput.stairSideBarPrice) setStairSideBarPrice(String(fallbackInput.stairSideBarPrice));"
);

c = c.replace(
    "stairDirection: stairDirection as any,",
    "stairDirection: stairDirection as any,\n                    hasStairSideBar: hasStairSideBar,\n                    stairSideBarPrice: hasStairSideBar ? (parseFloat(stairSideBarPrice) || 0) : undefined,"
);

const renderPoint = c.indexOf('<h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">', c.indexOf('setTotalLength(e.target.value)'));
if (renderPoint !== -1) {
    let divStart = c.lastIndexOf('<div', renderPoint);
    let injection = `
                        {quoteType === 'stair' && (
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
    c = c.substring(0, divStart) + injection + c.substring(divStart);
}

// Now add the price input to the "Valores & Entrega" section
const valPoint = c.indexOf('label="V. Portão"');
if (valPoint !== -1) {
    let inputStart = c.lastIndexOf('<ContractInput', valPoint);
    let inputInject = `
                            {hasStairSideBar && (
                                <ContractInput 
                                    label="V. Barra Lateral" 
                                    value={stairSideBarPrice} 
                                    onChange={(e: any) => setStairSideBarPrice(e.target.value)} 
                                    type="number"
                                />
                            )}
                            `;
    c = c.substring(0, inputStart) + inputInject + c.substring(inputStart);
}

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Updated Contract.tsx");
