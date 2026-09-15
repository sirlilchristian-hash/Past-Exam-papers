const { createClient } = require("@supabase/supabase-js");

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(cleanUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("=== STORAGE PAPERS BUCKET 'papers/' ===");
  const { data: files, error: storageError } = await supabaseAdmin.storage.from("Papers").list("papers");
  if (storageError) console.error("Storage Error:", storageError);
  else console.log(JSON.stringify(files, null, 2));
  
  console.log("=== STORAGE PAPERS BUCKET 'papers/MATH101' ===");
  const { data: files2, error: storageError2 } = await supabaseAdmin.storage.from("Papers").list("papers/MATH101");
  if (storageError2) console.error("Storage Error:", storageError2);
  else console.log(JSON.stringify(files2, null, 2));
  
  console.log("=== STORAGE PAPERS BUCKET 'papers/TEST' ===");
  const { data: files3, error: storageError3 } = await supabaseAdmin.storage.from("Papers").list("papers/TEST");
  if (storageError3) console.error("Storage Error:", storageError3);
  else console.log(JSON.stringify(files3, null, 2));
}
run();
