const https = require('https');

const req = https.request('https://esperanca-2026.vercel.app/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.write(JSON.stringify({
  name: "Natan", // missing whatsapp
  campaign_id: "30000000-0000-0000-0000-000000000001",
}));
req.end();
