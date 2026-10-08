const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(
    "const [hasWheels, setHasWheels] = useState(false);",
    "const [hasWheels, setHasWheels] = useState(false);\n  const [hasStairSideBar, setHasStairSideBar] = useState(false);\n  const [stairSideBarPrice, setStairSideBarPrice] = useState<string>('498');"
);

c = c.replace(
    /hasWheels\s*:\s*data\.hasWheels\s*\|\|\s*false,/,
    "hasWheels: data.hasWheels || false,\n            hasStairSideBar: data.hasStairSideBar || false,\n            stairSideBarPrice: data.stairSideBarPrice?.toString() || '498',"
);

c = c.replace(
    /setHasWheels\(data\.hasWheels \|\| false\);/,
    "setHasWheels(data.hasWheels || false);\n            setHasStairSideBar(data.hasStairSideBar || false);\n            if (data.stairSideBarPrice) setStairSideBarPrice(data.stairSideBarPrice.toString());"
);

c = c.replace(
    /hasWheels,\n\s*isFixedStair,/,
    "hasWheels,\n            isFixedStair,\n            hasStairSideBar,\n            stairSideBarPrice: hasStairSideBar ? (parseFloat(stairSideBarPrice) || 0) : undefined,"
);

const limitadorRegex = /<p className="text-xs text-gray-500 mt-1">\s*Escolha em qual opção do orçamento o limite será aplicado\.\s*<\/p>\s*<\/div>\s*<\/div>\s*<\/>\s*\)\}/;
if (c.match(limitadorRegex)) {
    c = c.replace(limitadorRegex, `<p className="text-xs text-gray-500 mt-1">
                    Escolha em qual opção do orçamento o limite será aplicado.
                </p>
            </div>
        </div>
        
        {/* --- SEÇÃO BARRA LATERAL --- */}
        <div className="pt-4 mt-4 mb-4">
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border-2 rounded border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
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
                    <div className="flex-1">
                        <InputField 
                            label="Valor da Barra Lateral" 
                            value={stairSideBarPrice} 
                            onChange={(e) => setStairSideBarPrice(e.target.value)} 
                            unit="R$" 
                            className="mb-0"
                        />
                    </div>
                )}
            </div>
        </div>

        </>
        )}`);
}

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
console.log("Updated state in CalculatorForm");
