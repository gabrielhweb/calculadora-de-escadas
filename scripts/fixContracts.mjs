import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function fix() {
    const snap = await getDocs(collection(db, "contracts"));
    console.log(`Found ${snap.size} contracts`);
    let count = 0;
    for (const d of snap.docs) {
        const data = d.data();
        let val = data.totalValue;
        if (isNaN(Number(val)) || val === undefined || val === null || val === 0) {
            try {
                let parsedData = typeof data.contractData === "string" ? JSON.parse(data.contractData) : data.contractData;
                while (typeof parsedData === "string") parsedData = JSON.parse(parsedData);
                if (parsedData?.totalValue) val = parsedData.totalValue;
                else if (parsedData?.contractData?.totalValue) val = parsedData.contractData.totalValue;
                else if (parsedData?.contractData?.selectedOption?.totalPrice) val = parsedData.contractData.selectedOption.totalPrice;
                else if (parsedData?.finalStairPrice) val = (parsedData.finalStairPrice || 0) + (parsedData.finalLandingsPrice || 0);
            } catch(e) { val = 0; }
        }
        
        let updates = {};
        if (val && val !== data.totalValue) {
            updates.totalValue = Number(val);
        }
        
        // Also extract dimensions properly for the queue computation
        try {
            let pcd = typeof data.contractData === "string" ? JSON.parse(data.contractData) : data.contractData;
            let maxIters = 5;
            while (typeof pcd === "string" && maxIters > 0) { pcd = JSON.parse(pcd); maxIters--; }
            if (pcd?.contractData) {
                pcd = pcd.contractData;
                maxIters = 5;
                while (typeof pcd === "string" && maxIters > 0) { pcd = JSON.parse(pcd); maxIters--; }
            }
            
            // Re-stringify the normalized data back to contractData to remove double nesting
            if (pcd && typeof pcd === "object") {
                const normalizedStr = JSON.stringify(pcd);
                if (normalizedStr !== data.contractData && normalizedStr !== `"${data.contractData}"`) {
                    updates.contractData = normalizedStr;
                }
            }
        } catch(e) {}
        
        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "contracts", d.id), updates);
            console.log(`Fixed contract ${data.clientName || d.id}:`, updates);
            count++;
        }
    }
    
    // Also fix quotes
    const quoteSnap = await getDocs(collection(db, "saved_quotes"));
    for (const d of quoteSnap.docs) {
        const data = d.data();
        let updates = {};
        let pcd = data;
        let val = data.totalValue || (data.inputData?.totalHeight * 100) || 0; // fallback logic
        
        if (val && val !== data.totalValue) {
            updates.totalValue = Number(val);
        }
        
        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "saved_quotes", d.id), updates);
            console.log(`Fixed quote ${data.clientName || d.id}:`, updates);
            count++;
        }
    }
    
    // Also fix production queue
    const queueSnap = await getDocs(collection(db, "production_queue"));
    for (const d of queueSnap.docs) {
        const data = d.data();
        let val = (data.downPayment || 0) + (data.balanceDue || 0);
        let updates = {};
        if (val === 0 && data.totalValue) {
            updates.downPayment = data.totalValue / 2;
            updates.balanceDue = data.totalValue / 2;
        }
        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "production_queue", d.id), updates);
            console.log(`Fixed queue ${data.clientName || d.id}:`, Object.keys(updates));
            count++;
        }
    }
    
    console.log(`Finished fixing ${count} documents.`);
    process.exit(0);
}
fix();
