require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: campaign } = await supabase.from('campaigns').select('id').limit(1).single();

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

  req.write(JSON.stringify({
    name: "Natan",
    whatsapp: "51997515970",
    whatsapp_raw: "(51) 99751-5970",
    campaign_id: campaign.id,
    consent_data: true,
    consent_reminder_whatsapp: true,
  }));
  req.end();
}
test();
