const { createClient } = require('@supabase/supabase-js');
const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');
require('dotenv').config();

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(url, key);

async function run() {
  const orderId = '46dc4942-7d7b-45a4-ba99-4b1c8b7c9ebe';
  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("id, status, paper_id, customers (second_name)")
      .eq("id", orderId)
      .maybeSingle();
      
    if (orderErr) {
       console.log("orderErr", orderErr); return;
    }
    
    console.log("Order found:", order.id, order.status, order.customers);
    
    const customerData = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const secondName = customerData?.second_name?.trim();
    
    console.log("Second name:", secondName);
    
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", order.paper_id)
      .maybeSingle();
      
    console.log("Paper:", paper.file_path);
    
    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);
      
    if (downloadErr) {
       console.log("downloadErr", downloadErr); return;
    }
    
    console.log("File downloaded. Size:", fileData.size);
    
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    
    console.log("Uint8 array created:", pdfUint8.length);
    
    const encryptedBytes = await encryptPDF(pdfUint8, secondName, { algorithm: 'RC4' });
    
    console.log("Encrypted:", encryptedBytes.length);
    
  } catch (e) {
    console.error("Caught exception:", e);
  }
}
run();
