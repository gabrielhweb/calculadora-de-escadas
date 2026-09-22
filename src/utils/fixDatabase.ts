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
        // 1. SMART DEDUPLICATION: CONTRACTS
        const cSnap = await getDocs(query(collection(db, "contracts")));
        const cGroups: Record<string, any[]> = {};
        
        cSnap.docs.forEach(d => {
            const data = d.data();
            const name = (data.clientName || 'Sem Nome').trim().toLowerCase();
            if (!cGroups[name]) cGroups[name] = [];
            cGroups[name].push({ id: d.id, ...data });
        });

        for (const name in cGroups) {
            // Ignore blank drafts if they somehow got here, we'll just deal with real names
            if (name === 'sem nome' || name === '') continue; 
            
            const list = cGroups[name];
            if (list.length > 1) {
                // Score each contract to find the "best" one to keep
                list.forEach(c => {
                    c._score = 0;
                    if (Number(c.totalValue) > 0) c._score += 100;
                    
                    let hasLocation = false;
                    try {
                        const parsed = typeof c.contractData === 'string' ? JSON.parse(c.contractData) : c.contractData;
                        const loc = parsed?.userData?.address || parsed?.location || c.customAddress;
                        if (loc && loc !== 'N/A' && loc.trim() !== '') hasLocation = true;
                    } catch(e){}
                    if (hasLocation) c._score += 50;
                    
                    // Newer gets slight bump
                    c._score += new Date(c.createdAt || 0).getTime() / 100000000000; 
                });
                
                list.sort((a, b) => b._score - a._score); // Highest score first
                
                // Delete all except index 0
                for (let i = 1; i < list.length; i++) {
                    try {
                        await deleteDoc(doc(db, "contracts", list[i].id));
                        deletedCount++;
                    } catch (e: any) {
                        errors.push(`Erro deletar duplicata ${list[i].clientName}: ${e.message}`);
                    }
                }
            }
        }

        // 2. PROCESS REMAINING CONTRACTS
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
                
                // Extract Dimensions and Force them into root
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

        // 3. SMART DEDUPLICATION: PRODUCTION QUEUE
        const qSnap = await getDocs(query(collection(db, "production_queue")));
        const qGroups: Record<string, any[]> = {};
        qSnap.docs.forEach(d => {
            const data = d.data();
            const name = (data.clientName || data.title || 'Sem Nome').trim().toLowerCase();
            if (!qGroups[name]) qGroups[name] = [];
            qGroups[name].push({ id: d.id, ...data });
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
                
                list.sort((a, b) => b._score - a._score); // Highest score first
                
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

        // 4. FIX REMAINING QUEUE ITEMS
        const qSnapRemaining = await getDocs(query(collection(db, "production_queue")));
        const contractsData: Record<string, any> = {};
        const cSnapNew = await getDocs(query(collection(db, "contracts")));
        cSnapNew.forEach(c => { contractsData[c.id] = c.data(); });

        for (const docSnap of qSnapRemaining.docs) {
            const data = docSnap.data();
            try {
                const updates: any = { ...data };
                let val = (Number(data.downPayment) || 0) + (Number(data.balanceDue) || 0);
                
                if (data.contractId && contractsData[data.contractId]) {
                    const contract = contractsData[data.contractId];
                    let cVal = Number(contract.totalValue);
                    if (val === 0 && !isNaN(cVal)) {
                        updates.downPayment = cVal / 2;
                        updates.balanceDue = cVal / 2;
                    }
                    if (!data.deliveryDate && contract.deliveryDate) updates.deliveryDate = contract.deliveryDate;
                    if (!data.location && contract.customAddress) updates.location = contract.customAddress;
                } else {
                    let cVal = Number(data.totalValue);
                    if (val === 0 && !isNaN(cVal)) {
                        updates.downPayment = cVal / 2;
                        updates.balanceDue = cVal / 2;
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
            div.innerHTML = `<h2>${errors.length} Erros Encontrados (Tire foto disso para o suporte):</h2>
            <pre style="white-space: pre-wrap; font-size: 12px; margin-top: 10px;">${errors.join('\\n')}</pre>
            <button style="margin-top:20px; padding: 10px; background: red; color: white;" onclick="this.parentElement.remove()">Fechar</button>`;
            document.body.appendChild(div);
            alert(`Sincronização com erros.\nRegistros consertados: ${successCount}\nDuplicatas apagadas: ${deletedCount}\nVeja a lista vermelha na tela.`);
        } else {
            alert(`TUDO LIMPO! \n\nRegistros corrigidos: ${successCount}\nContratos Duplicados Apagados: ${deletedCount}\nMedidas injetadas!`);
        }
    } catch (e: any) {
        alert("Erro fatal ao tentar iniciar a correção: " + e.message);
        console.error(e);
    }
};
