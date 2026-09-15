const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const targetStr = `      if (!res.ok) {
         throw new Error("Failed to download");
      }`;
const replacementStr = `      if (!res.ok) {
         const errText = await res.text();
         throw new Error(errText);
      }`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminPortal.tsx', content);
  console.log("Updated UI logs");
} else {
  console.log("Could not find UI string");
}
