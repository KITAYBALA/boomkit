const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/boom-avatar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define the 78 new booms as a JS string to append to the BLOOKS object
const newBoomsStr = `,
  // 1. AI Pack Additions
  Midjourney: {
    bg: "from-indigo-900 via-indigo-950 to-black",
    border: "border-indigo-800",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="50" r="16" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4" />
        <path d="M 40 50 L 60 50 M 50 40 L 50 60" stroke="white" strokeWidth="2" />
      </>
    )
  },
  "Stable Diffusion": {
    bg: "from-violet-600 to-fuchsia-800",
    border: "border-violet-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 35 30 L 65 30 L 50 70 Z" fill="#a855f7" opacity="0.6" />
        <circle cx="50" cy="30" r="6" fill="#f472b6" />
      </>
    )
  },
  Llama: {
    bg: "from-orange-100 to-amber-200",
    border: "border-amber-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 25 15 L 35 30 L 20 30 Z" fill="#fcd34d" />
        <path d="M 75 15 L 65 30 L 80 30 Z" fill="#fcd34d" />
        <rect x="40" y="52" width="20" height="15" rx="6" fill="#fef3c7" />
      </>
    )
  },
  Mistral: {
    bg: "from-cyan-800 to-slate-900",
    border: "border-cyan-700",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 20 40 Q 50 20 80 40 M 25 50 Q 50 30 75 50" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
      </>
    )
  },
  Anthropic: {
    bg: "from-red-800 to-amber-700",
    border: "border-red-700",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <text x="50" y="75" fontSize="36" fontWeight="black" fill="#fde68a" textAnchor="middle">A</text>
      </>
    )
  },
  Sora: {
    bg: "from-rose-500 via-purple-600 to-indigo-850",
    border: "border-rose-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 40 L 60 40 L 70 30 L 70 70 L 60 60 L 30 60 Z" fill="white" opacity="0.9" />
        <circle cx="45" cy="50" r="5" fill="#ec4899" />
      </>
    )
  },

  // 2. Bug Pack Additions
  Ladybug: {
    bg: "from-red-600 to-red-800",
    border: "border-red-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <line x1="50" y1="12" x2="50" y2="88" stroke="black" strokeWidth="4" />
        <circle cx="30" cy="30" r="5" fill="black" />
        <circle cx="70" cy="30" r="5" fill="black" />
        <circle cx="28" cy="65" r="6" fill="black" />
        <circle cx="72" cy="65" r="6" fill="black" />
      </>
    )
  },
  Caterpillar: {
    bg: "from-green-400 to-emerald-600",
    border: "border-green-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="20" cy="80" r="10" fill="#a3e635" />
        <circle cx="50" cy="80" r="10" fill="#84cc16" />
        <circle cx="80" cy="80" r="10" fill="#65a30d" />
      </>
    )
  },
  Ant: {
    bg: "from-stone-700 to-stone-900",
    border: "border-stone-600",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 40 15 Q 30 5 20 12 M 60 15 Q 70 5 80 12" stroke="#44403c" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    )
  },
  Snail: {
    bg: "from-yellow-200 to-amber-400",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 15 85 L 85 85" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
        <circle cx="50" cy="50" r="22" fill="#ca8a04" stroke="#78350f" strokeWidth="4" />
        <path d="M 50 50 Q 55 55 50 60 Q 40 50 50 40" fill="none" stroke="#78350f" strokeWidth="2.5" />
      </>
    )
  },
  Scorpion: {
    bg: "from-neutral-800 to-black",
    border: "border-neutral-700",
    eyes: "spider",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 88 C 60 100 80 90 80 70 C 80 50 60 50 60 40" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        <path d="M 55 35 L 65 40 L 60 45 Z" fill="#ef4444" />
      </>
    )
  },
  Glowworm: {
    bg: "from-emerald-900 to-green-950",
    border: "border-emerald-850",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="30" y="70" width="40" height="20" rx="8" fill="#a3e635" opacity="0.9" />
        <circle cx="50" cy="80" r="15" fill="#facc15" opacity="0.7" />
      </>
    )
  },

  // 3. Pirate Pack Additions
  "Pirate Hat": {
    bg: "from-slate-900 to-black",
    border: "border-slate-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 15 50 Q 50 20 85 50 Q 50 60 15 50 Z" fill="#1e293b" stroke="white" strokeWidth="2" />
        <circle cx="50" cy="42" r="6" fill="#ca8a04" />
        <path d="M 45 42 L 55 42 M 50 37 L 50 47" stroke="white" strokeWidth="2" />
      </>
    )
  },
  Spyglass: {
    bg: "from-yellow-600 to-amber-800",
    border: "border-yellow-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="42" y="20" width="16" height="50" fill="#d97706" stroke="#ca8a04" strokeWidth="2" />
        <rect x="38" y="70" width="24" height="12" fill="#92400e" />
        <circle cx="50" cy="18" r="8" fill="#38bdf8" opacity="0.8" />
      </>
    )
  },
  Cannon: {
    bg: "from-slate-700 to-slate-900",
    border: "border-slate-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="35" y="30" width="30" height="45" rx="5" fill="#334155" transform="rotate(-20 50 50)" />
        <circle cx="50" cy="75" r="10" fill="black" />
      </>
    )
  },
  Anchor: {
    bg: "from-slate-400 to-slate-600",
    border: "border-slate-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 20 L 50 75 M 30 55 C 30 75 70 75 70 55 M 25 55 L 35 55 M 65 55 L 75 55" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <circle cx="50" cy="22" r="8" fill="none" stroke="white" strokeWidth="5" />
      </>
    )
  },
  "Pegleg Captain": {
    bg: "from-red-900 to-stone-950",
    border: "border-red-800",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 20 25 L 80 25 L 50 10 Z" fill="black" />
        <rect x="25" y="38" width="18" height="15" fill="black" />
        <line x1="12" y1="35" x2="88" y2="48" stroke="black" strokeWidth="3.5" />
      </>
    )
  },
  "Blackbeard's Map": {
    bg: "from-yellow-100 to-amber-200",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 20 20 L 80 20 L 75 80 L 25 80 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
        <text x="50" y="55" fontSize="24" fill="#ef4444" fontWeight="bold" textAnchor="middle">X</text>
        <path d="M 30 30 Q 50 45 70 30" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="3" />
      </>
    )
  },

  // 4. Space Pack Additions
  Rocket: {
    bg: "from-slate-800 to-indigo-950",
    border: "border-slate-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 15 L 65 45 L 35 45 Z" fill="white" />
        <rect x="38" y="45" width="24" height="30" fill="white" />
        <path d="M 35 60 L 25 75 L 35 75 Z" fill="#ef4444" />
        <path d="M 65 60 L 75 75 L 65 75 Z" fill="#ef4444" />
        <circle cx="50" cy="55" r="6" fill="#38bdf8" />
      </>
    )
  },
  Astronaut: {
    bg: "from-blue-900 to-slate-950",
    border: "border-blue-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="32" fill="white" />
        <rect x="26" y="32" width="48" height="30" rx="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
        <path d="M 32 40 Q 50 48 68 40" stroke="white" strokeWidth="1.5" fill="none" />
      </>
    )
  },
  Meteorite: {
    bg: "from-stone-600 to-stone-800",
    border: "border-stone-500",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <circle cx="30" cy="30" r="8" fill="#44403c" />
        <circle cx="68" cy="60" r="10" fill="#44403c" />
        <circle cx="45" cy="70" r="6" fill="#44403c" />
      </>
    )
  },
  Satellite: {
    bg: "from-slate-700 to-indigo-900",
    border: "border-slate-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="44" y="25" width="12" height="50" fill="#94a3b8" />
        <rect x="15" y="40" width="25" height="15" fill="#3b82f6" stroke="white" strokeWidth="1" />
        <rect x="60" y="40" width="25" height="15" fill="#3b82f6" stroke="white" strokeWidth="1" />
      </>
    )
  },
  Supernova: {
    bg: "from-orange-500 via-red-600 to-purple-900",
    border: "border-orange-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 50 5 L 55 35 L 85 35 L 60 55 L 70 85 L 50 65 L 30 85 L 40 55 L 15 35 L 45 35 Z" fill="#facc15" opacity="0.85" />
      </>
    )
  },
  "Dark Matter": {
    bg: "from-purple-950 via-slate-950 to-black",
    border: "border-purple-900",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        <ellipse cx="50" cy="50" rx="35" ry="12" fill="#818cf8" opacity="0.3" transform="rotate(-25 50 50)" />
        <circle cx="50" cy="50" r="8" fill="#c084fc" opacity="0.6" />
      </>
    )
  },

  // 5. Medieval Pack Additions
  Shield: {
    bg: "from-slate-400 to-slate-600",
    border: "border-slate-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 20 20 L 80 20 L 75 55 Q 50 85 25 55 Z" fill="#3b82f6" stroke="#cbd5e1" strokeWidth="4" />
        <path d="M 50 20 L 50 75 M 20 45 L 80 45" stroke="#cbd5e1" strokeWidth="4" />
      </>
    )
  },
  Sword: {
    bg: "from-slate-300 to-slate-500",
    border: "border-slate-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 47 15 L 53 15 L 53 65 L 47 65 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="35" y="65" width="30" height="5" rx="1.5" fill="#fbbf24" />
        <rect x="47" y="70" width="6" height="18" fill="#78350f" />
      </>
    )
  },
  Knight: {
    bg: "from-slate-600 to-slate-800",
    border: "border-slate-500",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <rect x="25" y="38" width="50" height="16" rx="4" fill="#1e293b" />
        <line x1="30" y1="46" x2="70" y2="46" stroke="#ef4444" strokeWidth="3" />
      </>
    )
  },
  Jester: {
    bg: "from-pink-500 to-purple-600",
    border: "border-pink-400",
    eyes: "cute",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 20 28 Q 15 5 35 15 M 80 28 Q 85 5 65 15" stroke="#eab308" strokeWidth="4" fill="none" />
        <circle cx="35" cy="15" r="5" fill="#facc15" />
        <circle cx="65" cy="15" r="5" fill="#facc15" />
      </>
    )
  },
  Archmage: {
    bg: "from-violet-700 via-purple-800 to-indigo-900",
    border: "border-violet-600",
    eyes: "wizard",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 40 L 50 10 L 88 40 Z" fill="#4c1d95" opacity="0.85" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="#facc15" strokeWidth="2.5" opacity="0.6" />
      </>
    )
  },
  "Holy Grail": {
    bg: "from-amber-400 to-yellow-600",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 30 25 L 70 25 L 60 55 Q 50 65 40 55 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="3" />
        <rect x="46" y="55" width="8" height="20" fill="#eab308" />
        <rect x="35" y="75" width="30" height="6" rx="2" fill="#ca8a04" />
        <circle cx="50" cy="40" r="4" fill="#ef4444" />
      </>
    )
  },

  // 6. Safari Pack Additions
  Zebra: {
    bg: "from-slate-100 to-slate-300",
    border: "border-slate-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="12" y="22" width="25" height="6" fill="black" />
        <rect x="63" y="22" width="25" height="6" fill="black" />
        <rect x="12" y="42" width="35" height="6" fill="black" />
        <rect x="53" y="42" width="35" height="6" fill="black" />
        <rect x="12" y="62" width="28" height="6" fill="black" />
        <rect x="60" y="62" width="28" height="6" fill="black" />
      </>
    )
  },
  Meerkat: {
    bg: "from-amber-600 to-amber-800",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="34" cy="46" rx="11" ry="8" fill="#451a03" opacity="0.75" />
        <ellipse cx="66" cy="46" rx="11" ry="8" fill="#451a03" opacity="0.75" />
      </>
    )
  },
  Cheetah: {
    bg: "from-yellow-400 to-amber-500",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="25" cy="30" r="3.5" fill="black" />
        <circle cx="75" cy="30" r="3.5" fill="black" />
        <circle cx="50" cy="35" r="3" fill="black" />
        <circle cx="32" cy="68" r="4" fill="black" />
        <circle cx="68" cy="68" r="4" fill="black" />
        <path d="M 33 46 Q 37 54 37 60 M 67 46 Q 63 54 63 60" stroke="black" strokeWidth="2.5" fill="none" />
      </>
    )
  },
  Hippo: {
    bg: "from-slate-500 to-slate-700",
    border: "border-slate-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="40" cy="72" rx="4" ry="6" fill="#1e293b" />
        <ellipse cx="60" cy="72" rx="4" ry="6" fill="#1e293b" />
        <rect x="32" y="80" width="36" height="8" rx="3" fill="#94a3b8" />
      </>
    )
  },
  Gorilla: {
    bg: "from-neutral-800 to-neutral-950",
    border: "border-neutral-700",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <rect x="22" y="32" width="56" height="10" rx="3" fill="#171717" />
        <path d="M 30 42 C 30 38 70 38 70 42 Z" fill="#262626" />
      </>
    )
  },
  "Albino Crocodile": {
    bg: "from-zinc-100 to-zinc-300",
    border: "border-zinc-200",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 30 65 L 70 65 L 60 85 L 40 85 Z" fill="#cbd5e1" />
        <polygon points="35,65 40,72 45,65" fill="white" />
        <polygon points="55,65 60,72 65,65" fill="white" />
      </>
    )
  },

  // 7. Aquatic Pack Additions
  Starfish: {
    bg: "from-rose-400 to-orange-500",
    border: "border-rose-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 50 10 L 62 38 L 92 38 L 68 56 L 77 86 L 50 68 L 23 86 L 32 56 L 8 38 L 38 38 Z" fill="#fda4af" opacity="0.5" />
      </>
    )
  },
  Crab: {
    bg: "from-red-500 to-orange-600",
    border: "border-red-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 20 25 C 10 15 5 35 20 35 Z" fill="#ef4444" />
        <path d="M 80 25 C 90 15 95 35 80 35 Z" fill="#ef4444" />
      </>
    )
  },
  Shark: {
    bg: "from-slate-400 to-blue-600",
    border: "border-slate-350",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 12 12 Q 35 25 50 12 L 50 25 Z" fill="#64748b" />
        <polygon points="32,60 36,68 40,60" fill="white" />
        <polygon points="44,60 48,68 52,60" fill="white" />
        <polygon points="56,60 60,68 64,60" fill="white" />
      </>
    )
  },
  Jellyfish: {
    bg: "from-pink-400 via-purple-400 to-indigo-600",
    border: "border-pink-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 88 Q 33 70 35 88 Q 38 70 40 88" stroke="#f472b6" strokeWidth="2.5" fill="none" />
        <path d="M 50 88 Q 53 70 55 88 Q 58 70 60 88" stroke="#c084fc" strokeWidth="2.5" fill="none" />
        <path d="M 70 88 Q 73 70 75 88 Q 78 70 80 88" stroke="#f472b6" strokeWidth="2.5" fill="none" />
      </>
    )
  },
  Stingray: {
    bg: "from-cyan-800 to-slate-900",
    border: "border-cyan-700",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 50 L 50 20 L 88 50 L 50 80 Z" fill="#0891b2" opacity="0.35" />
        <line x1="50" y1="80" x2="50" y2="98" stroke="#0891b2" strokeWidth="3.5" />
      </>
    )
  },
  "Atlantis Crown": {
    bg: "from-teal-400 via-cyan-500 to-blue-600",
    border: "border-teal-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 22 75 L 28 35 L 42 55 L 50 25 L 58 55 L 72 35 L 78 75 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="3" />
        <circle cx="50" cy="25" r="5" fill="#38bdf8" />
        <circle cx="28" cy="35" r="4" fill="#38bdf8" />
        <circle cx="72" cy="35" r="4" fill="#38bdf8" />
      </>
    )
  },

  // 8. Breakfast Pack Additions
  Pancake: {
    bg: "from-amber-300 to-yellow-500",
    border: "border-amber-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="40" y="28" width="20" height="14" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
        <path d="M 25 45 Q 50 55 75 45" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.75" />
      </>
    )
  },
  Toast: {
    bg: "from-amber-200 to-amber-700",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 18 18 L 82 18 C 88 35 88 65 82 82 L 18 82 C 12 65 12 35 18 18 Z" fill="none" stroke="#78350f" strokeWidth="4" />
      </>
    )
  },
  "Coffee Mug": {
    bg: "from-red-500 to-red-700",
    border: "border-red-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 88 35 C 98 35 98 65 88 65" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
        <path d="M 40 10 Q 45 5 40 2 M 50 10 Q 55 5 50 2 M 60 10 Q 65 5 60 2" stroke="white" strokeWidth="2" fill="none" />
      </>
    )
  },
  "Orange Juice": {
    bg: "from-orange-400 to-orange-600",
    border: "border-orange-350",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <line x1="12" y1="35" x2="88" y2="35" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="50" cy="24" r="8" fill="#fdba74" stroke="white" strokeWidth="2" />
      </>
    )
  },
  Omelette: {
    bg: "from-yellow-300 to-yellow-500",
    border: "border-yellow-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="50" cy="55" rx="32" ry="24" fill="#fde047" opacity="0.6" />
        <circle cx="35" cy="50" r="3" fill="#22c55e" />
        <circle cx="65" cy="60" r="3" fill="#22c55e" />
        <circle cx="50" cy="45" r="3.5" fill="#ef4444" />
      </>
    )
  },
  "Golden Syrup": {
    bg: "from-amber-400 via-yellow-500 to-amber-600",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 12 12 L 88 12 L 88 40 Q 75 55 65 40 Q 50 60 40 40 Q 25 55 12 40 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      </>
    )
  },

  // 9. Dino Pack Additions
  Raptor: {
    bg: "from-emerald-700 to-teal-900",
    border: "border-emerald-600",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 15 20 Q 30 15 35 30 M 85 20 Q 70 15 65 30" stroke="#047857" strokeWidth="3" fill="none" />
      </>
    )
  },
  Brachiosaurus: {
    bg: "from-emerald-500 to-green-700",
    border: "border-emerald-450",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 88 Q 30 40 50 40 Q 55 40 55 50 Q 50 60 42 88 Z" fill="#15803d" />
      </>
    )
  },
  "T-Rex": {
    bg: "from-red-600 to-rose-800",
    border: "border-red-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <polygon points="30,60 34,66 38,60" fill="white" />
        <polygon points="42,60 46,66 50,60" fill="white" />
        <rect x="25" y="70" width="8" height="5" rx="1" fill="#be123c" />
        <rect x="67" y="70" width="8" height="5" rx="1" fill="#be123c" />
      </>
    )
  },
  Ankylosaurus: {
    bg: "from-amber-700 to-stone-800",
    border: "border-amber-600",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 50 L 22 40 L 22 60 Z" fill="#ca8a04" />
        <path d="M 88 50 L 78 40 L 78 60 Z" fill="#ca8a04" />
        <path d="M 50 12 L 40 22 L 60 22 Z" fill="#ca8a04" />
      </>
    )
  },
  Spinosaurus: {
    bg: "from-orange-600 to-red-800",
    border: "border-orange-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 18 12 Q 50 -10 82 12 Z" fill="#ca8a04" opacity="0.75" />
      </>
    )
  },
  "Amber Mosquito": {
    bg: "from-yellow-400 via-amber-400 to-yellow-600",
    border: "border-yellow-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="18" fill="black" opacity="0.8" />
        <line x1="32" y1="42" x2="68" y2="58" stroke="white" strokeWidth="2" opacity="0.3" />
        <line x1="32" y1="58" x2="68" y2="42" stroke="white" strokeWidth="2" opacity="0.3" />
      </>
    )
  },

  // 10. Bot Pack Additions
  Microchip: {
    bg: "from-emerald-800 to-green-950",
    border: "border-emerald-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="30" y="30" width="40" height="40" fill="black" stroke="#eab308" strokeWidth="2" />
        <line x1="12" y1="40" x2="30" y2="40" stroke="#eab308" strokeWidth="3.5" />
        <line x1="12" y1="50" x2="30" y2="50" stroke="#eab308" strokeWidth="3.5" />
        <line x1="12" y1="60" x2="30" y2="60" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="40" x2="88" y2="40" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="50" x2="88" y2="50" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="60" x2="88" y2="60" stroke="#eab308" strokeWidth="3.5" />
      </>
    )
  },
  "Floppy Disk": {
    bg: "from-blue-900 to-black",
    border: "border-blue-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="22" y="22" width="56" height="56" rx="4" fill="#1e293b" />
        <rect x="32" y="22" width="36" height="20" fill="white" />
        <rect x="35" y="56" width="30" height="22" fill="#cbd5e1" />
      </>
    )
  },
  Nanobot: {
    bg: "from-cyan-600 to-slate-900",
    border: "border-cyan-500",
    eyes: "cyborg",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="14" fill="#0891b2" />
        <path d="M 35 60 L 25 75 M 65 60 L 75 75" stroke="white" strokeWidth="2.5" />
      </>
    )
  },
  "Mech Suit": {
    bg: "from-slate-500 to-zinc-700",
    border: "border-slate-400",
    eyes: "cyborg",
    mouth: "grin",
    decorations: (
      <>
        <polygon points="50,68 62,54 38,54" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
      </>
    )
  },
  Android: {
    bg: "from-green-500 to-emerald-600",
    border: "border-green-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <line x1="35" y1="20" x2="25" y2="8" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="65" y1="20" x2="75" y2="8" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
      </>
    )
  },
  "Glitch Code": {
    bg: "from-black to-slate-900",
    border: "border-slate-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <text x="50" y="42" fontSize="16" fill="#22c55e" fontFamily="monospace" textAnchor="middle">101</text>
        <text x="50" y="65" fontSize="16" fill="#22c55e" fontFamily="monospace" textAnchor="middle">010</text>
      </>
    )
  },

  // 11. Wonderland Pack Additions
  "Mad Hatter": {
    bg: "from-green-700 to-teal-900",
    border: "border-green-600",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 22 35 L 78 35 L 70 8 L 30 8 Z" fill="#047857" stroke="black" strokeWidth="2" />
        <rect x="36" y="24" width="28" height="10" fill="#facc15" />
        <text x="50" y="22" fontSize="9" fontWeight="bold" fill="black" textAnchor="middle">10/6</text>
      </>
    )
  },
  "Tea Cup": {
    bg: "from-pink-300 to-slate-100",
    border: "border-pink-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 25 35 Q 50 20 75 35 L 70 75 Q 50 85 30 75 Z" fill="white" />
        <path d="M 72 45 C 80 45 80 65 72 65" fill="none" stroke="white" strokeWidth="4" />
      </>
    )
  },
  "March Hare": {
    bg: "from-amber-500 to-amber-700",
    border: "border-amber-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="32" cy="18" rx="6" ry="16" fill="#fcd34d" transform="rotate(-15 32 18)" />
        <ellipse cx="68" cy="18" rx="6" ry="16" fill="#fcd34d" transform="rotate(15 68 18)" />
      </>
    )
  },
  "Card Soldier": {
    bg: "from-slate-100 to-slate-200",
    border: "border-slate-300",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <rect x="22" y="28" width="56" height="56" rx="2" fill="white" stroke="black" strokeWidth="2" />
        <path d="M 50 48 C 45 40 35 46 50 61 C 65 46 55 40 50 48 Z" fill="#ef4444" />
      </>
    )
  },
  "Caterpillar Hookah": {
    bg: "from-blue-600 to-indigo-800",
    border: "border-blue-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="22" r="10" fill="none" stroke="#e2e8f0" strokeWidth="3" opacity="0.6" />
      </>
    )
  },
  "Vorpal Blade": {
    bg: "from-slate-800 via-indigo-950 to-purple-950",
    border: "border-slate-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 46 15 L 54 15 L 52 65 L 48 65 Z" fill="#a78bfa" stroke="white" strokeWidth="1.5" />
        <line x1="35" y1="65" x2="65" y2="65" stroke="white" strokeWidth="3" />
      </>
    )
  },

  // 12. Outback Pack Additions
  Kangaroo: {
    bg: "from-amber-600 to-orange-700",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 18 L 25 2 L 38 12 Z" fill="#ca8a04" />
        <path d="M 70 18 L 75 2 L 62 12 Z" fill="#ca8a04" />
        <path d="M 30 70 Q 50 82 70 70 Z" fill="#ca8a04" stroke="white" strokeWidth="1" />
      </>
    )
  },
  Wombat: {
    bg: "from-stone-500 to-stone-700",
    border: "border-stone-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="56" r="6" fill="#292524" />
      </>
    )
  },
  Platypus: {
    bg: "from-teal-600 to-teal-850",
    border: "border-teal-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="35" y="52" width="30" height="12" rx="6" fill="#1e293b" />
      </>
    )
  },
  Echidna: {
    bg: "from-amber-800 to-amber-950",
    border: "border-amber-700",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 40 L 2 30 L 15 48 L 2 50 L 15 56 M 88 40 L 98 30 L 85 48 L 98 50 L 85 56" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  "Tasmanian Devil": {
    bg: "from-neutral-800 to-black",
    border: "border-neutral-700",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 28 68 Q 50 82 72 68" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    )
  },
  Didgeridoo: {
    bg: "from-amber-700 via-amber-800 to-yellow-900",
    border: "border-amber-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="42" y="15" width="16" height="70" rx="4" fill="#78350f" stroke="#eab308" strokeWidth="2.5" />
        <circle cx="50" cy="30" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx="50" cy="55" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      </>
    )
  },

  // 13. Ice Pack Additions
  Penguin: {
    bg: "from-sky-900 to-slate-950",
    border: "border-sky-850",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="50" cy="62" rx="26" ry="24" fill="white" />
        <polygon points="44,50 56,50 50,60" fill="#f59e0b" />
      </>
    )
  },
  Snowflake: {
    bg: "from-sky-300 to-blue-500",
    border: "border-sky-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <line x1="50" y1="18" x2="50" y2="82" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="28" x2="72" y2="72" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="72" x2="72" y2="28" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },
  Walrus: {
    bg: "from-amber-850 to-stone-700",
    border: "border-amber-800",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <line x1="40" y1="58" x2="40" y2="76" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="60" y1="58" x2="60" y2="76" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      </>
    )
  },
  Narwhal: {
    bg: "from-slate-600 to-blue-800",
    border: "border-slate-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <polygon points="48,25 52,25 50,-5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      </>
    )
  },
  "Snow Golem": {
    bg: "from-slate-100 to-slate-300",
    border: "border-slate-200",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <polygon points="46,46 54,46 50,54" fill="#f97316" />
        <rect x="30" y="24" width="40" height="6" fill="#78350f" />
      </>
    )
  },
  "Everlasting Ice": {
    bg: "from-cyan-300 via-blue-400 to-teal-500",
    border: "border-cyan-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <polygon points="50,20 80,40 80,70 50,90 20,70 20,40" fill="#38bdf8" stroke="white" strokeWidth="2.5" opacity="0.85" />
        <line x1="50" y1="20" x2="50" y2="90" stroke="white" strokeWidth="1.5" opacity="0.6" />
      </>
    )
  }`;

