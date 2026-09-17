import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const removeDuplicates = async () => {
    try {
        console.log("Procurando duplicatas...");
        const querySnapshot = await getDocs(collection(db, 'contracts'));
        
        const evertonDocs: any[] = [];
        const joseDocs: any[] = [];
        
        querySnapshot.forEach(document => {
            const data = document.data();
            const name = data.clientName || '';
            if (name.includes('Everton')) evertonDocs.push({ id: document.id, date: data.createdAt });
            if (name.includes('Severini')) joseDocs.push({ id: document.id, date: data.createdAt });
        });
        
        // Sort by date so we delete the newest one (the one I just added) and keep the old one (which we already fixed)
        // Wait, if I delete the newest one, does the old one have the complete data?
        // Let's just keep the ONE that has the most recent update, or delete the one we literally just injected.
        // Let's sort by date ascending.
        evertonDocs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        joseDocs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let deleted = 0;
        
        // Remove all but the first for Everton
        for (let i = 1; i < evertonDocs.length; i++) {
            await deleteDoc(doc(db, 'contracts', evertonDocs[i].id));
            deleted++;
        }
        
        // Remove all but the first for Jose
        for (let i = 1; i < joseDocs.length; i++) {
            await deleteDoc(doc(db, 'contracts', joseDocs[i].id));
            deleted++;
        }
        
        console.log(`Duplicatas removidas: ${deleted}`);
    } catch (e) {
        console.error(e);
    }
};
