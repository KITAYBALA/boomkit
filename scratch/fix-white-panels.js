const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function fixFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace light panels with dark blooket-panel
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/40 backdrop-blur-2xl rounded-\[2\.5rem\] p-6 border border-white\/10 shadow-\[0_20px_50px_rgba\(0,0,0,0\.5\)\]/g, 'blooket-panel p-6');
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 border border-white\/10/g, 'blooket-panel');
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/30 backdrop-blur-2xl shadow-2xl/g, 'blooket-panel');
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/30 border-t border-white\/10 backdrop-blur-md/g, 'blooket-panel border-t border-purple-800');
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/60 border border-dashed border-red-500\/30/g, 'blooket-panel border border-dashed border-red-500/30');
  
  // Realtime leaderbord fix
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/40/g, 'blooket-panel');
  content = content.replace(/bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/g, 'blooket-panel');

  // Input background inside chat (change to dark purple)
  content = content.replace(/className="flex-1 rounded-xl border border-white\/5 hover:bg-white\/5 text-white\/60 hover:text-white"/g, 'className="flex-1 rounded-xl border border-[#3b0764] bg-[#3b0764] text-white hover:bg-[#2e054e]"');
  content = content.replace(/bg-slate-50\/5/g, 'bg-[#3b0764]');
  content = content.replace(/bg-slate-100/g, 'bg-[#5b21b6]');
  content = content.replace(/text-slate-900/g, 'text-white');
  
  // Specific fix for chat container padding
  content = content.replace(/className="blooket-panel p-6"/g, 'className="blooket-panel p-6"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

walkDir(path.join(__dirname, '../components'), fixFile);
walkDir(path.join(__dirname, '../app'), fixFile);
console.log('Fixed white panels!');
