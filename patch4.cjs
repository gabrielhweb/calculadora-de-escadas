const fs = require('fs');

let c = fs.readFileSync('src/components/StaircaseVisualizer.tsx', 'utf8');

if (!c.includes("import { LandingPreview }")) {
    c = c.replace("import { GuardrailPreview } from './GuardrailPreview';", "import { GuardrailPreview } from './GuardrailPreview';\nimport { LandingPreview } from './LandingPreview';");
}

const renderGuardrailsFn = `
  const renderGuardrailsPreviews = () => {
      if (!inputData) return null;
      
      const isGuardrailOnly = inputData.quoteType === 'guardrail';
      const isLandingOnly = inputData.quoteType === 'landing';
      
      const allGuardrails: any[] = [];
      const allLandings: any[] = [];
      
      if (inputData.standaloneGuardrails && isGuardrailOnly) {
          inputData.standaloneGuardrails.forEach((g: any, i: number) => {
              if (g.hasGuardrail || g.hasGate) allGuardrails.push({ ...g, idx: i + 1, isLanding: false });
          });
      }
      if (inputData.landings && !isGuardrailOnly) {
          inputData.landings.forEach((l: any, i: number) => {
              allLandings.push({ ...l, idx: i + 1 });
              if (l.hasGuardrail || l.hasGate) allGuardrails.push({ ...l, idx: i + 1, isLanding: true });
          });
      }

      if (allGuardrails.length === 0 && (!isLandingOnly || allLandings.length === 0)) return null;

      return (
          <div className="w-full flex flex-wrap justify-center gap-4 p-4 mt-8 border-t-2 border-dashed border-gray-300">
              
              {isLandingOnly && allLandings.length > 0 && (
                  <div className="w-full flex flex-wrap justify-center gap-4 mb-4">
                      <h3 className="w-full text-center font-bold text-gray-500 mb-2">Projeto de Patamares</h3>
                      {allLandings.map((l, li) => (
                          <div key={\`landing-\${li}\`} className="flex flex-col items-center bg-gray-50 p-2 rounded border border-gray-200" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                              <span className="text-xs font-bold text-gray-600 mb-1">Patamar {l.idx} ({l.width}cm x {l.length}cm)</span>
                              <div className="w-[320px]">
                                  <LandingPreview length={l.length} width={l.width} type={l.type} />
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {allGuardrails.length > 0 && (
                  <div className="w-full flex flex-wrap justify-center gap-4">
                      <h3 className="w-full text-center font-bold text-gray-500 mb-2">Projeto de Guarda-corpos e Portões Inclusos</h3>
                      {allGuardrails.map((g, gi) => {
                          const items = [];
                          const isGate = !!g.hasGate;
                          const format = g.guardrailFormat || 'straight';
                          const numSides = isGate ? 1 : (format === 'U' ? 3 : format === 'L' ? 2 : 1);
                          const titleBase = g.isLanding ? \`Patamar \${g.idx}\` : \`Item \${g.idx}\`;

                          for (let i = 1; i <= numSides; i++) {
                              let len = 0; let bars = 0;
                              if (isGate) {
                                  len = g.gateLength || 0; bars = g.gateBarsOverride || 0;
                              } else {
                                  if (i === 1) { len = g.guardrailLength || 0; bars = g.guardrailBarsOverride || 0; }
                                  else if (i === 2) { len = g.guardrailLength2 || 0; bars = g.guardrailBarsOverride2 || 0; }
                                  else if (i === 3) { len = g.guardrailLength3 || 0; bars = g.guardrailBarsOverride3 || 0; }
                              }
                              const height = isGate ? (g.gateHeight || 0) : (g.guardrailHeight || 90);
                              
                              let title = isGate ? \`\${titleBase} - Portão\` : \`\${titleBase} - Lado \${i}\`;
                              if (len > 0) {
                                  items.push(
                                      <div key={\`\${gi}-\${i}\`} className="flex flex-col items-center bg-gray-50 p-2 rounded border border-gray-200" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                                          <span className="text-xs font-bold text-gray-600 mb-1">{title} ({len}cm x {height}cm)</span>
                                          <div className="w-[320px]">
                                              <GuardrailPreview length={len} height={height} totalBars={bars} isGate={isGate} />
                                          </div>
                                      </div>
                                  );
                              }
                          }
                          return items;
                      })}
                  </div>
              )}
          </div>
      );
  };`;

// replace the old renderGuardrailsPreviews
const matchRender = /const renderGuardrailsPreviews = \(\) => \{[\s\S]*?return items;\s*\}\)\}\s*<\/div>\s*\);\s*\};\s*/;
c = c.replace(matchRender, renderGuardrailsFn + "\n");

// Modify isGuardrailOnly check to include isLandingOnly
c = c.replace("const isGuardrailOnly = inputData?.quoteType === 'guardrail';", "const isGuardrailOnly = inputData?.quoteType === 'guardrail';\n  const isLandingOnly = inputData?.quoteType === 'landing';\n  const hideStairView = isGuardrailOnly || isLandingOnly;");

c = c.replace(/\{!isGuardrailOnly && \(/g, "{!hideStairView && (");

fs.writeFileSync('src/components/StaircaseVisualizer.tsx', c);
console.log('Fixed StaircaseVisualizer.tsx for landings');
