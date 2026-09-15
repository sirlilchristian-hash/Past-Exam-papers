const { PDFDocument, rgb } = require('pdf-lib');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText('This is a test unencrypted paper.', { x: 50, y: 700, size: 24, color: rgb(0, 0, 0) });
  
  const pdfBytes = await pdfDoc.save();
  const path = 'papers/TEST/test_plain.pdf';
  
  const { data, error } = await supabase.storage.from('Papers').upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (error) { console.error("Upload error:", error); return; }
  
  console.log("Uploaded plain PDF to", path);
  
  // Now update the paper record to point to this plain PDF
  await supabase.from('Papers').update({ file_path: path }).eq('id', '8e390fb3-3261-4884-b7f9-2624df8c6b80');
  console.log("Updated Paper record.");
}
run();
