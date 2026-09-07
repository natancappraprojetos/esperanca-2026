const fs = require('fs');
async function test() {
  const formData = new FormData();
  const fileContent = fs.readFileSync('public/banners/19.png');
  const blob = new Blob([fileContent], { type: 'image/png' });
  formData.append('file', blob, '19.png');
  formData.append('church_id', 'e0cc3c75-1312-4ff8-b0e4-d1d7f68c35b1'); // Gramado
  formData.append('campaign_id', '30000000-0000-0000-0000-000000000001');
  formData.append('church_name', 'Gramado');
  
  try {
    const res = await fetch('http://localhost:3000/api/admin/banners/upload', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
