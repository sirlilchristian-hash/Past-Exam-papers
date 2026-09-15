const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const { encryptPDF } = require("@pdfsmaller/pdf-encrypt");

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(rawSupabaseUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin.from("Papers").select("id, file_path").limit(1).single();
  if (error || !data) {
    console.error("No paper found", error);
    return;
  }
  
  console.log("Found paper:", data.id, data.file_path);
  
  const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(data.file_path);
      
  if (downloadErr || !fileData) {
     console.error("Storage error:", downloadErr);
     return;
  }
  
  const arrayBuffer = await fileData.arrayBuffer();
  const pdfUint8 = new Uint8Array(arrayBuffer);
  
  console.log("PDF loaded, size:", pdfUint8.length);
  
  try {
    const encryptedBytes = await encryptPDF(pdfUint8, "testpassword", { algorithm: 'RC4' });
    console.log("Encrypted size:", encryptedBytes.length);
  } catch (err) {
    console.error("Encrypt error:", err);
  }
}
run();
