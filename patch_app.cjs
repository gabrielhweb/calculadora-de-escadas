const fs = require('fs');

// Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import GuardrailCalculatorPage from './pages/GuardrailCalculatorPage';\n", "");
app = app.replace(/<Route path="\/guardrail" element=\{<GuardrailCalculatorPage \/>\} \/>\r?\n/g, "");
fs.writeFileSync('src/App.tsx', app);

// Fix Calculator.tsx import
let calc = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');
calc = calc.replace("import WeightCalculator from '../components/WeightCalculator';", "import { WeightCalculator } from '../components/WeightCalculator';");
fs.writeFileSync('src/pages/Calculator.tsx', calc);
