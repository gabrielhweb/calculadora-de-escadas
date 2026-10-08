const fs = require('fs');

let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

const gcTarget = `<ContractInput 
                                                            label="Altura (cm)" 
                                                            value={guardrailHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { guardrailHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                    </div>
                                                </div>`;

const gcReplacement = `<ContractInput 
                                                            label="Altura (cm)" 
                                                            value={guardrailHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { guardrailHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-2 bg-pink-50 dark:bg-pink-900/20 rounded border border-pink-100 dark:border-pink-800 text-center">
                                                    <p className="text-xs text-pink-800 dark:text-pink-300 font-bold uppercase">Preço Calculado: R$ {computeLandingPrice(landing)}</p>
                                                </div>`;

c = c.replace(gcTarget, gcReplacement);


const gateTarget = `<ContractInput 
                                                            label="Altura (cm)" 
                                                            value={gateHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                    </div>
                                                </div>`;

const gateReplacement = `<ContractInput 
                                                            label="Altura (cm)" 
                                                            value={gateHeight.toString()} 
                                                            onChange={(e: any) => updateLanding(landing.id, { gateHeight: parseFloat(e.target.value) || 0 })} 
                                                            type="number"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800 text-center">
                                                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold uppercase">Preço Calculado: R$ {computeLandingPrice(landing)}</p>
                                                </div>`;

c = c.replace(gateTarget, gateReplacement);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log('Added price display to Gate and GC');
