const { encryptPDF } = require("@pdfsmaller/pdf-encrypt");
const fs = require('fs');

async function run() {
  try {
    const b1 = fs.readFileSync('test_plain.pdf'); // Wait, I don't have it locally, let me download it
  } catch (e) {
    console.log(e);
  }
}
run();
