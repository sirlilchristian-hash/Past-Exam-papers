const { createClient } = require("@supabase/supabase-js");

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(cleanUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const filePath1 = "papers/TEST/test_plain.pdf"; // older working document
  const filePath2 = "papers/MATH101/1789475977522-negeg5p.pdf"; // new document

  const { data: d1, error: e1 } = await supabaseAdmin.storage.from("Papers").download(filePath1);
  console.log("Download 1:", e1 ? "ERROR" : "SUCCESS", e1);

  const { data: d2, error: e2 } = await supabaseAdmin.storage.from("Papers").download(filePath2);
  console.log("Download 2:", e2 ? "ERROR" : "SUCCESS", e2);
}
run();
