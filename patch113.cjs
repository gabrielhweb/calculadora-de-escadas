const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const stateRegex = /const \[enableInterest, setEnableInterest\] = useState\(false\);/;
c = c.replace(stateRegex, `const [enableInterest, setEnableInterest] = useState(false);
    const [enableSignalInterest, setEnableSignalInterest] = useState(false);
    const [signalInterestValue, setSignalInterestValue] = useState('');
    const [hideSignalInterestLabel, setHideSignalInterestLabel] = useState(false);
    const [signalInstallments, setSignalInstallments] = useState(1);`);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Added signal interest states");
