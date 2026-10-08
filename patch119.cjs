const fs = require('fs');
let c = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

const regex1 = /const timingText = isPixOnDelivery[\s\S]*?\: \`via \$\{cashMethodLower\} de entrada\`;/;
const replacement1 = `    const signalInstallments = data.paymentDetails.signalInstallments || 1;
          const signalInstallmentValue = data.paymentDetails.signalInstallmentValue || 0;
          const totalSinal = signalInstallmentValue * signalInstallments;
          const printSignalInterest = totalSinal > valorPixFinal + 1 && !data.paymentDetails.hideSignalInterestLabel;
          const finalSinalAmount = (totalSinal > valorPixFinal + 1) ? totalSinal : valorPixFinal;
      
          let signalSentence = "";
          if (printSignalInterest) {
              signalSentence = \`\${formatCurrencyBRL(valorPixFinal)} mais juros totalizando \${formatCurrencyBRL(totalSinal)} via \${cashMethodLower} em \${signalInstallments} vezes iguais de \${formatCurrencyBRL(signalInstallmentValue)}\`;
          } else if (signalInstallments > 1) {
              signalSentence = \`\${formatCurrencyBRL(finalSinalAmount)} via \${cashMethodLower} em \${signalInstallments} vezes iguais de \${formatCurrencyBRL(signalInstallmentValue)}\`;
          } else {
              signalSentence = \`\${formatCurrencyBRL(finalSinalAmount)} via \${cashMethodLower}\`;
          }
      
          const timingTextSinal = isPixOnDelivery
              ? \`\${signalSentence} no ato da entrega/retirada\` 
              : \`\${signalSentence} de entrada\`;`;

c = c.replace(regex1, replacement1);

const regex2 = /addText\(\`E o restante de \$\{formatCurrencyBRL\(valorPixFinal\)\} \$\{timingText\}\.\`, 11, false, 'left'\);/g;
c = c.replace(regex2, "addText(`E o restante de ${timingTextSinal}.`, 11, false, 'left');");

const regex3 = /addText\(\`Sendo pago \$\{formatCurrencyBRL\(valorPixFinal\)\} \$\{timingText\}\.\`, 11, false, 'left'\);/g;
c = c.replace(regex3, "addText(`Sendo pago ${timingTextSinal}.`, 11, false, 'left');");

fs.writeFileSync('src/utils/contractGenerator.ts', c);
console.log("Updated contractGenerator hybrid signal sentence");
