import { collection, getDocs, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../firebase';

const getProp = (obj: any, key: string) => {
    if (!obj) return null;
    if (obj.selectedOption && obj.selectedOption[key] !== undefined && obj.selectedOption[key] !== '') return obj.selectedOption[key];
    if (obj.inputData && obj.inputData[key] !== undefined && obj.inputData[key] !== '') return obj.inputData[key];
    if (obj[key] !== undefined && obj[key] !== '') return obj[key];
    return null;
};

export const fixAllContractsAndQueue = async () => {
    let successCount = 0;
    let deletedCount = 0;
    const errors: string[] = [];

    try {
        // 0. FETCH EVERYTHING
        const quotesSnap = await getDocs(query(collection(db, "saved_quotes")));
        const contractsSnap = await getDocs(query(collection(db, "contracts")));
        const queueSnap = await getDocs(query(collection(db, "production_queue")));

        const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const contracts = contractsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const queue = queueSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

        // 1. MERGE ORPHAN QUOTES INTO CONTRACTS (Cross-Collection Duplicates)
        for (const q of quotes) {
            const qName = (q.clientName || 'sem nome').trim().toLowerCase();
            const matchedContract = contracts.find(c => (c.clientName || 'sem nome').trim().toLowerCase() === qName);
            
            if (matchedContract) {
                let needsUpdate = false;
                const cUpdate: any = { ...matchedContract };

                const qLoc = q.location || q.customAddress;
                const cLoc = cUpdate.location || cUpdate.customAddress;
                if (qLoc && qLoc !== 'N/A' && qLoc.trim() !== '' && (!cLoc || cLoc === 'N/A' || cLoc.trim() === '')) {
                    cUpdate.customAddress = qLoc;
                    cUpdate.location = qLoc;
                    needsUpdate = true;
                }

                if (q.deliveryDate && !cUpdate.deliveryDate) {
                    cUpdate.deliveryDate = q.deliveryDate;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    try {
                        const ref = doc(db, "contracts", matchedContract.id);
                        const toSave = { ...cUpdate };
                        delete toSave.id;
                        await setDoc(ref, toSave, { merge: true });
                        Object.assign(matchedContract, toSave);
                    } catch(e: any) {
                        errors.push(`Erro att contrato com dados do orçamento: ${e.message}`);
                    }
                }

                // Delete duplicate quote
                try {
                    await deleteDoc(doc(db, "saved_quotes", q.id));
                    deletedCount++;
                } catch(e: any) {
                    errors.push(`Erro apagar orçamento duplo: ${e.message}`);
                }
            }
        }

        // 2. DEDUPLICATE CONTRACTS (Smart Name-Based)
        const cGroups: Record<string, any[]> = {};
        contracts.forEach(c => {
            const name = (c.clientName || 'Sem Nome').trim().toLowerCase();
            if (!cGroups[name]) cGroups[name] = [];
            cGroups[name].push(c);
        });

        for (const name in cGroups) {
            if (name === 'sem nome' || name === '') continue; 
            
            const list = cGroups[name];
            if (list.length > 1) {
                list.forEach(c => {
                    c._score = 0;
                    if (Number(c.totalValue) > 0) c._score += 100;
                    
                    let hasLocation = false;
                    try {
                        const parsed = typeof c.contractData === 'string' ? JSON.parse(c.contractData) : c.contractData;
                        const loc = parsed?.userData?.address || parsed?.location || c.customAddress || c.location;
                        if (loc && loc !== 'N/A' && loc.trim() !== '') hasLocation = true;
                    } catch(e){}
                    if (hasLocation) c._score += 50;
                    
                    c._score += new Date(c.createdAt || 0).getTime() / 100000000000; 
                });
                
                list.sort((a, b) => b._score - a._score);
                
                for (let i = 1; i < list.length; i++) {
                    try {
                        await deleteDoc(doc(db, "contracts", list[i].id));
                        deletedCount++;
                    } catch (e: any) {
                        errors.push(`Erro deletar duplicata de contrato ${list[i].clientName}: ${e.message}`);
                    }
                }
            }
        }

        // 3. EXTRACT DIMENSIONS FOR REMAINING CONTRACTS
        const cSnapRemaining = await getDocs(query(collection(db, "contracts")));
        for (const d of cSnapRemaining.docs) {
            const data = d.data();
            try {
                let parsedData: any = {};
                try {
                    parsedData = typeof data.contractData === "string" ? JSON.parse(data.contractData) : data.contractData;
                    while (typeof parsedData === "string") parsedData = JSON.parse(parsedData);
                } catch(e) {}

                let val = data.totalValue;
                if (isNaN(Number(val)) || val === undefined || val === null || val === 0) {
                    if (parsedData?.totalValue) val = parsedData.totalValue;
                    else if (parsedData?.contractData?.totalValue) val = parsedData.contractData.totalValue;
                    else if (parsedData?.contractData?.selectedOption?.totalPrice) val = parsedData.contractData.selectedOption.totalPrice;
                    else if (parsedData?.finalStairPrice) val = (parsedData.finalStairPrice || 0) + (parsedData.finalLandingsPrice || 0);
                }
                val = Number(val) || 0;

                let pcd = parsedData;
                if (pcd?.contractData) {
                    pcd = pcd.contractData;
                    let maxIters = 5;
                    while (typeof pcd === "string" && maxIters > 0) { pcd = JSON.parse(pcd); maxIters--; }
                }
                
                const treadNum = Number(getProp(pcd, 'treadDepth')) || Number(getProp(pcd, 'treadDepthCm')) || Number(getProp(pcd, 'pisante')) || 0;
                const heightNum = Number(getProp(pcd, 'stepHeight')) || Number(getProp(pcd, 'stepHeightCm')) || Number(getProp(pcd, 'altura')) || 0;
                const widthNum = Number(getProp(pcd, 'stairWidth')) || Number(getProp(pcd, 'widthCm')) || Number(getProp(pcd, 'largura')) || 0;
                const stepsNum = Number(getProp(pcd, 'structureSteps')) || Number(getProp(pcd, 'steps')) || Number(getProp(pcd, 'desiredSteps')) || Number(getProp(pcd, 'totalSteps')) || Number(getProp(pcd, 'degraus')) || 0;

                const dataToSave: Record<string, any> = {
                    ...data,
                    totalValue: val,
                    contractData: pcd === undefined ? "" : JSON.stringify(pcd)
                };
                
                if (treadNum > 0) dataToSave.treadDepth = String(treadNum);
                if (heightNum > 0) dataToSave.stepHeight = String(heightNum);
                if (widthNum > 0) dataToSave.stairWidth = String(widthNum);
                if (stepsNum > 0) dataToSave.totalSteps = String(stepsNum);

                Object.keys(dataToSave).forEach(k => {
                    if (dataToSave[k] === undefined) delete dataToSave[k];
                });

                await setDoc(doc(db, "contracts", d.id), dataToSave, { merge: true });
                successCount++;
            } catch (err: any) {
                console.error("Failed to fix contract", d.id, err);
                errors.push(`Contrato ${data.clientName || d.id}: ${err.message}`);
            }
        }

        // 4. AUTO-LINK: CREATE QUEUE ITEMS FOR CONTRACTS THAT DON'T HAVE ONE (AUTO-CORRIGIR VÍNCULO)
        const finalQueueSnap = await getDocs(query(collection(db, "production_queue")));
        const finalQueue = finalQueueSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        const finalContractsSnap = await getDocs(query(collection(db, "contracts")));
        const finalContracts = finalContractsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

        for (const c of finalContracts) {
            // Check if queue item exists for this contract id or exact name
            const hasQueue = finalQueue.find(q => q.contractId === c.id || (q.clientName || '').trim().toLowerCase() === (c.clientName || 'sem nome').trim().toLowerCase());
            
            // Only auto-link if no queue item exists, and it's not explicitly marked as just a quote in status
            if (!hasQueue) {
                try {
                    let tVal = Number(c.totalValue);
                    if (isNaN(tVal)) tVal = 0;
                    
                    const newOrder: any = {
                        contractId: c.id,
                        createdAt: new Date().toISOString(),
                        clientName: c.clientName || 'Sem Nome',
                        deliveryDate: c.deliveryDate || '',
                        downPayment: tVal / 2,
                        balanceDue: tVal / 2,
                        status: 'in_queue',
                        boardStage: 'contrato',
                        location: c.location || c.customAddress || 'N/A',
                        installments: [],
                        paidInstallments: 0
                    };
                    
                    Object.keys(newOrder).forEach(k => {
                        if (newOrder[k] === undefined) delete newOrder[k];
                    });
                    
                    await setDoc(doc(db, 'production_queue', Date.now().toString() + '_' + Math.floor(Math.random()*1000) + '_queue'), newOrder);
                    successCount++;
                } catch (e: any) {
                    errors.push(`Erro criar vínculo auto para ${c.clientName}: ${e.message}`);
                }
            }
        }

        // 5. DEDUPLICATE QUEUE ITEMS
        const qGroups: Record<string, any[]> = {};
        finalQueue.forEach(q => {
            const name = (q.clientName || q.title || 'Sem Nome').trim().toLowerCase();
            if (!qGroups[name]) qGroups[name] = [];
            qGroups[name].push(q);
        });

        for (const name in qGroups) {
            if (name === 'sem nome' || name === '') continue;
            const list = qGroups[name];
            if (list.length > 1) {
                list.forEach(q => {
                    q._score = 0;
                    const val = (Number(q.downPayment) || 0) + (Number(q.balanceDue) || 0);
                    if (val > 0) q._score += 100;
                    if (q.location && q.location !== 'N/A' && q.location.trim() !== '') q._score += 50;
                    if (q.boardStage && q.boardStage !== 'contrato') q._score += 20;
                });
                
                list.sort((a, b) => b._score - a._score);
                
                for (let i = 1; i < list.length; i++) {
                    try {
                        await deleteDoc(doc(db, "production_queue", list[i].id));
                        deletedCount++;
                    } catch (e: any) {
                        errors.push(`Erro deletar fila dupla ${list[i].title}: ${e.message}`);
                    }
                }
            }
        }

        // 6. UPDATE REMAINING QUEUE ITEMS WITH PARENT INFO
        const latestQueueSnap = await getDocs(query(collection(db, "production_queue")));
        for (const docSnap of latestQueueSnap.docs) {
            const data = docSnap.data();
            try {
                const updates: any = { ...data };
                let val = (Number(data.downPayment) || 0) + (Number(data.balanceDue) || 0);
                
                if (data.contractId) {
                    const contract = finalContracts.find(c => c.id === data.contractId);
                    if (contract) {
                        let cVal = Number(contract.totalValue);
                        if (val === 0 && !isNaN(cVal)) {
                            updates.downPayment = cVal / 2;
                            updates.balanceDue = cVal / 2;
                        }
                        if (!data.deliveryDate && contract.deliveryDate) updates.deliveryDate = contract.deliveryDate;
                        if ((!data.location || data.location === 'N/A') && (contract.location || contract.customAddress)) {
                            updates.location = contract.location || contract.customAddress;
                        }
                    }
                }

                Object.keys(updates).forEach(k => {
                    if (updates[k] === undefined) delete updates[k];
                });

                await setDoc(doc(db, "production_queue", docSnap.id), updates, { merge: true });
                successCount++;
            } catch (err: any) {
                console.error("Failed to fix queue item", docSnap.id, err);
                errors.push(`Fila ${data.title || docSnap.id}: ${err.message}`);
            }
        }

        if (errors.length > 0) {
            const div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.zIndex = '9999';
            div.style.background = 'white';
            div.style.padding = '20px';
            div.style.top = '10%';
            div.style.left = '10%';
            div.style.width = '80%';
            div.style.height = '80%';
            div.style.overflow = 'auto';
            div.style.border = '2px solid red';
            div.style.color = 'black';
            div.innerHTML = `<h2>${errors.length} Erros Encontrados:</h2>
            <pre style="white-space: pre-wrap; font-size: 12px; margin-top: 10px;">${errors.join('\\n')}</pre>
            <button style="margin-top:20px; padding: 10px; background: red; color: white;" onclick="this.parentElement.remove()">Fechar</button>`;
            document.body.appendChild(div);
            alert(`Sincronização com erros.\nCorrigidos/Vinculados: ${successCount}\nDuplicatas apagadas: ${deletedCount}`);
        } else {
            alert(`TUDO LIMPO! \n\nRegistros corrigidos/vinculados: ${successCount}\nDuplicatas Apagadas: ${deletedCount}\nSem botões vermelhos agora!`);
        }
    } catch (e: any) {
        alert("Erro fatal ao tentar iniciar a correção: " + e.message);
        console.error(e);
    }
};
