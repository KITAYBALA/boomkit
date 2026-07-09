const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(/min-h-screen/g, 'min-h-screen blooket-bg');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Added blooket-bg');
