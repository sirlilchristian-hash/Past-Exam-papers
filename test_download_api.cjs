const fetch = require('node-fetch'); // or we can just run a native fetch if node 18+

async function run() {
  const res = await fetch('http://127.0.0.1:3000/api/orders/46dc4942-7d7b-45a4-ba99-4b1c8b7c9ebe/download');
  console.log("Status:", res.status);
  console.log("Headers:", res.headers.raw());
  const text = await res.text();
  console.log("Body:", text);
}
run();
