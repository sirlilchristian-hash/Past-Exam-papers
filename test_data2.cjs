const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: allOrders } = await supabase.from('Orders').select('*').limit(5);
  const { data: allCustomers } = await supabase.from('customers').select('*').limit(5);
  const { data: allPapers } = await supabase.from('Papers').select('*').limit(5);
  
  console.log("ORDERS:", allOrders);
  console.log("CUSTOMERS:", allCustomers);
  console.log("PAPERS:", allPapers);
}
run();
