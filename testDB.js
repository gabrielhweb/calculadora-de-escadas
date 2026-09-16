import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
    const querySnapshot = await getDocs(collection(db, 'contracts'));
    let missingCount = 0;
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parsedData = typeof data.originalData === 'string' ? JSON.parse(data.originalData) : (data.originalData || data);
        
        const getProp = (obj, key) => {
            if (!obj) return null;
            if (obj[key] !== undefined) return obj[key];
            if (obj.inputData && obj.inputData[key] !== undefined) return obj.inputData[key];
            if (obj.selectedOption && obj.selectedOption[key] !== undefined) return obj.selectedOption[key];
            return null;
        };

        const steps = getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'degraus');
        const tread = getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'pisante');
        const height = getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'altura');
        const width = getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'largura');

        if (!steps || !tread || !height || !width) {
            console.log(`Contract ID: ${doc.id}`);
            console.log(`Title/Name: ${data.clientName || data.title}`);
            console.log(`Missing - steps: ${steps}, tread: ${tread}, height: ${height}, width: ${width}`);
            console.log('Raw data sample:', JSON.stringify(parsedData).slice(0, 200));
            console.log('---------------------');
            missingCount++;
        }
    });
    console.log(`Total missing: ${missingCount}`);
    process.exit(0);
}

run();
