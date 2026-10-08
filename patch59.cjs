const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const targetUI = `<div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2 sm:col-span-1">
                                  <ContractInput 
                                      label="Valor Escada (S/ Patamar)" 
                                      value={stairPrice} 
                                      onChange={(e: any) => setStairPrice(e.target.value)} 
                                      type="number" 
                                  />
                              </div>
                              
                              {/* MOSTRA O TOTAL DE PATAMARES SEPARADO */}
                              <div className="col-span-2 sm:col-span-1">
                                  <div className="flex gap-2">
                                      <div className="flex-1">
                                          <ContractInput 
                                              label="Valor Patamares" 
                                              value={landingsPrice} 
                                              onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                              type="number"
                                          />
                                      </div>
                                      <div className="flex-1">
                                          <ContractInput 
                                              label="V. Guarda-Corpo" 
                                              value={guardrailPrice} 
                                              onChange={(e: any) => setGuardrailPrice(e.target.value)} 
                                              type="number"
                                          />
                                      </div>
                                      <div className="flex-1">
                                          <ContractInput 
                                              label="V. Portão" 
                                              value={gatePrice} 
                                              onChange={(e: any) => setGatePrice(e.target.value)} 
                                              type="number"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>`;

const replaceUI = `<div className="grid grid-cols-2 gap-4">
                              <ContractInput 
                                  label="Valor Escada" 
                                  value={stairPrice} 
                                  onChange={(e: any) => setStairPrice(e.target.value)} 
                                  type="number" 
                              />
                              <ContractInput 
                                  label="Valor Patamares" 
                                  value={landingsPrice} 
                                  onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                  type="number"
                              />
                              <ContractInput 
                                  label="V. Guarda-Corpo" 
                                  value={guardrailPrice} 
                                  onChange={(e: any) => setGuardrailPrice(e.target.value)} 
                                  type="number"
                              />
                              <ContractInput 
                                  label="V. Portão" 
                                  value={gatePrice} 
                                  onChange={(e: any) => setGatePrice(e.target.value)} 
                                  type="number"
                              />
                          </div>`;

if (c.includes(targetUI)) {
    c = c.replace(targetUI, replaceUI);
    fs.writeFileSync('src/pages/Contract.tsx', c);
    console.log("Replaced successfully without regex!");
} else {
    console.log("Could not find the target string!");
}
