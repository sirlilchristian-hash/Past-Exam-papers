const { createClient } = require("@supabase/supabase-js");

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(cleanUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: papers, error: dbError } = await supabaseAdmin.from("Papers").select("*").order("created_at", { ascending: false });
  console.log(JSON.stringify(papers, null, 2));
}
run();
