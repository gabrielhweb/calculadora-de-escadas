import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query } from 'firebase/firestore';
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
        // 1. FIX CONTRACTS AND REMOVE DUPLICATES
        const cSnap = await getDocs(query(collection(db, "contracts")));
        
        // Find duplicates
        const contractsByNameAndValue: Record<string, any[]> = {};
        cSnap.docs.forEach(d => {
            const data = d.data();
            const clientName = (data.clientName || 'Sem Nome').trim().toLowerCase();
            const key = `${clientName}_${data.totalValue}`;
            if (!contractsByNameAndValue[key]) contractsByNameAndValue[key] = [];
            contractsByNameAndValue[key].push({ id: d.id, ...data });
        });

        // Delete duplicates
        for (const key in contractsByNameAndValue) {
            const list = contractsByNameAndValue[key];
            if (list.length > 1) {
                // sort by createdAt desc
                list.sort((a, b) => {
                    const d1 = new Date(a.createdAt || 0).getTime();
                    const d2 = new Date(b.createdAt || 0).getTime();
                    return d2 - d1;
                });
                
                // Keep the first (newest), delete the rest
                for (let i = 1; i < list.length; i++) {
                    try {
                        await deleteDoc(doc(db, "contracts", list[i].id));
                        deletedCount++;
                    } catch (e: any) {
                        errors.push(`Erro ao deletar duplicada ${list[i].id}: ${e.message}`);
                    }
                }
            }
        }

        // Process remaining contracts
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
                
                // Extract Dimensions and Force them into root to fix Steel calculation
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

                // Firestore doesn't accept undefined values
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

        // 2. FIX PRODUCTION QUEUE
        const qSnap = await getDocs(query(collection(db, "production_queue")));
        const contractsData: Record<string, any> = {};
        const cSnapNew = await getDocs(query(collection(db, "contracts")));
        cSnapNew.forEach(c => { contractsData[c.id] = c.data(); });

        for (const docSnap of qSnap.docs) {
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
