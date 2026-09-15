const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {
  console.log("Admin download hit:", req.params.id);
  const { id } = req.params;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", id)
      .maybeSingle();

    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper file not found in repository." });
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from Storage:", downloadErr);
      return res.status(500).json({ error: "Failed to retrieve the document." });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    
    const encryptedBytes = await encryptPDF(pdfUint8, password, { algorithm: 'RC4' });
    
    const outputFilename = \`\${paper.unit_code}_Exam.pdf\`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="\${outputFilename}"\`);
    
    return res.send(Buffer.from(encryptedBytes));
  } catch (err) {
    console.error("Error generating protected admin download:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});`;

const replacement = `app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {
  console.log("Admin download hit:", req.params.id);
  const { id } = req.params;
  const { password } = req.body;
  console.log("Password present:", !!password);
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", id)
      .maybeSingle();

    console.log("Paper lookup:", { found: !!paper, error: paperErr });
    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper file not found in repository." });
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    console.log("Storage download:", { found: !!fileData, error: downloadErr });
    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from Storage:", downloadErr);
      return res.status(500).json({ error: "Failed to retrieve the document." });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    console.log("File loaded to Uint8Array. Size:", pdfUint8.length);
    
    const encryptedBytes = await encryptPDF(pdfUint8, password, { algorithm: 'RC4' });
    console.log("File encrypted. Size:", encryptedBytes.length);
    
    const outputFilename = \`\${paper.unit_code}_Exam.pdf\`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="\${outputFilename}"\`);
    
    return res.send(Buffer.from(encryptedBytes));
  } catch (err) {
    console.error("Error generating protected admin download:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync('server.ts', content);
  console.log("Added more logs");
} else {
  console.log("Could not find string");
}
