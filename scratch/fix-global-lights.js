const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceGlobalWhites(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace prominent light backgrounds with matching dark Blooket style backgrounds
  content = content.replace(/bg-white text-black/g, 'bg-yellow-500 text-slate-900');
  content = content.replace(/bg-white text-slate-900/g, 'bg-[#5b21b6] text-white');
  content = content.replace(/bg-slate-50 /g, 'bg-[#3b0764] ');
  content = content.replace(/bg-slate-100 /g, 'bg-[#4c1d95] ');
  content = content.replace(/bg-gray-100 /g, 'bg-[#4c1d95] ');
  
  // Specific catch for generic bg-white that is not part of hover/opacity classes
  // We only replace bg-white if it's followed by a space or quote, and not preceded by hover: or focus:
  content = content.replace(/(?<!hover:|focus:)bg-white(?=\s|")/g, 'bg-[#5b21b6]');
  
  // Also fix any text-slate-900 to text-white for visibility on dark purple
  content = content.replace(/(?<!hover:|focus:)text-slate-900(?=\s|")/g, 'text-white');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed lights globally in:', filePath);
  }
}

walkDir(path.join(__dirname, '../components'), replaceGlobalWhites);
walkDir(path.join(__dirname, '../app'), replaceGlobalWhites);
console.log('Global light fix done!');
