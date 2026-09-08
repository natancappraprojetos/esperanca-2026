require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = `
    CREATE POLICY "anyone_view_campaign_churches_2" ON campaign_churches FOR SELECT USING (true);
    CREATE POLICY "super_admin_manage_campaign_churches_2" ON campaign_churches FOR ALL USING (is_super_admin());
    CREATE POLICY "anyone_view_campaign_cities_2" ON campaign_cities FOR SELECT USING (true);
    CREATE POLICY "super_admin_manage_campaign_cities_2" ON campaign_cities FOR ALL USING (is_super_admin());
  `;
  try {
    await client.query(sql);
    console.log('Success');
  } catch (e) {
    console.error('Error:', e.message);
  }
  await client.end();
}
run();
