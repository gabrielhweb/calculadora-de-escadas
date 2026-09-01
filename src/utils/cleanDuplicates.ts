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

        console.log(`Limpeza de contratos concluída! ${deletedCount} contratos duplicados removidos.`);

        // Agora limpar a fila de produção
        console.log("Iniciando limpeza da fila de produção...");
        const queueSnapshot = await getDocs(collection(db, 'production_queue'));
        const queue: any[] = [];
        
        queueSnapshot.forEach((docSnap) => {
            queue.push({ id: docSnap.id, ...docSnap.data() });
        });

        const queueGroups: { [key: string]: any[] } = {};
        
        queue.forEach(item => {
            let dateStr = '';
            try {
                if (item.createdAt && typeof item.createdAt.toDate === 'function') {
                    dateStr = item.createdAt.toDate().toISOString().split('T')[0];
                } else if (item.createdAt) {
                    dateStr = new Date(item.createdAt).toISOString().split('T')[0];
                }
            } catch (e) {
                dateStr = 'unknown';
            }
            // Agrupar por nome e data e valor do contrato para garantir q eh duplicata
            const key = `${item.clientName}_${item.contractId || item.balanceDue}_${dateStr}`;
            
            if (!queueGroups[key]) {
                queueGroups[key] = [];
            }
            queueGroups[key].push(item);
        });

        let queueDeletedCount = 0;

        for (const key in queueGroups) {
            const group = queueGroups[key];
            if (group.length > 1) {
                console.log(`Encontrado duplicados na fila para: ${key} (${group.length} registros)`);
                for (let i = 1; i < group.length; i++) {
                    const docId = group[i].id;
                    console.log(`Deletando duplicata da fila ID: ${docId}`);
                    await deleteDoc(doc(db, 'production_queue', docId));
                    queueDeletedCount++;
                }
            }
        }

        console.log(`Limpeza da fila concluída! ${queueDeletedCount} duplicados removidos.`);
        alert(`Limpeza concluída com sucesso!\n${deletedCount} contratos repetidos removidos.\n${queueDeletedCount} itens repetidos da fila removidos.`);
        return deletedCount + queueDeletedCount;
    } catch (error) {
        console.error("Erro ao limpar duplicatas:", error);
        alert("Erro ao executar limpeza. Veja o console.");
    }
};
