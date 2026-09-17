import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const fixContractsDateAndUndefined = async () => {
    try {
        console.log("Corrigindo datas e undefined dos contratos...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        
        for (const document of querySnapshot.docs) {
            const data = document.data();
            const name = data.clientName || '';
            const cData = data.contractData || {};
            const input = cData.inputData || {};
            
            let updated = false;

            if (name.includes('Everton')) {
                // Everton was signed on 09/09/2026.
                // For Firestore Date fields, or strings:
                const correctDate = new Date('2026-09-09T12:00:00Z').toISOString();
                
                // Fix missing stepHeight and treadDepth
                input.stepHeight = 20.80; 
                input.treadDepth = 20.00;
                
                await updateDoc(doc(db, 'contracts', document.id), {
                    createdAt: correctDate,
                    contractData: cData
                });
                updated = true;
            }
            
            if (name.includes('Severini')) {
                // José was signed on 11/09/2026.
                const correctDate = new Date('2026-09-11T12:00:00Z').toISOString();
                
                input.stepHeight = 26.07;
                input.treadDepth = 20.00;
                
                await updateDoc(doc(db, 'contracts', document.id), {
                    createdAt: correctDate,
                    contractData: cData
                });
                updated = true;
            }

            if (name.includes('Márcia')) {
                // Márcia is from our previous run, fix step height too just in case.
                input.stepHeight = 20.93;
                input.treadDepth = 20.00;
                await updateDoc(doc(db, 'contracts', document.id), {
                    contractData: cData
                });
            }
        }
        
        alert("Datas e alturas dos degraus corrigidas!");
    } catch (e) {
        console.error(e);
    }
};
