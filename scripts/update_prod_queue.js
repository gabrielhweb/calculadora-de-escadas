const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/ProductionQueuePage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add computation of real costs inside updateItems
const computeLogic = `
            // COMPUTAR CUSTOS REAIS
            all = all.map(item => {
                let autoCost = 0;
                
                // Calculo de chapas, patamar e tubos
                if (item.originalData?.parsedContractData?.landings) {
                    const STEEL_PRICE_PER_KG = 13.80;
                    const TUBE_PRICE_PER_METER = 10;
                    let totalTubosLinear = 0;
                    let pesoAcoKg = 0;
                    
                    item.originalData.parsedContractData.landings.forEach((l) => {
                        // Guarda-corpo
                        if (l.hasGuardrail) {
                            const numSides = l.guardrailFormat === 'U' ? 3 : l.guardrailFormat === 'L' ? 2 : 1;
                            const totalLinear = (l.guardrailLength || 0) + (numSides >= 2 ? (l.guardrailLength2 || 0) : 0) + (numSides >= 3 ? (l.guardrailLength3 || 0) : 0);
                            const h = l.guardrailHeight || 90;
                            
                            const innerL1 = Math.max(0, (l.guardrailLength || 0) - 6);
                            const t1 = Math.max(2, Math.max(1, Math.round(innerL1 / 15)) + 1);
                            const hL1 = ((h - 6) / 100) * t1;
                            
                            let hL2 = 0;
                            if (numSides >= 2) {
                                const innerL2 = Math.max(0, (l.guardrailLength2 || 0) - 6);
                                const t2 = Math.max(2, Math.max(1, Math.round(innerL2 / 15)) + 1);
                                hL2 = ((h - 6) / 100) * t2;
                            }
                            
                            let hL3 = 0;
                            if (numSides >= 3) {
                                const innerL3 = Math.max(0, (l.guardrailLength3 || 0) - 6);
                                const t3 = Math.max(2, Math.max(1, Math.round(innerL3 / 15)) + 1);
                                hL3 = ((h - 6) / 100) * t3;
                            }
                            
                            const totalVertical = hL1 + hL2 + hL3;
                            const baseLinear = (totalLinear / 100) * 2; // 2 barras horizontais
                            totalTubosLinear += totalVertical + baseLinear;
                        }
                        
                        // Portão
                        if (l.hasGate && l.gateLength > 0 && l.gateHeight > 0) {
                            const gateLen = l.gateLength;
                            const gateH = l.gateHeight;
                            const innerL = Math.max(0, gateLen - 6);
                            const t = Math.max(2, Math.max(1, Math.round(innerL / 15)) + 1);
                            
                            const horiz = (gateLen / 100) * 2;
                            const vert = ((gateH - 6) / 100) * t;
                            totalTubosLinear += horiz + vert;
                        }
                    });
                    
                    // Calcular Peso do Aço (Baseado no WeightCalculator)
                    const pcd = item.originalData.parsedContractData;
                    const STEEL_DENSITY = 7850;
                    const thicknessM = 4.75 / 1000;
                    
                    if (pcd.stairGeometry !== 'hide' && pcd.stairWidth && pcd.treadDepth && pcd.structureSteps) {
                        const stepArea = ((pcd.treadDepth + 6) / 100) * (pcd.stairWidth / 100);
                        const stepsWeight = stepArea * thicknessM * pcd.structureSteps * STEEL_DENSITY;
                        pesoAcoKg += stepsWeight;
                    }
                    
                    if (pcd.landings) {
                        let lArea = 0;
                        pcd.landings.forEach(l => {
                            if (l.hasLanding && l.landingLength > 0 && l.landingWidth > 0) {
                                lArea += ((l.landingLength + 20)/100) * ((l.landingWidth + 20)/100);
                            }
                        });
                        const patamarWeight = lArea * (3.34 / 1000) * STEEL_DENSITY;
                        pesoAcoKg += patamarWeight;
                    }
                    
                    if (pcd.stairGeometry && pcd.stairGeometry.includes('Zigue-Zague')) {
                        const redLine = Math.sqrt(Math.pow(pcd.treadDepth || 0, 2) + Math.pow(pcd.stepHeight || 0, 2));
                        const stringerArea = (redLine / 100) * (15 / 100) * 2; 
                        const stringerWeight = stringerArea * thicknessM * STEEL_DENSITY;
                        pesoAcoKg += stringerWeight;
                    }
                    
                    autoCost += (totalTubosLinear * TUBE_PRICE_PER_METER) + (pesoAcoKg * STEEL_PRICE_PER_KG);
                }

                // Extras + Legacy
                let extraCostsTotal = 0;
                if (item.originalData?.extraCosts) {
                    extraCostsTotal = item.originalData.extraCosts.reduce((acc, c) => acc + (c.total || 0), 0);
                }
                
                let legacyCustomTotal = 0;
                if (item.customCosts) {
                    legacyCustomTotal = item.customCosts.reduce((acc, c) => acc + (c.value || 0), 0);
                }
                
                // Taxes & Commissions
                const val = item.value || 0;
                const taxCost = val * (globalSettings.taxPercentage / 100);
                const commCost = val * (globalSettings.commissionPercentage / 100);
                
                const finalTotalCost = autoCost + extraCostsTotal + legacyCustomTotal + taxCost + commCost;
                const finalProfit = val - finalTotalCost;

                return {
                    ...item,
                    cost: finalTotalCost,
                    profit: finalProfit
                };
            });

            setItems(all);
`;

