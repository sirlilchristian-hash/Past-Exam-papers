const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(rawSupabaseUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  console.log("Buckets:", data?.map(b => b.name));
}
run();