const builderComment = '// Blook SVG builder';
const builderCommentIndex = content.indexOf(builderComment);
if (builderCommentIndex === -1) {
  console.error("Could not find // Blook SVG builder comment");
  process.exit(1);
}
const beforeBuilder = content.slice(0, builderCommentIndex);
const afterBuilder = content.slice(builderCommentIndex);

// Find the last closing brace in beforeBuilder, which closes the BLOOKS object.
const lastCloseBraceIndex = beforeBuilder.lastIndexOf('}');
if (lastCloseBraceIndex === -1) {
  console.error("Could not find BLOOKS closing brace");
  process.exit(1);
}

const blooksConfigPart = beforeBuilder.slice(0, lastCloseBraceIndex);

// Let's replace the BlookSvg function and helpers up to BoomAvatar in afterBuilder
const blookSvgIndex = afterBuilder.indexOf('export function BlookSvg');
if (blookSvgIndex === -1) {
  console.error("Could not find export function BlookSvg in afterBuilder");
  process.exit(1);
}

const beforeBlookSvg = afterBuilder.slice(0, blookSvgIndex);
const afterBlookSvg = afterBuilder.slice(blookSvgIndex);

const nextComponentIndex = afterBlookSvg.indexOf('// Unified Avatar selector component');
if (nextComponentIndex === -1) {
  console.error("Could not find BoomAvatar component after BlookSvg");
  process.exit(1);
}

