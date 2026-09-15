import { PDFDocument } from 'pdf-lib';

async function run() {
  const res = await fetch('http://127.0.0.1:3000/api/orders/46dc4942-7d7b-45a4-ba99-4b1c8b7c9ebe/download');
  const buffer = await res.arrayBuffer();
  
  console.log("Downloaded bytes:", buffer.byteLength);

  try {
    await PDFDocument.load(buffer);
    console.log("Loaded without password! (FAILED TEST)");
  } catch(e) {
    console.log("No password attempt:", e.message);
  }

  try {
    await PDFDocument.load(buffer, { password: 'Alpha' });
    console.log("Loaded with 'Alpha'! (FAILED TEST)");
  } catch(e) {
    console.log("'Alpha' password attempt:", e.message);
  }

  try {
    const doc = await PDFDocument.load(buffer, { password: 'Bravo' });
    console.log("Loaded with 'Bravo'! (SUCCESS)");
    
    // Check content
    const pages = doc.getPages();
    console.log("Pages:", pages.length);
  } catch(e) {
    console.log("'Bravo' password attempt:", e.message);
  }
}
run();
