const fs = require('fs');

let c = fs.readFileSync('src/pages/DeliveriesTable.tsx', 'utf8');
c = c.replace('const arr = [];', 'const arr: any[] = [];');
fs.writeFileSync('src/pages/DeliveriesTable.tsx', c);

let c2 = fs.readFileSync('src/pages/ProductionQueuePage.tsx', 'utf8');
c2 = c2.replace('{percentPaid >= 100 ? `100% PAGO${paymentMethodText}` : percentPaid > 0 ? `${percentPaid.toFixed(0)}% PAGO${paymentMethodText}` : (paymentMethodText ? `0% PAGO${paymentMethodText}` : \'\')}', '{percentPaid >= 100 ? "100% PAGO" + paymentMethodText : percentPaid > 0 ? `${percentPaid.toFixed(0)}% PAGO` + paymentMethodText : (paymentMethodText ? `0% PAGO` + paymentMethodText : \'\')}');
fs.writeFileSync('src/pages/ProductionQueuePage.tsx', c2);
