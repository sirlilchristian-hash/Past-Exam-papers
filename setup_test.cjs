const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const pendingOrderId = '46dc4942-7d7b-45a4-ba99-4b1c8b7c9ebe';
  
  // 1. Mark order as paid
  await supabase.from('Orders').update({ status: 'paid' }).eq('id', pendingOrderId);
  
  // 2. Fetch the customer to see what the second name is
  const { data: order } = await supabase.from('Orders').select('customer_id').eq('id', pendingOrderId).single();
  const { data: customer } = await supabase.from('customers').select('*').eq('id', order.customer_id).single();
  
  // 3. Set a specific name to test (e.g. TestFirstName TestSecondName)
  await supabase.from('customers').update({ first_name: 'Alpha', second_name: 'Bravo' }).eq('id', customer.id);
  
  console.log("Order is now paid. Customer second name is 'Bravo'.");
}
run();
