const https = require('https');
require('dotenv').config({path: '.env'});

const projectId = "calculadora-escadas";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/contracts?key=${process.env.VITE_API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.documents) {
      json.documents.slice(0, 10).forEach(doc => {
         const fields = doc.fields;
         const name = fields.clientName?.stringValue;
         const cd = fields.contractData?.stringValue;
         if (cd) {
            try {
              const parsed = JSON.parse(cd);
              console.log(`${name}: freightCost=${parsed.freightCost}`);
            } catch(e) {
              console.log(`${name}: Error parsing`);
            }
         } else {
            console.log(`${name}: NO contractData`);
         }
      });
    } else {
      console.log(json);
    }
  });
});
