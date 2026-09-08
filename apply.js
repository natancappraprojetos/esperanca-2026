const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const sql = `
    CREATE POLICY "anyone_view_campaign_churches_2" ON campaign_churches FOR SELECT USING (true);
    CREATE POLICY "super_admin_manage_campaign_churches_2" ON campaign_churches FOR ALL USING (is_super_admin());
    CREATE POLICY "anyone_view_campaign_cities_2" ON campaign_cities FOR SELECT USING (true);
    CREATE POLICY "super_admin_manage_campaign_cities_2" ON campaign_cities FOR ALL USING (is_super_admin());
  `;
  const { error } = await supabase.rpc('query', { query_text: sql });
  console.log('Result:', error ? error.message : 'Success');
}
run();
