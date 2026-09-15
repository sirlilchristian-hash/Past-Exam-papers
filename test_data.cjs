const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: paidOrders } = await supabase.from('Orders').select('id, status, customers(first_name, second_name), Papers(file_path)').eq('status', 'paid').limit(1);
  const { data: pendingOrders } = await supabase.from('Orders').select('id, status').eq('status', 'pending').limit(1);
  
  console.log("PAID ORDER:", JSON.stringify(paidOrders, null, 2));
  console.log("PENDING ORDER:", JSON.stringify(pendingOrders, null, 2));
}
run();
