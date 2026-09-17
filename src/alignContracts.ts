import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const alignContractsWithPDF = async () => {
    try {
        console.log("Alinhando DADOS DE USUÁRIO dos contratos com os PDFs fornecidos...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        
        for (const document of querySnapshot.docs) {
            const data = document.data();
            const name = data.clientName || '';
            const cData = data.contractData || {};
            
            // Garante que userData existe
            if (!cData.userData) {
                cData.userData = { name: '', cpf: '', address: '' };
            }
            
            let updated = false;

            if (name.includes('Everton')) {
                cData.userData.name = 'Everton de Araujo';
                cData.userData.cpf = '313.386.728-86';
                cData.userData.address = 'Rua Vasco da Gama, 63 - Cipava, Osasco - SP, 06065-420';
                updated = true;
            }
            
            if (name.includes('Márcia')) {
                cData.userData.name = 'Márcia Campos Nogueira';
                cData.userData.cpf = '955.892.797-04';
                cData.userData.address = 'Rua Joaquim Ferreira, 191 - Casa 02 - Jardim Sulacap, Rio de Janeiro - RJ, 21741-290';
                updated = true;
            }
            
            if (name.includes('Severini')) {
                cData.userData.name = 'José Guilherme Severini';
                cData.userData.cpf = '443.023.396-91';
                cData.userData.address = 'Rua Tangará, 20 - Condomínio Campo da Cachoeira, Poços de Caldas - MG, 37704-900';
                updated = true;
            }

            if (updated) {
                await updateDoc(doc(db, 'contracts', document.id), {
                    contractData: cData
                });
            }
        }
        
        alert("Dados de Cliente (CPF e Endereço) dos 3 contratos foram 100% alinhados!");
    } catch (e) {
        console.error(e);
    }
};
