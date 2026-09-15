const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const target1 = `                  onClick={() => {
                    alert(\`Downloading administrator copy of \${viewingPaper.unit_code} (\${viewingPaper.paper_title})\`);
                  }}`;
const replacement1 = `                  onClick={() => {
                    setDownloadAdminPaper(viewingPaper);
                    setDownloadAdminPassword('');
                  }}`;

const target2 = `                onClick={() => {
                  alert(\`Re-downloading PDF copy of \${selectedInquiryTx.unit_code} for student \${selectedInquiryTx.studentFirstName} \${selectedInquiryTx.studentSecondName}\`);
                }}`;
const replacement2 = `                onClick={() => {
                  alert("Student PDF copies cannot be re-downloaded securely. Ask the student to re-request.");
                }}`;

if(content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log("Fixed viewingPaper download alert");
}
if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log("Fixed selectedInquiryTx download alert");
}

fs.writeFileSync('src/components/AdminPortal.tsx', content);
