const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.storage.from('Papers').download('papers/TEST/test_plain.pdf');
  const buffer = await data.arrayBuffer();
  const text = Buffer.from(buffer).toString('utf8');
  console.log("Includes 'This is a test unencrypted paper.' :", text.includes('This is a test unencrypted paper.'));
  console.log("Includes '/Encrypt' :", text.includes('/Encrypt'));
}
run();
