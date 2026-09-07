const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: banners } = await supabase
    .from('banners')
    .select('id, church_id, name, image_desktop_url, status')
    .eq('status', 'active');

  console.log('Total banners:', banners.length);
  console.log('\nBroken banners (file missing):');
  
  let broken = 0;
  for (const b of banners) {
    const filePath = path.join('public', b.image_desktop_url);
    if (!fs.existsSync(filePath)) {
      broken++;
      console.log(`  ${b.name} -> ${b.image_desktop_url} (MISSING)`);
    }
  }
  
  console.log(`\n${broken} broken out of ${banners.length} total`);
}
check();
