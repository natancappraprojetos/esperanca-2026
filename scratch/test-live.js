require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: campaign } = await supabase.from('campaigns').select('id').limit(1).single();
  console.log('Campaign ID:', campaign.id);

  const body = {
    name: "Natan",
    whatsapp: "51997515970",
    whatsapp_raw: "(51) 99751-5970",
    campaign_id: campaign.id,
    consent_data: true,
    consent_reminder_whatsapp: true,
  };

  const res = await fetch('https://esperanca-2026.vercel.app/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  console.log('STATUS:', res.status);
  const text = await res.text();
  console.log('BODY:', text);
}
test();
