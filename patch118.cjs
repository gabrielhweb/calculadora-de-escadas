const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const regex = /remainderText\?: string; \/\/ NOVO: Texto personalizado para a forma de pagamento do restante/;

c = c.replace(regex, `remainderText?: string; // NOVO: Texto personalizado para a forma de pagamento do restante
        enableSignalInterest?: boolean;
        signalInterestValue?: number;
        signalInstallments?: number;
        signalInstallmentValue?: number;
        hideSignalInterestLabel?: boolean;`);

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log("Updated ContractData type");