const blookSvgRefactored = `const TAILWIND_COLOR_MAP: Record<string, string> = {
  "red-100": "#fee2e2", "red-200": "#fecaca", "red-300": "#fca5a5", "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c", "red-800": "#991b1b", "red-900": "#7f1d1d",
  "orange-100": "#ffedd5", "orange-200": "#fed7aa", "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316", "orange-600": "#ea580c", "orange-700": "#c2410c", "orange-800": "#9a3412", "orange-900": "#7c2d12",
  "amber-100": "#fef3c7", "amber-200": "#fde68a", "amber-300": "#fcd34d", "amber-400": "#fbbf24", "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309", "amber-800": "#92400e", "amber-900": "#78350f",
  "yellow-100": "#fef9c3", "yellow-200": "#fef08a", "yellow-300": "#fde047", "yellow-400": "#facc15", "yellow-500": "#eab308", "yellow-600": "#ca8a04", "yellow-700": "#a16207", "yellow-800": "#854d0e", "yellow-900": "#713f12",
  "lime-100": "#f7fee7", "lime-200": "#d9f99d", "lime-300": "#bef264", "lime-400": "#a3e635", "lime-500": "#84cc16", "lime-600": "#65a30d", "lime-700": "#4d7c0f", "lime-800": "#3f6212", "lime-900": "#365314",
  "green-100": "#dcfce7", "green-200": "#bbf7d0", "green-300": "#86efac", "green-400": "#4ade80", "green-500": "#22c55e", "green-600": "#16a34a", "green-700": "#15803d", "green-800": "#166534", "green-900": "#14532d",
  "emerald-100": "#d1fae5", "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7", "emerald-400": "#34d399", "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857", "emerald-800": "#065f46", "emerald-900": "#064e3b",
  "teal-100": "#ccfbf1", "teal-200": "#99f6e4", "teal-300": "#5eead4", "teal-400": "#2dd4bf", "teal-500": "#14b8a6", "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59", "teal-900": "#134e4a",
  "cyan-100": "#cffafe", "cyan-200": "#a5f3fc", "cyan-300": "#67e8f9", "cyan-400": "#22d3ee", "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490", "cyan-800": "#155e75", "cyan-900": "#164e63",
  "sky-100": "#e0f2fe", "sky-200": "#bae6fd", "sky-300": "#7dd3fc", "sky-400": "#38bdf8", "sky-500": "#0ea5e9", "sky-600": "#0284c7", "sky-700": "#0369a1", "sky-800": "#075985", "sky-900": "#0c4a6e",
  "blue-100": "#dbeafe", "blue-200": "#bfdbfe", "blue-300": "#93c5fd", "blue-400": "#60a5fa", "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af", "blue-900": "#1e3a8a",
  "indigo-100": "#e0e7ff", "indigo-200": "#c7d2fe", "indigo-300": "#a5b4fc", "indigo-400": "#818cf8", "indigo-500": "#6366f1", "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-800": "#3730a3", "indigo-900": "#312e81",
  "violet-100": "#ede9fe", "violet-200": "#ddd6fe", "violet-300": "#c4b5fd", "violet-400": "#a78bfa", "violet-500": "#8b5cf6", "violet-600": "#7c3aed", "violet-700": "#6d28d9", "violet-800": "#5b21b6", "violet-900": "#4c1d95",
  "purple-100": "#f3e8ff", "purple-200": "#e9d5ff", "purple-300": "#d8b4fe", "purple-400": "#c084fc", "purple-500": "#a855f7", "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-800": "#6b21a8", "purple-900": "#581c87",
  "fuchsia-100": "#fae8ff", "fuchsia-200": "#f5d0fe", "fuchsia-300": "#f0abfc", "fuchsia-400": "#e879f9", "fuchsia-500": "#d946ef", "fuchsia-600": "#c026d3", "fuchsia-700": "#a21caf", "fuchsia-800": "#86198f", "fuchsia-900": "#701a75",
  "pink-100": "#fce7f3", "pink-200": "#fbcfe8", "pink-300": "#f472b6", "pink-400": "#f06292", "pink-500": "#ec4899", "pink-600": "#db2777", "pink-700": "#be185d", "pink-800": "#9d174d", "pink-900": "#831843",
  "rose-100": "#ffe4e6", "rose-200": "#fecdd3", "rose-300": "#fda4af", "rose-400": "#fb7185", "rose-500": "#f43f5e", "rose-600": "#e11d48", "rose-700": "#be123c", "rose-800": "#9f1239", "rose-900": "#881337",
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1", "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155", "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "zinc-50": "#fafafa", "zinc-100": "#f4f4f5", "zinc-200": "#e4e4e7", "zinc-300": "#d4d4d8", "zinc-400": "#a1a1aa", "zinc-500": "#71717a", "zinc-600": "#52525b", "zinc-700": "#3f3f46", "zinc-800": "#27272a", "zinc-900": "#18181b", "zinc-950": "#09090b",
  "neutral-50": "#fafafa", "neutral-100": "#f5f5f5", "neutral-200": "#e5e5e5", "neutral-300": "#d4d4d4", "neutral-400": "#a3a3a3", "neutral-500": "#737373", "neutral-600": "#525252", "neutral-700": "#404040", "neutral-800": "#262626", "neutral-900": "#171717", "neutral-950": "#0a0a0a",
  "stone-50": "#fafaf9", "stone-100": "#f5f5f4", "stone-200": "#e7e5e4", "stone-300": "#d6d3d1", "stone-400": "#a8a29e", "stone-500": "#78716c", "stone-600": "#57534e", "stone-700": "#44403c", "stone-800": "#292524", "stone-900": "#1c1917", "stone-950": "#0c0a09",
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db", "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151", "gray-800": "#1f2937", "gray-900": "#111827", "gray-950": "#030712",
  "black": "#000000",
  "white": "#ffffff"
};

function getHexForTailwindColor(twColor: string): string {
  if (twColor.startsWith("#") || twColor.startsWith("rgb") || twColor.startsWith("hsl")) {
    return twColor;
  }
  const colorName = twColor.split("/")[0];
  return TAILWIND_COLOR_MAP[colorName] || colorName;
}

function parseGradientStops(bgClass: string) {
  const parts = bgClass.split(" ");
  let fromColor = "#3b82f6";
  let toColor = "#1d4ed8";
  let viaColor: string | null = null;

  for (const part of parts) {
    if (part.startsWith("from-")) {
      fromColor = getHexForTailwindColor(part.replace("from-", ""));
    } else if (part.startsWith("to-")) {
      toColor = getHexForTailwindColor(part.replace("to-", ""));
    } else if (part.startsWith("via-")) {
      viaColor = getHexForTailwindColor(part.replace("via-", ""));
    }
  }
  return { fromColor, toColor, viaColor };
}

// Blook SVG builder
export function BlookSvg({ name, className = "w-12 h-12" }: { name: string; className?: string }) {
  const blook = BLOOKS[name]

  // Fallback if not configured
  if (!blook) {
    return (
      <svg viewBox="0 0 100 100" className={\`\${className} select-none overflow-visible\`}>
        <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#fallbackGrad)" stroke="#475569" strokeWidth="3" />
        <defs>
          <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <text x="50" y="58" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">❓</text>
      </svg>
    )
  }

  // Draw default eyes based on type
  const renderEyes = () => {
    if (blook.customEyes) return blook.customEyes

    switch (blook.eyes) {
      case "default":
        return (
          <g>
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="46" r="4.5" fill="black" />
            <circle cx="66" cy="46" r="8" fill="white" />
            <circle cx="66" cy="46" r="4.5" fill="black" />
          </g>
        )
      case "cute":
        return (
          <g>
            <circle cx="34" cy="46" r="9" fill="white" />
            <circle cx="34" cy="46" r="4" fill="#000" />
            <circle cx="36" cy="43" r="2" fill="#fff" />
            <circle cx="66" cy="46" r="9" fill="white" />
            <circle cx="66" cy="46" r="4" fill="#000" />
            <circle cx="68" cy="43" r="2" fill="#fff" />
          </g>
        )
      case "spider":
        return (
          <g fill="#ef4444">
            <circle cx="32" cy="35" r="3.5" />
            <circle cx="44" cy="35" r="3.5" />
            <circle cx="56" cy="35" r="3.5" />
            <circle cx="68" cy="35" r="3.5" />
            <circle cx="35" cy="45" r="5" />
            <circle cx="65" cy="45" r="5" />
          </g>
        )
      case "alien":
        return (
          <g>
            <path d="M 22 34 Q 38 32 36 50 Q 28 50 22 34 Z" fill="black" />
            <path d="M 78 34 Q 62 32 64 50 Q 72 50 78 34 Z" fill="black" />
            <circle cx="30" cy="40" r="2.5" fill="white" />
            <circle cx="70" cy="40" r="2.5" fill="white" />
          </g>
        )
      case "cyborg":
        return (
          <g>
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="46" r="4.5" fill="black" />
            <rect x="58" y="38" width="16" height="16" rx="2" fill="#ef4444" />
            <circle cx="66" cy="46" r="4.5" fill="black" />
          </g>
        )
      case "wizard":
        return (
          <g>
            <circle cx="35" cy="48" r="7" fill="white" />
            <circle cx="35" cy="48" r="3.5" fill="#1e3a8a" />
            <circle cx="65" cy="48" r="7" fill="white" />
            <circle cx="65" cy="48" r="3.5" fill="#1e3a8a" />
            <line x1="42" y1="48" x2="58" y2="48" stroke="#facc15" strokeWidth="2.5" />
          </g>
        )
      case "cat":
        return (
          <g>
            <path d="M 25 42 Q 35 34 40 46 Q 30 48 25 42 Z" fill="#fbbf24" />
            <ellipse cx="32" cy="44" rx="2" ry="5" fill="black" />
            <path d="M 75 42 Q 65 34 60 46 Q 70 48 75 42 Z" fill="#fbbf24" />
            <ellipse cx="68" cy="44" rx="2" ry="5" fill="black" />
          </g>
        )
      default:
        return null
    }
  }

  // Draw mouth
  const renderMouth = () => {
    if (blook.customMouth) return blook.customMouth

    switch (blook.mouth) {
      case "smile":
        return <path d="M 42 63 Q 50 70 58 63" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      case "grin":
        return (
          <g>
            <path d="M 35 60 Q 50 80 65 60 Z" fill="white" stroke="black" strokeWidth="3" />
            <line x1="42" y1="60" x2="42" y2="67" stroke="black" strokeWidth="1.5" />
            <line x1="50" y1="60" x2="50" y2="70" stroke="black" strokeWidth="1.5" />
            <line x1="58" y1="60" x2="58" y2="67" stroke="black" strokeWidth="1.5" />
          </g>
        )
      case "beak":
        return <polygon points="44,52 56,52 50,68" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
      default:
        return null
    }
  }

  const { fromColor, toColor, viaColor } = parseGradientStops(blook.bg)
  const gradId = \`grad-\${name.replace(/[^a-zA-Z0-9]/g, "")}\`
  const clipId = \`clip-\${name.replace(/[^a-zA-Z0-9]/g, "")}\`

  return (
    <svg viewBox="0 0 100 100" className={\`\${className} select-none overflow-visible drop-shadow-md\`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fromColor} />
          {viaColor && <stop offset="50%" stopColor={viaColor} />}
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="12" y="12" width="76" height="76" rx="16" />
        </clipPath>
      </defs>

      {/* Main Base Blook box */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="16"
        fill={\`url(#\${gradId})\`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3.5"
      />

      {/* 3D Top Glossy Highlight */}
      <path
        d="M 12 12 L 88 12 L 88 35 Q 50 45 12 35 Z"
        fill="white"
        opacity="0.12"
        clipPath={\`url(#\${clipId})\`}
        pointerEvents="none"
      />

      {/* 3D Bottom Shading */}
      <path
        d="M 12 72 Q 50 82 88 72 L 88 88 L 12 88 Z"
        fill="black"
        opacity="0.15"
        clipPath={\`url(#\${clipId})\`}
        pointerEvents="none"
      />

      {/* Decorations under face */}
      {blook.decorations}

      {/* Blush cheeks (for cute Blook look, only if has eyes and not "none") */}
      {blook.eyes && blook.eyes !== "none" && (
        <g opacity="0.3" pointerEvents="none">
          <ellipse cx="26" cy="53" rx="4.5" ry="2.5" fill="#f43f5e" />
          <ellipse cx="74" cy="53" rx="4.5" ry="2.5" fill="#f43f5e" />
        </g>
      )}

      {/* Face elements */}
      {renderEyes()}
      {renderMouth()}
    </svg>
  )
}

\n`;

const newAfterEnd = beforeBlookSvg + blookSvgRefactored + afterBlookSvg.slice(nextComponentIndex);
fs.writeFileSync(filePath, blooksConfigPart + newBoomsStr + '\n}\n\n' + newAfterEnd, 'utf8');

console.log("Successfully refactored components/boom-avatar.tsx with 78 new booms and upgraded BlookSvg renderer.");
