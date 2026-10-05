const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({path: '.env'});

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: "calculadora-escadas.firebaseapp.com",
  projectId: "calculadora-escadas",
  storageBucket: "calculadora-escadas.appspot.com",
  messagingSenderId: "367205244583",
  appId: "1:367205244583:web:f562bd8f7f18db0d381cb1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, 'contracts'));
  let count = 0;
  let hasFreight = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    count++;
    if (data.contractData) {
      try {
        const parsed = JSON.parse(data.contractData);
        if (parsed.freightCost > 0) {
          hasFreight++;
          console.log(`[${data.clientName}] has freight: ${parsed.freightCost}`);
        } else {
          console.log(`[${data.clientName}] NO freight (0 or missing)`);
        }
      } catch(e) {
        console.log(`[${data.clientName}] Error parsing contractData`);
      }
    } else {
      console.log(`[${data.clientName}] NO contractData`);
    }
  });
  console.log(`Total: ${count}, With Freight: ${hasFreight}`);
  process.exit(0);
}
run().catch(console.error);
