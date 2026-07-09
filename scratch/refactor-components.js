const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/bg-slate-950\/[0-9]+ backdrop-blur-(md|xl|2xl) border border-white\/10( shadow-[a-zA-Z0-9_\-\[\]\(\)\.,]+)?( rounded-\[[\w\.]+\])?/g, 'blooket-card');
  content = content.replace(/bg-slate-950\/[0-9]+ border border-white\/10( shadow-[a-zA-Z0-9_\-\[\]\(\)\.,]+)?( rounded-\[[\w\.]+\])?/g, 'blooket-card');
  content = content.replace(/bg-slate-950/g, 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700');
  
  content = content.replace(/text-gradient-purple-pink/g, 'text-pink-600 dark:text-pink-400 font-black');
  content = content.replace(/text-gradient-cyan-blue/g, 'text-blue-600 dark:text-blue-400 font-black');
  content = content.replace(/text-gradient-gold/g, 'text-yellow-500 font-black');
  
  // Font headings
  content = content.replace(/className="text-/g, 'className="font-heading text-');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refactored:', filePath);
  }
}

walkDir(path.join(__dirname, '../components'), refactorFile);
console.log('Components refactoring complete!');
