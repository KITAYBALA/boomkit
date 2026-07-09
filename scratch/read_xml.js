const fs = require('fs');
const path = require('path');

function readXml(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const xml = fs.readFileSync(filePath, 'utf8');
  // Match any <w:t>...</w:t> tags
  const matches = xml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g);
  const texts = [];
  for (const match of matches) {
    texts.append ? texts.append(match[1]) : texts.push(match[1]);
  }
  console.log(texts.join(''));
}

console.log("=== boomkit password.docx ===");
readXml(path.resolve(__dirname, 'docx_tmp1/word/document.xml'));

console.log("\n=== Secret boomkit code.docx ===");
readXml(path.resolve(__dirname, 'docx_tmp2/word/document.xml'));
