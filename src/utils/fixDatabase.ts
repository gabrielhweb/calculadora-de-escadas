import { collection, getDocs, doc, updateDoc, setDoc, query } from 'firebase/firestore';
import { db } from '../firebase';

const getProp = (obj: any, key: string) => {
    if (!obj) return null;
    if (obj[key] !== undefined) return obj[key];
    if (obj.inputData && obj.inputData[key] !== undefined) return obj.inputData[key];
    if (obj.selectedOption && obj.selectedOption[key] !== undefined) return obj.selectedOption[key];
    return null;
};

export const fixDatabaseCalculations = async () => {
    try {
        console.log("Iniciando varredura de contratos...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        
        let count = 0;
        let errors = 0;

        for (const document of querySnapshot.docs) {
            const data = document.data();
            const parsedData = typeof data.originalData === 'string' ? JSON.parse(data.originalData) : (data.originalData || data);
            
            const steps = getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'degraus');
            const tread = getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'pisante');
            const height = getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'altura');
            const width = getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'largura');

            const treadNum = Number(tread) || 0;
            const heightNum = Number(height) || 0;
            const widthNum = Number(width) || 0;
            const stepsNum = Number(steps) || 0;

            if (treadNum > 0 && heightNum > 0 && widthNum > 0 && stepsNum > 0) {
                // Cálculo Peso Escada
                const thicknessM = 3.0 / 1000;
                const STEEL_DENSITY = 7850;
                const stepAreaM2 = ((treadNum + 6) / 100) * (widthNum / 100);
                const stepsWeight = stepAreaM2 * thicknessM * stepsNum * STEEL_DENSITY;

                // Patamares
                let landingsAreaM2 = 0;
                const landings = getProp(parsedData, 'landings');
                if (landings && landings.length > 0) {
                    landings.forEach((l: any) => {
                        const lLen = (Number(l.length) || 0) + 20;
                        const lWid = (Number(l.width) || 0) + 20;
                        landingsAreaM2 += (lLen * lWid) / 10000;
                    });
                }
                const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;

                // Vigas
                const stepHypotenuseCm = Math.sqrt(Math.pow(treadNum, 2) + Math.pow(heightNum, 2));
                const redLineCm = stepHypotenuseCm * stepsNum;
                const blueLineCm = (treadNum * heightNum) / stepHypotenuseCm;
                const stringerWidthCm = blueLineCm + 16.5;
                const stringerAreaM2 = (redLineCm / 100) * (stringerWidthCm / 100) * 2;
                const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;

                const escadaWeight = stepsWeight + stringerWeight;
                const totalWeightKg = escadaWeight + landingsWeight;
                const escadaCost = escadaWeight * 13.80;
                const landingsCost = landingsWeight * 13.80;
                const totalCost = totalWeightKg * 13.80;

                // Freight
                const optionalItems = getProp(parsedData, 'optionalItems');
                const maxHandrailHeightM = (optionalItems && optionalItems.some((i: any) => i.id === 'corrimao_aco')) ? 0.8 : 0;
                const pontasM = 0.20;
                const stringerWidthM = stringerWidthCm / 100;
                const handrailVerticalCm = maxHandrailHeightM * 100;
                const handrailPerpendicularCm = handrailVerticalCm * (treadNum / stepHypotenuseCm);
                const handrailCm = maxHandrailHeightM > 0 ? 80 : 0;
                const pacoteLarguraM = ((treadNum + 1) + handrailCm + 16.5) / 100;
                const pacoteAlturaM = 0.08;
                const comprimentoMaximoM = (treadNum * stepsNum) / 100;
                const totalHeightM = (heightNum * stepsNum) / 100;
                const tamanhoViga = Math.sqrt(Math.pow(comprimentoMaximoM, 2) + Math.pow(totalHeightM, 2));
                const diagonalExata = tamanhoViga + maxHandrailHeightM + pontasM;

                try {
                    // Atualiza o documento no banco com os valores pré-calculados
                    await updateDoc(doc(db, 'contracts', document.id), {
                        'calculatedData.totalWeightKg': totalWeightKg,
                        'calculatedData.escadaWeightKg': escadaWeight,
                        'calculatedData.landingsWeightKg': landingsWeight,
                        'calculatedData.totalCost': totalCost,
                        'calculatedData.escadaCost': escadaCost,
                        'calculatedData.landingsCost': landingsCost,
                        'calculatedData.freightLengthM': diagonalExata,
                        'calculatedData.freightWidthM': pacoteLarguraM,
                        'calculatedData.freightHeightM': pacoteAlturaM
                    });
                    count++;
                } catch (e) {
                    console.error("Erro ao atualizar contrato " + document.id, e);
                    errors++;
                }
            }
        }

        // Também faz pra fila de produção
        const queueSnapshot = await getDocs(collection(db, 'production_queue'));
        for (const document of queueSnapshot.docs) {
             const data = document.data();
             const parsedData = typeof data.originalData === 'string' ? JSON.parse(data.originalData) : (data.originalData || data);
             
             const steps = getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'degraus');
             const tread = getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'pisante');
             const height = getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'altura');
             const width = getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'largura');

             const treadNum = Number(tread) || 0;
             const heightNum = Number(height) || 0;
             const widthNum = Number(width) || 0;
             const stepsNum = Number(steps) || 0;
             
             if (treadNum > 0 && heightNum > 0 && widthNum > 0 && stepsNum > 0) {
                 // Mesma lógica...
                 // Para simplificar e garantir que todos da fila que vieram de contrato também peguem
                 // vou calcular
                 const thicknessM = 3.0 / 1000;
                 const STEEL_DENSITY = 7850;
                 const stepAreaM2 = ((treadNum + 6) / 100) * (widthNum / 100);
                 const stepsWeight = stepAreaM2 * thicknessM * stepsNum * STEEL_DENSITY;
                 let landingsAreaM2 = 0;
                 const landings = getProp(parsedData, 'landings');
                 if (landings && landings.length > 0) {
                     landings.forEach((l: any) => {
                         const lLen = (Number(l.length) || 0) + 20;
                         const lWid = (Number(l.width) || 0) + 20;
                         landingsAreaM2 += (lLen * lWid) / 10000;
                     });
                 }
                 const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;
                 const stepHypotenuseCm = Math.sqrt(Math.pow(treadNum, 2) + Math.pow(heightNum, 2));
                 const redLineCm = stepHypotenuseCm * stepsNum;
                 const blueLineCm = (treadNum * heightNum) / stepHypotenuseCm;
                 const stringerWidthCm = blueLineCm + 16.5;
                 const stringerAreaM2 = (redLineCm / 100) * (stringerWidthCm / 100) * 2;
                 const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;
                 const escadaWeight = stepsWeight + stringerWeight;
                 const totalWeightKg = escadaWeight + landingsWeight;
                 const escadaCost = escadaWeight * 13.80;
                 const landingsCost = landingsWeight * 13.80;
                 const totalCost = totalWeightKg * 13.80;
                 
                 const optionalItems = getProp(parsedData, 'optionalItems');
                 const maxHandrailHeightM = (optionalItems && optionalItems.some((i: any) => i.id === 'corrimao_aco')) ? 0.8 : 0;
                 const pontasM = 0.20;
                 const handrailCm = maxHandrailHeightM > 0 ? 80 : 0;
                 const pacoteLarguraM = ((treadNum + 1) + handrailCm + 16.5) / 100;
                 const pacoteAlturaM = 0.08;
                 const comprimentoMaximoM = (treadNum * stepsNum) / 100;
                 const totalHeightM = (heightNum * stepsNum) / 100;
                 const tamanhoViga = Math.sqrt(Math.pow(comprimentoMaximoM, 2) + Math.pow(totalHeightM, 2));
                 const diagonalExata = tamanhoViga + maxHandrailHeightM + pontasM;

                 try {
                     await updateDoc(doc(db, 'production_queue', document.id), {
                         'calculatedData.totalWeightKg': totalWeightKg,
                         'calculatedData.escadaWeightKg': escadaWeight,
                         'calculatedData.landingsWeightKg': landingsWeight,
                         'calculatedData.totalCost': totalCost,
                         'calculatedData.escadaCost': escadaCost,
                         'calculatedData.landingsCost': landingsCost,
                         'calculatedData.freightLengthM': diagonalExata,
                         'calculatedData.freightWidthM': pacoteLarguraM,
                         'calculatedData.freightHeightM': pacoteAlturaM
                     });
                     count++;
                 } catch (e) {
                     // ignorar erros da fila
                 }
             }
        }
        
        alert(`Atualização concluída! ${count} registros atualizados. (Erros: ${errors})`);
    } catch (e) {
        console.error(e);
        alert("Erro ao ler banco.");
    }
};

export const fixAllContractsAndQueue = async () => {
    let successCount = 0;
    const errors: string[] = [];

    try {
        // 1. FIX CONTRACTS
        const cSnap = await getDocs(query(collection(db, "contracts")));
        for (const d of cSnap.docs) {
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

                const dataToSave: Record<string, any> = {
                    ...data,
                    totalValue: val,
                    contractData: pcd === undefined ? "" : JSON.stringify(pcd)
                };
                
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
            alert(`Sincronização terminou com ${errors.length} erros.\nVeja a lista na tela.\nSucessos: ${successCount}`);
        } else {
            alert(`Padronização profunda concluída! ${successCount} registros corrigidos com sucesso!`);
        }
    } catch (e: any) {
        alert("Erro fatal ao tentar iniciar a correção: " + e.message);
        console.error(e);
    }
};