content = content.replace('setItems(all);', computeLogic);

// Add dependencies to useEffect
content = content.replace('}, [user]);', '}, [user, globalSettings]);');

// Replace the Custom Costs visual section with a button for ExtraCostsModal
const regexCustomCostSection = /\{\/\* Right: Quick Actions \*\/\}[\s\S]*?(?=\{\/\* Payment \*\/\})/g;

const replacementRightSide = \`{/* Right: Quick Actions (Custos Extras) */}
                                                                            <div className="flex-1 flex flex-col border-l border-gray-200 dark:border-gray-700 pl-6">
                                                                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Custos Extras e Material
                                                                                </h4>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                                                                    Adicione gastos adicionais específicos deste contrato (ex: parafusos, selante, frete extra). Esses valores serão debitados do lucro líquido.
                                                                                </p>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setExtraCostsModalItem(item);
                                                                                        setExtraCostsModalOpen(true);
                                                                                    }}
                                                                                    className="bg-highlight hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-6"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                                    </svg>
                                                                                    Lançar Custos Extras
                                                                                </button>
                                                                                
                                                                                <div className="flex-1 flex flex-col mt-2">
                                                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Fotos da Instalação</h4>
                                                                                    <div className="flex gap-2 flex-wrap mb-2">
                                                                                        {item.originalData.installationImages?.map((img: string, i: number) => (
                                                                                            <a key={i} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded border border-gray-300 overflow-hidden block">
                                                                                                <img src={img} alt="Instalação" className="w-full h-full object-cover" />
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors text-sm whitespace-nowrap cursor-pointer text-center">
                                                                                        Anexar Foto
                                                                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={async (e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) {
                                                                                                try {
                                                                                                    const { uploadImage } = await import('../firebaseStorage');
                                                                                                    const url = await uploadImage(file, 'installations');
                                                                                                    const currentImgs = item.originalData.installationImages || [];
                                                                                                    const updatedImgs = [...currentImgs, url];
                                                                                                    
                                                                                                    if (item.source === 'queue') {
                                                                                                        await updateDoc(doc(db, 'production_queue', item.id), { installationImages: updatedImgs });
                                                                                                        if (item.originalData.contractId) {
                                                                                                            await updateDoc(doc(db, 'contracts', item.originalData.contractId), { installationImages: updatedImgs });
                                                                                                        }
                                                                                                    } else if (item.source === 'contract') {
                                                                                                        await updateDoc(doc(db, 'contracts', item.id), { installationImages: updatedImgs });
                                                                                                    }
                                                                                                } catch (err) {
                                                                                                    console.error(err);
                                                                                                    alert('Erro ao anexar foto.');
                                                                                                }
                                                                                            }
                                                                                        }} />
                                                                                    </label>
                                                                                </div>
                                                                            </div>\n\n                                                                            `;

content = content.replace(regexCustomCostSection, replacementRightSide);

// Render the modal at the bottom
if (!content.includes('<ExtraCostsModal')) {
    const modalTag = \`
            {/* Modal de Custos Extras */}
            {extraCostsModalItem && (
                <ExtraCostsModal
                    isOpen={extraCostsModalOpen}
                    item={extraCostsModalItem}
                    onClose={() => setExtraCostsModalOpen(false)}
                    onSave={() => {
                        // The items update loop will automatically re-fetch or apply.
                        // Actually since it updates Firestore, onSnapshot will trigger and re-calculate!
                        setExtraCostsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}\`;
    content = content.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/, modalTag);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
