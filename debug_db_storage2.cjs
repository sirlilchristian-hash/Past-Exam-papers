const { createClient } = require("@supabase/supabase-js");

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(cleanUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("=== PAPERS TABLE ===");
  const { data: papers, error: dbError } = await supabaseAdmin.from("Papers").select("*").order("created_at", { ascending: false }).limit(5);
  if (dbError) console.error("DB Error:", dbError);
  else console.log(JSON.stringify(papers, null, 2));

  console.log("\n=== STORAGE PAPERS BUCKET ===");
  const { data: files, error: storageError } = await supabaseAdmin.storage.from("papers").list();
  if (storageError) console.error("Storage Error:", storageError);
  else console.log(JSON.stringify(files, null, 2));
  
  const { data: files2, error: storageError2 } = await supabaseAdmin.storage.from("Papers").list();
  if (storageError2) console.error("Storage Error2:", storageError2);
  else console.log(JSON.stringify(files2, null, 2));
}
run();
