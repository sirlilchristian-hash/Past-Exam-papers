const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {';
const replacement = `app.get("/api/testpapers", async (req, res) => {
  const { data } = await supabaseAdmin.from("Papers").select("*").limit(1).single();
  res.json(data);
});
app.post("/api/admin/papers/:id/download", requireAdmin, async (req, res) => {`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('server.ts', content);
