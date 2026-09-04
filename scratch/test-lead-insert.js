require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const contact = {
    whatsapp: '5551999999999',
    whatsapp_raw: '(51) 99999-9999',
    full_name: 'Test User'
  };
  
  const { data: c, error: cErr } = await supabase.from('contacts').upsert(contact, { onConflict: 'whatsapp' }).select().single();
  if (cErr) {
    console.error('Contact error:', cErr);
    return;
  }
  
  console.log('Contact created:', c.id);
  
  const leadData = {
    contact_id: c.id,
    campaign_id: '25e1bb3d-a5ee-4614-bcae-2ba40251767e',
    status: 'active'
  };
  
  const { data: l, error: lErr } = await supabase.from('leads').upsert(leadData, { onConflict: 'contact_id,campaign_id' }).select().single();
  if (lErr) {
    console.error('Lead error:', lErr);
    return;
  }
  
  console.log('Lead created:', l.id);
}
test();
