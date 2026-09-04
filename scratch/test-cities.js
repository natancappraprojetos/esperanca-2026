const https = require('https');

const req = https.request('https://esperanca-2026.vercel.app/api/cities/search?q=novo', {
  method: 'GET'
}, (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('BODY:', data.slice(0, 100));
  });
});
req.end();
