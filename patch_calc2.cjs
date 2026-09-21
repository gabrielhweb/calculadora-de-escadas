
const fs = require("fs");
let content = fs.readFileSync("src/components/CalculatorForm.tsx", "utf-8");

const startMarker = "// Soma o pre";
const endMarker = "// Soma o pre";

// Since they are very similar, I will just find the block for Guarda Corpo price calculation
const guardrailStart = content.indexOf("if (landing.hasGuardrail) {", content.indexOf("// Soma o pre"));
const gateStart = content.indexOf("// Soma o pre", guardrailStart + 10);

if (guardrailStart !== -1 && gateStart !== -1) {
    const replacement = `if (landing.hasGuardrail) {
                                                const gFormat = landing.guardrailFormat || "normal";
                                                const numSides = gFormat === "U" ? 3 : gFormat === "L" ? 2 : 1;
                                                const gHeight = landing.guardrailHeight || 90;
                                                const gPricePerMeter = landing.guardrailPricePerMeter !== undefined ? landing.guardrailPricePerMeter : 50;

                                                const calcSegment = (len, override) => {
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

                                                let gTotalMeters = calcSegment(landing.guardrailLength || 0, landing.guardrailBarsOverride);
                                                if (numSides >= 2) gTotalMeters += calcSegment(landing.guardrailLength2 || 0, landing.guardrailBarsOverride2);
                                                if (numSides >= 3) gTotalMeters += calcSegment(landing.guardrailLength3 || 0, landing.guardrailBarsOverride3);
                                                
                                                calculatedPrice += Math.round(gTotalMeters * gPricePerMeter);
                                            }
                                            
                                            `;
    
    // Actually the gate start is where "// Soma o preco do Portaozinho" is.
    // Let"s just do a regex replace
    const regex = /if \(landing\.hasGuardrail\) \{[\s\S]*?(?=\/\/ Soma o pre.* Port.*zinho)/;
    content = content.replace(regex, replacement);
    fs.writeFileSync("src/components/CalculatorForm.tsx", content);
    console.log("Successfully replaced guardrail calculation block.");
}
