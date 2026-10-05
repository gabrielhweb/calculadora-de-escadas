const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy } = require('firebase/firestore');
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
  const q = query(collection(db, 'production_queue'), limit(10));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Client: ${data.clientName}`);
    console.log(`Has contractData: ${!!data.contractData}`);
    console.log(`Has parsedContractData: ${!!data.parsedContractData}`);
    console.log(`Has originalData: ${!!data.originalData}`);
    console.log('---');
  });
  process.exit(0);
}
run().catch(console.error);
