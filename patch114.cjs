const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /const hybridEntryPix = [\s\S]*?const totalGeralFinal = \(paymentMethod === 'hybrid' \? hybridEntryPix : 0\) \+ totalFinanciadoReal;/m;

const replacement = `const hybridEntryPix = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent / 100));
    const baseAmountForCard = paymentMethod === 'hybrid' 
        ? Math.max(0, discountedBase - hybridEntryPix)
        : discountedBase;

    const signalInterestMoney = enableSignalInterest ? (parseFloat(signalInterestValue.replace(',', '.')) || 0) : 0;
    const signalTotal = hybridEntryPix + signalInterestMoney;
    const signalInstallmentVal = signalTotal / (signalInstallments || 1);

    const interestMoney = enableInterest ? (parseFloat(interestValue.replace(',', '.')) || 0) : 0;
    const totalFinanciadoReal = baseAmountForCard + interestMoney;
    const finalInstallmentVal = totalFinanciadoReal / (installments || 1);
    
    const totalGeralFinal = (paymentMethod === 'hybrid' ? signalTotal : 0) + totalFinanciadoReal;`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Updated math block");
} else {
    console.log("Regex not matched");
}
