import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Get Industrial neighborhood centroid
  let { data: b, error } = await supabase.from('neighborhoods').select('name, latitude, longitude').ilike('name_normalized', '%industrial%');
  console.log('Neighborhoods:', b);
  
  // Get Churches
  let { data: c } = await supabase.from('churches').select('name, location');
  console.log('Churches:', c);
}
run();
