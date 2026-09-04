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
  name: "Natan Real",
  whatsapp: "51997515970",
  whatsapp_raw: "(51) 99751-5970",
  campaign_id: "e4db38f0-06c9-4757-a3b1-290ffa98bfca", // Real campaign
  consent_data: true,
  consent_reminder_whatsapp: true,
}));
req.end();
