import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "gen-lang-client-0064759207",
  "appId": "1:279413782660:web:2e0c89ef739286ade4aad1",
  "apiKey": "AIzaSyDdXvLcGf8MiO0qd2FN31xCBcDxznCS1qA",
  "authDomain": "gen-lang-client-0064759207.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-eb19766d-bd91-4d13-a6a8-f747912a2efa",
  "storageBucket": "gen-lang-client-0064759207.firebasestorage.app",
  "messagingSenderId": "279413782660",
  "measurementId": ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const q = query(collection(db, "contracts"));
  const snap = await getDocs(q);
  console.log("Found", snap.size, "contracts");
  
  snap.forEach(document => {
    const data = document.data();
    if(data.clientName && (data.clientName.includes("Everton") || data.clientName.includes("Márcia") || data.clientName.includes("Severini"))) {
      console.log("-------------");
      console.log("ID:", document.id);
      console.log("Client:", data.clientName);
      console.log("Total:", data.totalValue);
      console.log("Contract Data:", JSON.stringify(data.contractData, null, 2));
    }
  });
}
run();
