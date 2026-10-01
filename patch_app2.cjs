const fs = require('fs');

// Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import GuardrailCalculatorPage from './pages/GuardrailCalculatorPage';\n", "");
app = app.replace(/<Route path="\/calculadora-guarda-corpo" element=\{<GuardrailCalculatorPage \/>\} \/>\r?\n/g, "");
fs.writeFileSync('src/App.tsx', app);

// Fix Calculator.tsx WeightCalculator import and usage
let calc = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');
calc = calc.replace(/<WeightCalculator \/>/g, "<WeightCalculator totalSteps={15} stepHeightCm={20} treadDepthCm={25} widthCm={70} totalLengthCm={300} totalHeightCm={300} cutStepType={'left'} landings={[]} onClose={() => {}} />");
fs.writeFileSync('src/pages/Calculator.tsx', calc);

// Also fix GuardrailCalculatorPage in components/GuardrailCalculator.tsx ? We renamed it. No, it should be fine.
