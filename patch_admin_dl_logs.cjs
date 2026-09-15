const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {';
const replacement = `app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {
  console.log("Admin download hit:", req.params.id);`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('server.ts', content);
