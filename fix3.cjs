const fs = require('fs');
let c = fs.readFileSync('src/pages/ProductionQueuePage.tsx', 'utf8');

c = c.replace(/let percentPaid = 0;[\s\S]*?\(paid \/ item\.value\) \* 100 \: 0;\s*\}/, (match) => {
    return match + '\n                                                let pMethod = "N/A";\n                                                if (item.originalData?.paymentMethod) pMethod = item.originalData.paymentMethod;\n                                                const paymentMethodText = pMethod === "pix" ? " (PIX)" : pMethod === "card" ? " (Cartão)" : pMethod === "hybrid" ? " (Híbrido)" : "";';
});

fs.writeFileSync('src/pages/ProductionQueuePage.tsx', c);
