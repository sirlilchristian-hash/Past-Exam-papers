async function run() {
  const res = await fetch('http://127.0.0.1:3000/api/orders/bb229f65-d8a8-49cf-b172-4d1f0b3bda0f/download');
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
run();
