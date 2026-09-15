const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(rawSupabaseUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("=== PAPERS TABLE ===");
  const { data: papers, error: dbError } = await supabaseAdmin.from("Papers").select("*").order("created_at", { ascending: false }).limit(5);
  if (dbError) console.error("DB Error:", dbError);
  else console.log(JSON.stringify(papers, null, 2));

  console.log("\n=== STORAGE PAPERS BUCKET ===");
  const { data: files, error: storageError } = await supabaseAdmin.storage.from("Papers").list();
  if (storageError) console.error("Storage Error:", storageError);
  else console.log(JSON.stringify(files, null, 2));
}
run();
