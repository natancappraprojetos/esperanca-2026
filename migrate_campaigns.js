require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const usbCampaignId = 'e4db38f0-06c9-4757-a3b1-290ffa98bfca';
  const anrsCampaignId = '30000000-0000-0000-0000-000000000001';

  // 1. Rename campaigns
  await supabase.from('campaigns').update({ name: 'Semana da Esperança 2026 - USB' }).eq('id', usbCampaignId);
  await supabase.from('campaigns').update({ name: 'Semana da Esperança 2026 - ANRS' }).eq('id', anrsCampaignId);
  console.log('Renamed campaigns');

  // 2. Identify the 9 ANRS pastors and their churches
  const anrsPastorsList = ['Apolo', 'Padilha', 'Douglas', 'Jennings', 'Villiam / Régis', 'Giliard', 'Gian'];
  
  const { data: pastors, error: pErr } = await supabase.from('pastors').select('church_id, full_name');
  if (pErr) throw pErr;

  const anrsChurchIds = pastors
    .filter(p => anrsPastorsList.includes(p.full_name))
    .map(p => p.church_id);
    
  console.log('Found ANRS church IDs:', anrsChurchIds.length); // should be 9

  // 3. Update campaign_churches for ANRS
  // First, delete them from the old campaign
  await supabase.from('campaign_churches').delete().eq('campaign_id', usbCampaignId).in('church_id', anrsChurchIds);
  
  // Insert into new campaign
  for (const churchId of anrsChurchIds) {
    await supabase.from('campaign_churches').insert({ campaign_id: anrsCampaignId, church_id: churchId }).select();
  }
  console.log('Moved churches to ANRS campaign');

  // 4. Update leads
  await supabase.from('leads').update({ campaign_id: anrsCampaignId }).in('church_id', anrsChurchIds);
  console.log('Updated leads');

  // 5. Update campaign_cities for both
  // clear existing
  await supabase.from('campaign_cities').delete().eq('campaign_id', anrsCampaignId);
  await supabase.from('campaign_cities').delete().eq('campaign_id', usbCampaignId);

  const { data: allChurches } = await supabase.from('churches').select('id, city_id');
  const anrsCities = [...new Set(allChurches.filter(c => anrsChurchIds.includes(c.id)).map(c => c.city_id))];
  const usbCities = [...new Set(allChurches.filter(c => !anrsChurchIds.includes(c.id)).map(c => c.city_id))];

  for (const cityId of anrsCities) {
    if (cityId) await supabase.from('campaign_cities').insert({ campaign_id: anrsCampaignId, city_id: cityId });
  }
  for (const cityId of usbCities) {
    if (cityId) await supabase.from('campaign_cities').insert({ campaign_id: usbCampaignId, city_id: cityId });
  }
  console.log('Updated campaign cities');
}

run().catch(console.error);
