const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /paymentDetails: \{([\s\S]*?)\},/g;
c = c.replace(regex, `paymentDetails: {
                $1,
                enableSignalInterest,
                signalInterestValue: enableSignalInterest ? parseFloat(signalInterestValue.replace(',', '.')) || 0 : 0,
                signalInstallments,
                signalInstallmentValue: signalInstallmentVal,
                hideSignalInterestLabel
            },`);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Updated paymentDetails in Contract.tsx");
