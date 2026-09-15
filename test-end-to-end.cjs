const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const cleanUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(cleanUrl, rawSupabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const storagePath = `papers/TESTEND2END/${uniqueId}.pdf`;
  const pdfBuffer = Buffer.from('%PDF-1.4 TEST PDF FILE CONTENT FOR UPLOAD');

  console.log("Uploading to:", storagePath);
  const { data: uploadData, error: storageError } = await supabaseAdmin.storage
    .from("Papers")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (storageError) {
    console.error("Upload error:", storageError);
    return;
  }
  console.log("Upload success:", uploadData);

  const { data: insertedData, error: dbError } = await supabaseAdmin
    .from("Papers")
    .insert([
      {
        unit_code: "TESTE2E",
        paper_title: "Test End 2 End",
        price: 50,
        status: "available",
        file_path: storagePath,
      },
    ])
    .select()
    .single();

  if (dbError) {
    console.error("DB error:", dbError);
    return;
  }
  console.log("DB insert success:", insertedData);

  const paperId = insertedData.id;
  const dbFilePath = insertedData.file_path;
  
  console.log("Attempting download from DB file path:", dbFilePath);
  const { data: fileData, error: downloadErr } = await supabaseAdmin
    .storage
    .from("Papers")
    .download(dbFilePath);
    
  if (downloadErr || !fileData) {
    console.error("Download error:", downloadErr);
    return;
  }
  
  console.log("Download success! File size:", fileData.size);
}
run();
