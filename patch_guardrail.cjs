const fs = require('fs');

let c = fs.readFileSync('src/components/GuardrailCalculator.tsx', 'utf8');

const originalHandleCalculate = `const handleCalculate = () => {
        if (guardrails.length === 0) {
            alert('Adicione pelo menos um guarda-corpo ou portão para orçar.');
            return;
        }
        
        onCalculate({
            quoteType: 'guardrail',
            totalHeight: 0,
            desiredSteps: 0,
            stairWidth: 0,
            treadDepth: 0,
            dampers: 0,
            isAdendo: true,
            optionalItems: [],
            landings: [],
            standaloneGuardrails: guardrails
        });
    };`;

const newHandleCalculate = `const handleCalculate = () => {
        if (guardrails.length === 0) {
            alert('Adicione pelo menos um guarda-corpo ou portão para orçar.');
            return;
        }

        const pricedGuardrails = guardrails.map(g => {
            let calculatedPrice = 0;
            if (g.hasGuardrail) {
                const gFormat = g.guardrailFormat || "normal";
                const numSides = gFormat === "U" ? 3 : gFormat === "L" ? 2 : 1;
                const gHeight = g.guardrailHeight !== undefined ? g.guardrailHeight : 90;
                const gPricePerMeter = g.guardrailPricePerMeter !== undefined ? g.guardrailPricePerMeter : 50;

                const calcSegment = (len: number, override?: number) => {
                    if (!len) return 0;
                    let innerL = len - 6;
                    if (innerL < 0) innerL = 0;
                    const baseGaps = Math.max(1, Math.round(innerL / 15));
                    let totalBars = override !== undefined ? override : (baseGaps + 1);
                    totalBars = Math.max(2, totalBars);
                    let totalVerticalMeters = totalBars * (gHeight / 100);
                    let totalHorizontalMeters = 2 * (len / 100);
                    return totalVerticalMeters + totalHorizontalMeters;
                };

                let p1 = g.guardrailPriceOverride !== undefined ? g.guardrailPriceOverride : Math.round(calcSegment(g.guardrailLength || 0, g.guardrailBarsOverride) * gPricePerMeter);
                let p2 = numSides >= 2 ? (g.guardrailPriceOverride2 !== undefined ? g.guardrailPriceOverride2 : Math.round(calcSegment(g.guardrailLength2 || 0, g.guardrailBarsOverride2) * gPricePerMeter)) : 0;
                let p3 = numSides >= 3 ? (g.guardrailPriceOverride3 !== undefined ? g.guardrailPriceOverride3 : Math.round(calcSegment(g.guardrailLength3 || 0, g.guardrailBarsOverride3) * gPricePerMeter)) : 0;
                
                calculatedPrice += p1 + p2 + p3;
            }
            
            if (g.hasGate) {
                const gateLength = g.gateLength !== undefined ? g.gateLength : 100;
                const gateHeight = g.gateHeight !== undefined ? g.gateHeight : 90;
                const gatePricePerMeter = g.gatePricePerMeter !== undefined ? g.gatePricePerMeter : 50;
                
                let innerL = gateLength - 6;
                if (innerL < 0) innerL = 0;
                const baseGaps = Math.max(1, Math.round(innerL / 15));
                let totalBars = g.gateBarsOverride !== undefined ? g.gateBarsOverride : (baseGaps + 1);
                totalBars = Math.max(2, totalBars);
                let totalVerticalMeters = totalBars * (gateHeight / 100);
                let totalHorizontalMeters = 2 * (gateLength / 100);
                let gateTotalMeters = totalVerticalMeters + totalHorizontalMeters;
                
                calculatedPrice += g.gatePriceOverride !== undefined ? g.gatePriceOverride : Math.round(gateTotalMeters * gatePricePerMeter);
            }
            
            // Treat as an "accessories only" landing so standard pdf generator logic processes it as a landing containing guardrails/gates
            return { ...g, price: calculatedPrice, length: 0, width: 0, isAccessoriesOnly: true };
        });
        
        onCalculate({
            quoteType: 'guardrail',
            totalHeight: 0,
            desiredSteps: 0,
            stairWidth: 0,
            treadDepth: 0,
            dampers: 0,
            isAdendo: true,
            optionalItems: [],
            landings: pricedGuardrails,
            standaloneGuardrails: pricedGuardrails
        });
    };`;

if (c.indexOf('quoteType: \'guardrail\'') >= 0) {
    const regex = /const handleCalculate = \(\) => \{[\s\S]*?onCalculate\(\{[\s\S]*?quoteType: 'guardrail'[\s\S]*?\}\);\s*\};/;
    c = c.replace(regex, newHandleCalculate);
    fs.writeFileSync('src/components/GuardrailCalculator.tsx', c);
    console.log('Fixed GuardrailCalculator.tsx');
} else {
    console.log('Could not match handleCalculate');
}
