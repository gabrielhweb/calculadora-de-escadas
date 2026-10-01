const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(/const handleDiscountPercentChange = \(valStr: string\) => \{\s*const percent = parseFloat\(valStr\) \|\| 0;\s*setDiscountPercent\(percent\);\s*const val = totalGeralBase \* \(percent \/ 100\);\s*setDiscountValue\(val > 0 \? val\.toFixed\(2\) : ''\);\s*\};/, `const handleDiscountPercentChange = (valStr: string) => {
        const percent = parseFloat(valStr) || 0;
        setDiscountPercent(percent);
    };

    useEffect(() => {
        if (discountPercent > 0) {
            const val = totalGeralBase * (discountPercent / 100);
            if (Math.abs(val - (parseFloat(discountValue) || 0)) > 0.01) {
                setDiscountValue(val.toFixed(2));
            }
        }
    }, [totalGeralBase, discountPercent]);`);

fs.writeFileSync('src/pages/Contract.tsx', c);
