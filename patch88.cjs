const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const regex = /finalLandingsPrice: \(parseFloat\(landingsPrice\) \|\| 0\) \+ \(parseFloat\(guardrailPrice\) \|\| 0\) \+ \(parseFloat\(gatePrice\) \|\| 0\),/;
const replacement = `finalLandingsPrice: (parseFloat(landingsPrice) || 0) + (parseFloat(guardrailPrice) || 0) + (parseFloat(gatePrice) || 0),
            hasStairSideBar: hasStairSideBar,
            stairSideBarPrice: parseFloat(stairSideBarPrice) || 0,`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Updated Contract.tsx payload for PDF");
} else {
    console.log("Regex failed in Contract.tsx payload");
}
