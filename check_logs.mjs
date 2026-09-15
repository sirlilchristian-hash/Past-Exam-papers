import fs from 'fs';
const serverCode = fs.readFileSync('server.ts', 'utf8');
console.log("Leaks 'secondName' in console.log?", serverCode.includes('console.log(secondName)') || serverCode.includes('console.log("secondName'));
