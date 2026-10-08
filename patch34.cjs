const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(/label="Chapa \(R\$\)"\s*value=\{landing\.chapaPrice !== undefined \? landing\.chapaPrice\.toString\(\) : \(landing\.price !== undefined \? landing\.price\.toString\(\) : '0'\)\}\s*onChange=\{\(e: any\) => updateLanding\(landing\.id, \{ chapaPrice: parseFloat\(e\.target\.value\) \}\)\}\s*type="number"/g, `label="Chapa (R$)" 
                                                value={landing.chapaPrice !== undefined ? landing.chapaPrice.toString() : (landing.price !== undefined ? landing.price.toString() : '0')} 
                                                onChange={(e: any) => updateLanding(landing.id, { chapaPrice: parseFloat(e.target.value) || 0 })} 
                                                type="text"`);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Fixed chapa visibility');
