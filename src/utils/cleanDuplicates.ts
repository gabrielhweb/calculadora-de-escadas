import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const cleanDuplicateContracts = async () => {
    try {
        console.log("Iniciando limpeza de duplicatas...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        const contracts: any[] = [];
        
        querySnapshot.forEach((docSnap) => {
            contracts.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Agrupar por nome do cliente, valor e data de criação (ou algo que identifique o mesmo contrato)
        const groups: { [key: string]: any[] } = {};
        
        contracts.forEach(contract => {
            // A chave de identificação será o nome do cliente + valor total + dia de criação
            // Como pode haver pequena diferença de segundos, vamos pegar só a data "YYYY-MM-DD"
            let dateStr = '';
            try {
                if (contract.createdAt && typeof contract.createdAt.toDate === 'function') {
                    dateStr = contract.createdAt.toDate().toISOString().split('T')[0];
                } else if (contract.createdAt) {
                    dateStr = new Date(contract.createdAt).toISOString().split('T')[0];
                }
            } catch (e) {
                dateStr = 'unknown';
            }
            
            const key = `${contract.clientName}_${contract.totalValue}_${dateStr}`;
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(contract);
        });

        let deletedCount = 0;

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`Encontrado duplicados para: ${key} (${group.length} registros)`);
                // Ordenar por ID ou createdAt pra manter sempre o mais antigo/primeiro
                // Vamos manter o primeiro [0] e deletar o resto
                for (let i = 1; i < group.length; i++) {
                    const docId = group[i].id;
                    console.log(`Deletando duplicata ID: ${docId}`);
                    await deleteDoc(doc(db, 'contracts', docId));
                    deletedCount++;
                }
            }
        }

        console.log(`Limpeza concluída! ${deletedCount} contratos duplicados removidos.`);
        alert(`Limpeza concluída com sucesso! ${deletedCount} contratos repetidos foram removidos do sistema.`);
        return deletedCount;
    } catch (error) {
        console.error("Erro ao limpar duplicatas:", error);
        alert("Erro ao executar limpeza. Veja o console.");
    }
};
