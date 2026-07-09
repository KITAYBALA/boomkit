const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Sidebar Styles
content = content.replace(
  'bg-[#0a071d]/60 backdrop-blur-xl border-r border-white/5 shadow-2xl relative',
  'bg-[#4c1d95] shadow-xl relative border-r border-[#3b0764]'
);

// Sidebar active link
content = content.replace(
  /"bg-gradient-to-r from-purple-500\/10 to-pink-500\/5 border-l-4 border-purple-500 text-white font-black shadow-\[inset_0_0_12px_rgba\(168,85,247,0\.08\)\]"/g,
  '"bg-[#6d28d9] text-white font-black"'
);
// Sidebar inactive link
content = content.replace(
  /"text-slate-400\/80 hover:text-white hover:bg-white\/5 border-l-4 border-transparent font-bold"/g,
  '"text-purple-300 hover:text-white hover:bg-[#5b21b6] font-bold"'
);
// Sidebar text icons
content = content.replace(
  /text-purple-400 drop-shadow-\[0_0_8px_rgba\(168,85,247,0\.5\)\]/g,
  'text-yellow-400'
);

// Remove glowing pulses from sidebar
content = content.replace(
  /{isActive && \([\s]*<div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 animate-pulse" \/>[\s]*\)}/g,
  ''
);

// 2. Profile Header (Stats)
content = content.replace(
  /className={`flex-grow backdrop-blur-2xl rounded-\[2\.5rem\] p-8 border border-white\/10 shadow-\[0_0_50px_rgba\(0,0,0,0\.8\)\] relative overflow-hidden group transition-all duration-500 hover:border-orange-500\/30 \${currentUser\?\.bannerColor === "rainbow"[\s]*\? "bg-gradient-to-br from-red-500\/10 via-yellow-500\/10 via-green-500\/10 via-blue-500\/10 to-purple-500\/10"[\s]*: "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700\/40"[\s]*}`}/g,
  'className="flex-grow blooket-panel p-8 relative overflow-hidden group"'
);

// Remove Holographic grids & Nebulas in Stats Header
content = content.replace(
  /<div className="absolute inset-0 bg-\[linear-gradient\(rgba\(255,255,255,0\.02\)_1px,transparent_1px\),linear-gradient\(90deg,rgba\(255,255,255,0\.02\)_1px,transparent_1px\)\] bg-\[size:20px_20px\] pointer-events-none" \/>/g,
  ''
);
content = content.replace(
  /<div className="absolute -top-24 -right-24 w-56 h-56 bg-orange-500\/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500\/15 transition-all duration-700" \/>/g,
  ''
);

// Avatar in Stats Header
content = content.replace(
  /<div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-3xl blur opacity-30 group-hover\/avatar:opacity-60 transition duration-500" \/>/g,
  ''
);
content = content.replace(
  /w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl flex items-center justify-center text-5xl border border-white\/10 shadow-\[0_8px_25px_rgba\(0,0,0,0\.5\)\] relative overflow-hidden transform transition-all duration-500 group-hover\/avatar:scale-105 group-hover\/avatar:rotate-2 p-2/g,
  'w-28 h-28 bg-purple-900 rounded-[2rem] flex items-center justify-center text-5xl border-b-4 border-purple-950 relative overflow-hidden transform transition-all duration-500 p-2'
);
content = content.replace(
  /<div className="absolute inset-0 bg-gradient-to-tr from-white\/5 to-transparent pointer-events-none" \/>/g,
  ''
);

// Username styling (from gradient to flat white/yellow)
content = content.replace(
  /className="font-heading text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 drop-shadow-\[0_2px_10px_rgba\(249,115,22,0\.3\)\]"/g,
  'className="font-heading text-4xl md:text-5xl font-black text-white"'
);
content = content.replace(
  /className="font-heading text-4xl md:text-5xl font-black text-white drop-shadow-md"/g,
  'className="font-heading text-4xl md:text-5xl font-black text-white"'
);

// Stat Cards Container (Grid of 4)
content = content.replace(
  /className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"/g,
  'className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-[#4c1d95] p-6 rounded-[2rem]"'
);

// Individual Stat Cards inside
content = content.replace(
  /className="bg-slate-950\/40 backdrop-blur-xl border border-white\/10 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl"/g,
  'className="bg-[#3b0764] rounded-[1.5rem] p-6 relative overflow-hidden group shadow-[0_4px_0_rgba(0,0,0,0.2)]"'
);

// Stat card internal glow removal
content = content.replace(
  /<div className={`absolute -right-4 -bottom-4 w-24 h-24 \${stat\.color\.replace\("text-", "bg-"\)}\/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} \/>/g,
  ''
);
// Stat icon frame
content = content.replace(
  /className={`w-10 h-10 rounded-2xl bg-slate-900\/80 border border-white\/5 flex items-center justify-center mb-4 shadow-inner \${stat\.color}`}/g,
  'className={`w-10 h-10 rounded-2xl bg-[#5b21b6] flex items-center justify-center mb-4 ${stat.color}`}'
);
content = content.replace(
  /text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm/g,
  'text-3xl md:text-4xl font-black text-white'
);

// 3. Landing page update
content = content.replace(
  /className="h-14 px-10 text-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl shadow-\[0_0_30px_rgba\(168,85,247,0\.4\)\] transition-all hover:scale-105 active:scale-\[0\.98\]"/g,
  'className="blooket-button bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black h-14 px-10 text-2xl"'
);

// Landing page Title
content = content.replace(
  /className="font-heading text-6xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-purple-200 drop-shadow-\[0_0_30px_rgba\(255,255,255,0\.3\)\]"/g,
  'className="font-heading text-7xl md:text-[120px] font-black mb-6 text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.2)]"'
);
content = content.replace(
  /className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed"/g,
  'className="text-xl md:text-2xl text-purple-100 font-bold max-w-2xl mx-auto"'
);


fs.writeFileSync(targetPath, content, 'utf8');
console.log('Layout Refactoring Complete!');
