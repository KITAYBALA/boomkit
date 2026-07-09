const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replacements for layout containers
content = content.replace(/bg-\[#050212\]/g, 'bg-sky-50 dark:bg-slate-900');

// Replace glass panels with blooket cards
content = content.replace(/bg-slate-950\/[0-9]+ backdrop-blur-(md|xl|2xl) border border-white\/10( shadow-[a-zA-Z0-9_\-\[\]\(\)\.,]+)?( rounded-\[[\w\.]+\])?/g, 'blooket-card');
content = content.replace(/bg-slate-950\/[0-9]+ border border-white\/10( shadow-[a-zA-Z0-9_\-\[\]\(\)\.,]+)?( rounded-\[[\w\.]+\])?/g, 'blooket-card');
content = content.replace(/bg-slate-950/g, 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700');

// Replace neon text glows
content = content.replace(/text-gradient-purple-pink/g, 'text-pink-600 dark:text-pink-400 font-black');
content = content.replace(/text-gradient-cyan-blue/g, 'text-blue-600 dark:text-blue-400 font-black');
content = content.replace(/text-gradient-gold/g, 'text-yellow-500 font-black');

// Update font families (headings)
content = content.replace(/className="text-/g, 'className="font-heading text-');
content = content.replace(/font-sans/g, '');

// Save changes
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Refactoring complete!');
