const url = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0064759207/databases/ai-studio-eb19766d-bd91-4d13-a6a8-f747912a2efa/documents/contracts?key=AIzaSyDdXvLcGf8MiO0qd2FN31xCBcDxznCS1qA';

fetch(url)
  .then(r => r.json())
  .then(data => {
    if (!data.documents) {
      console.log('No documents found or error:', data);
      return;
    }
    const frontalContracts = data.documents.filter(doc => {
      const str = JSON.stringify(doc).toLowerCase();
      return str.includes('frontal');
    });
    
    console.log('Found ' + frontalContracts.length + ' frontal contracts');
    frontalContracts.forEach(doc => {
      const name = doc.name.split('/').pop();
      const fields = doc.fields;
      let clientName = 'Unknown';
      if (fields.clientName && fields.clientName.stringValue) clientName = fields.clientName.stringValue;
      else if (fields.inputData && fields.inputData.mapValue && fields.inputData.mapValue.fields && fields.inputData.mapValue.fields.clientName) {
         clientName = fields.inputData.mapValue.fields.clientName.stringValue;
      }
      console.log('Contract ID:', name, '| Client:', clientName);
    });
  })
  .catch(console.error);
