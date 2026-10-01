const fs = require('fs');

let c = fs.readFileSync('src/components/GuardrailEditor.tsx', 'utf8');

c = c.replace(/interface GuardrailEditorProps \{\s*landing: LandingInfo;/g, "interface GuardrailEditorProps {\n    landing: LandingInfo;\n    stairWidth?: number;");
c = c.replace(/export const GuardrailEditor: React\.FC<GuardrailEditorProps> = \(\{ landing, updateLanding \}\) => \{/g, "export const GuardrailEditor: React.FC<GuardrailEditorProps> = ({ landing, updateLanding, stairWidth = 0 }) => {");

c = c.replace(/getAutoGuardrailLengths\(newFormat, landing\.guardrailSide \|\| "", landing\.width \|\| 0, landing\.length \|\| 0\)/g, 'getAutoGuardrailLengths(newFormat, landing.guardrailSide || "", landing.width || 0, landing.length || 0, stairWidth)');

c = c.replace(/getAutoGuardrailLengths\(gFormat, newSide, landing\.width \|\| 0, landing\.length \|\| 0\)/g, 'getAutoGuardrailLengths(gFormat, newSide, landing.width || 0, landing.length || 0, stairWidth)');

fs.writeFileSync('src/components/GuardrailEditor.tsx', c);

let f = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');
f = f.replace(/getAutoGuardrailLengths\(\s*landing\.guardrailFormat \|\| 'normal',\s*landing\.guardrailSide \|\| '',\s*landing\.width \|\| 0,\s*landing\.length \|\| 0\s*\)/g, "getAutoGuardrailLengths(landing.guardrailFormat || 'normal', landing.guardrailSide || '', landing.width || 0, landing.length || 0, convertToCm(stairWidth, widthUnit))");

f = f.replace(/<GuardrailEditor\s+landing=\{landing\}\s+updateLanding=\{updateLanding\}\s*\/>/g, "<GuardrailEditor landing={landing} updateLanding={updateLanding} stairWidth={convertToCm(stairWidth, widthUnit)} />");

fs.writeFileSync('src/components/CalculatorForm.tsx', f);
