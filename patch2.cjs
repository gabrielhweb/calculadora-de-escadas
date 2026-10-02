const fs = require('fs');
let c = fs.readFileSync('src/components/StaircaseVisualizer.tsx', 'utf8');

const oldCode = "{viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />}";
const newCode = "{isGuardrailOnly ? null : (viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />)}\n            {renderGuardrailsPreviews()}";

// Replace all occurrences of oldCode with newCode
c = c.split(oldCode).join(newCode);

fs.writeFileSync('src/components/StaircaseVisualizer.tsx', c);
console.log('Fixed interactive view safely');
