import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const fixContracts = async () => {
    try {
        console.log("Iniciando correção de contratos...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        let fixedCount = 0;
        
        for (const document of querySnapshot.docs) {
            const data = document.data();
            const name = data.clientName || '';
            
            if (name.includes('Everton') || name.includes('Márcia') || name.includes('Severini')) {
                console.log(`Verificando contrato: ${name}`);
                
                let needsUpdate = false;
                const newData = { ...data };
                
                // Fix the treadMaterial
                if (newData.contractData && newData.contractData.inputData) {
                    if (newData.contractData.inputData.treadMaterial !== 'metal') {
                        console.log(`- Alterando pisante de ${newData.contractData.inputData.treadMaterial} para metal`);
                        newData.contractData.inputData.treadMaterial = 'metal';
                        needsUpdate = true;
                    }
                }
                
                if (needsUpdate) {
                    await updateDoc(doc(db, 'contracts', document.id), {
                        contractData: newData.contractData
                    });
                    console.log(`- Contrato de ${name} corrigido com sucesso!`);
                    fixedCount++;
                } else {
                    console.log(`- Contrato de ${name} já estava correto (pisante=metal).`);
                }
            }
        }
        
        console.log(`Correção finalizada. ${fixedCount} contratos atualizados.`);
        alert(`Pronto! ${fixedCount} contratos foram corrigidos para METAL.`);
    } catch (error) {
        console.error("Erro ao corrigir contratos:", error);
        alert("Erro ao corrigir contratos: " + error);
    }
};
