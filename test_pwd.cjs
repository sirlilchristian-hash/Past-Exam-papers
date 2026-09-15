const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const fileBytes = fs.readFileSync('test_paid.pdf'); // Wait, we didn't save it properly.
  // We'll fetch it and parse directly.
}
run();
