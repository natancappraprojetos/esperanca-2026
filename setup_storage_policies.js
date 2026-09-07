const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addPolicies() {
  const sql = `
    -- Enable RLS on storage.objects if not already enabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

    -- Create policies for public-assets bucket
    CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'public-assets');

    CREATE POLICY "Allow public reads" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'public-assets');

    CREATE POLICY "Allow public updates" ON storage.objects
    FOR UPDATE TO anon, authenticated
    USING (bucket_id = 'public-assets');

    CREATE POLICY "Allow public deletes" ON storage.objects
    FOR DELETE TO anon, authenticated
    USING (bucket_id = 'public-assets');
  `;

  // First we need to make sure the bucket is completely public
  const { data: bucketData, error: bucketError } = await supabase.storage.updateBucket('public-assets', {
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  });
  console.log('Bucket update:', bucketData, bucketError);

  // Now execute the SQL to add policies
  // Since we might not have a generic 'exec_sql' RPC function, let's try a direct postgres connection 
  // or use the rest API if possible.
  // Actually, we can check if there's an 'exec_sql' or 'exec' function.
  const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
  console.log('RPC result:', error);
}

addPolicies();
