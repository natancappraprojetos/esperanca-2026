const http = require('http');

const req = http.request('http://localhost:3000/api/leads', {
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

req.on('error', e => console.error('Request error:', e));

req.write(JSON.stringify({
  name: "Natan",
  whatsapp: "51997515970",
  campaign_id: "30000000-0000-0000-0000-000000000001",
  consent_data: true,
  consent_reminder_whatsapp: true,
}));
req.end();
