const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace any stray 'bg-white' buttons with primary theme button (e.g., bg-[#5b21b6])
  content = content.replace(/bg-white text-black/g, 'bg-[#5b21b6] text-white hover:bg-[#6d28d9]');
  content = content.replace(/bg-white hover:bg-slate-100/g, 'bg-[#5b21b6] hover:bg-[#6d28d9]');
  content = content.replace(/bg-slate-100 text-slate-900/g, 'bg-[#5b21b6] text-white');
  
  // Replace white text areas / inputs with dark matching color
  content = content.replace(/bg-slate-50 text-slate-900/g, 'bg-[#3b0764] text-white border-[#5b21b6]');
  content = content.replace(/bg-white/g, 'bg-[#5b21b6]'); // Catch any remaining generic bg-white (usually small icons/buttons in this context)
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed lights in:', filePath);
  }
}

replaceInFile(path.join(__dirname, '../components/realtime-chat.tsx'));
replaceInFile(path.join(__dirname, '../components/private-chat.tsx'));
console.log('Done fixing chat colors!');
