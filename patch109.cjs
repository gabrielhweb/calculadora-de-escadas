const fs = require('fs');
let c = fs.readFileSync('src/components/ProposalDocument.tsx', 'utf8');

const regex = /let guardText = "";\s*if \(landing\.hasSideGuardrail && landing\.hasFrontGuardrail\) guardText = " \+ Guarda Corpo Lat\/Front";\s*else if \(landing\.hasSideGuardrail\) guardText = " \+ Guarda Corpo Lateral";\s*else if \(landing\.hasFrontGuardrail\) guardText = " \+ Guarda Corpo Frontal";/;

c = c.replace(regex, `let guardText = "";
                if (landing.hasSideGuardrail && landing.hasFrontGuardrail) guardText = " + Guarda Corpo Lat/Front";
                else if (landing.hasSideGuardrail) guardText = " + Guarda Corpo Lateral";
                else if (landing.hasFrontGuardrail) guardText = " + Guarda Corpo Frontal";
                
                if (landing.hasGuardrail) guardText += " + Guarda-Corpo";
                if (landing.hasGate) guardText += " + Portão";`);

fs.writeFileSync('src/components/ProposalDocument.tsx', c);
console.log("Updated ProposalDocument with Gate info");
