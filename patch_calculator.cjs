const fs = require('fs');
let content = fs.readFileSync('src/pages/Calculator.tsx', 'utf8');

if (!content.includes('GuardrailCalculator')) {
    content = content.replace(
        "import CalculatorForm from '../components/CalculatorForm';",
        "import CalculatorForm from '../components/CalculatorForm';\nimport GuardrailCalculator from '../components/GuardrailCalculator';\nimport WeightCalculator from '../components/WeightCalculator';"
    );
}

if (!content.includes('activeTab')) {
    content = content.replace(
        "const [isSaving, setIsSaving] = useState(false);",
        "const [isSaving, setIsSaving] = useState(false);\n  const [activeTab, setActiveTab] = useState<'stair' | 'landing' | 'guardrail' | 'weight'>('stair');"
    );
}

const oldHeader = '<header className="text-center mb-8 flex justify-center relative">\r\n        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Calculadora Oficial</h1>\r\n      </header>';
const oldHeaderAlt = '<header className="text-center mb-8 flex justify-center relative">\n        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Calculadora Oficial</h1>\n      </header>';

const newTabs = `<header className="text-center mb-8 flex flex-col items-center relative">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Central de Calculadoras</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            <button onClick={() => {setActiveTab('stair'); setInputData(null); setOptions([]);}} className={\`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 \${activeTab === 'stair' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}\`}>
                <span className="text-2xl">??</span>
                Escada Completa
            </button>
            <button onClick={() => {setActiveTab('landing'); setInputData(null); setOptions([]);}} className={\`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 \${activeTab === 'landing' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}\`}>
                <span className="text-2xl">??</span>
                Somente Patamar
            </button>
            <button onClick={() => {setActiveTab('guardrail'); setInputData(null); setOptions([]);}} className={\`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 \${activeTab === 'guardrail' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}\`}>
                <span className="text-2xl">??</span>
                Guarda-corpo/Portão
            </button>
            <button onClick={() => {setActiveTab('weight'); setInputData(null); setOptions([]);}} className={\`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 \${activeTab === 'weight' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'}\`}>
                <span className="text-2xl">??</span>
                Cálculo de Peso
            </button>
        </div>
      </header>`;

if (content.includes(oldHeader)) {
    content = content.replace(oldHeader, newTabs);
} else {
    content = content.replace(oldHeaderAlt, newTabs);
}

const oldAside = '<aside>\r\n          <CalculatorForm onCalculate={handleCalculate} />\r\n        </aside>';
const oldAsideAlt = '<aside>\n          <CalculatorForm onCalculate={handleCalculate} />\n        </aside>';

const newAside = `<aside className={activeTab === 'weight' ? 'col-span-full' : ''}>
          {activeTab === 'stair' && <CalculatorForm mode="stair" onCalculate={handleCalculate} />}
          {activeTab === 'landing' && <CalculatorForm mode="landing" onCalculate={handleCalculate} />}
          {activeTab === 'guardrail' && <GuardrailCalculator onCalculate={handleCalculate} />}
          {activeTab === 'weight' && <WeightCalculator />}
        </aside>`;

if (content.includes(oldAside)) {
    content = content.replace(oldAside, newAside);
} else {
    content = content.replace(oldAsideAlt, newAside);
}

const sectionStart = '<section className="flex flex-col relative">';
const newSectionStart = `{activeTab !== 'weight' && (
        <section className="flex flex-col relative">`;

if (content.includes(sectionStart)) {
    content = content.replace(sectionStart, newSectionStart);
    content = content.replace("        </section>\r\n      </main>", "        </section>\r\n        )}\r\n      </main>");
    content = content.replace("        </section>\n      </main>", "        </section>\n        )}\n      </main>");
}

fs.writeFileSync('src/pages/Calculator.tsx', content);
