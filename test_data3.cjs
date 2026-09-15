const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data: allOrders } = await supabase.from('Orders').select('*').limit(5);
  const { data: allPapers } = await supabase.from('Papers').select('*').limit(5);
  
  console.log("ORDERS:", allOrders);
  console.log("PAPERS:", allPapers);
}
run();
