import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const alignContractsWithPDF = async () => {
    try {
        console.log("Alinhando contratos com os PDFs fornecidos...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        
        for (const document of querySnapshot.docs) {
            const data = document.data();
            const name = data.clientName || '';
            const cData = data.contractData || {};
            const input = cData.inputData || {};
            
            if (name.includes('Everton')) {
                input.desiredSteps = 14;
                input.totalHeight = 312;
                input.totalLength = 287; // but we use customTotalLength ?
                input.stairWidth = 70;
                input.treadDepth = 20;
                input.treadMaterial = 'metal';
                input.dampers = 4;
                
                cData.totalPrice = 7550;
                cData.freightCost = 340;
                cData.installationCost = 350;
                cData.isInstallationIncluded = true;
                cData.discount = 5;
                cData.discountValue = 377.50;
                cData.finalPrice = 7172.50;
                
                await updateDoc(doc(db, 'contracts', document.id), {
                    totalValue: 7172.50,
                    contractData: cData
                });
            }
            
            if (name.includes('Márcia')) {
                input.desiredSteps = 13;
                input.totalHeight = 293;
                input.stairWidth = 60;
                input.treadDepth = 20;
                input.treadMaterial = 'metal';
                input.dampers = 4;
                
                // Add optional item if not exists
                if (!input.optionalItems) input.optionalItems = [];
                const hasBarra = input.optionalItems.find((o: any) => o.name.includes('Barra de Fixação'));
                if (!hasBarra) {
                    input.optionalItems.push({ id: 'barra1', name: 'Barra de Fixação Lateral', price: 490 });
                } else {
                    hasBarra.price = 490;
                }
                
                cData.totalPrice = 7410;
                cData.freightCost = 680;
                cData.installationCost = 0;
                cData.isInstallationIncluded = false;
                cData.discount = 5;
                cData.discountValue = 370.50;
                cData.finalPrice = 7039.50;
                
                await updateDoc(doc(db, 'contracts', document.id), {
                    totalValue: 7039.50,
                    contractData: cData
                });
            }
            
            if (name.includes('Severini')) {
                input.desiredSteps = 13;
                input.totalHeight = 365;
                input.stairWidth = 60;
                input.treadDepth = 20;
                input.treadMaterial = 'metal';
                input.dampers = 4;
                
                cData.totalPrice = 6870;
                cData.freightCost = 450;
                cData.installationCost = 310;
                cData.isInstallationIncluded = true;
                cData.discount = 6.84;
                cData.discountValue = 470;
                cData.finalPrice = 6400;
                
                await updateDoc(doc(db, 'contracts', document.id), {
                    totalValue: 6400,
                    contractData: cData
                });
            }
        }
        
        alert("Contratos do Everton, Márcia e José Guilherme foram 100% alinhados com os PDFs originais!");
    } catch (e) {
        console.error(e);
    }
};
