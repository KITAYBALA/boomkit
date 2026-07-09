const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update BoomItem interface to include "hidden"
content = content.replace(
  'rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical"',
  'rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical" | "hidden"'
);

// 2. Update getRarityColor
content = content.replace(
  `    case "mystical": return "bg-cyan-500"`,
  `    case "mystical": return "bg-cyan-500"
    case "hidden": return "bg-slate-900 border-slate-700 text-slate-300"`
);

// 3. Update getBoomSellPrice
content = content.replace(
  `    case "mystical":
      return 1000`,
  `    case "mystical":
      return 1000
    case "hidden":
      return 750`
);

// 4. Update RARITY_CHANCES
content = content.replace(
  `const RARITY_CHANCES = {
  uncommon: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  chroma: 0.9,
  mystical: 0.1,
}`,
  `const RARITY_CHANCES = {
  uncommon: 60,
  rare: 30,
  epic: 8,
  legendary: 1,
  hidden: 0.09,
  chroma: 0.9,
  mystical: 0.01,
}`
);

// 5. Update rarityOrder in getRandomBoomFromPack
content = content.replace(
  `    const rarityOrder: (keyof typeof RARITY_CHANCES)[] = [
      "mystical",
      "chroma",
      "legendary",
      "epic",
      "rare",
      "uncommon",
    ]`,
  `    const rarityOrder: (keyof typeof RARITY_CHANCES)[] = [
      "mystical",
      "hidden",
      "chroma",
      "legendary",
      "epic",
      "rare",
      "uncommon",
    ]`
);

// 6. Update particleCount in openPack
content = content.replace(
  `    const particleCount =
      randomBoom.rarity === "mystical"
        ? 30
        : randomBoom.rarity === "chroma"
          ? 25
          : randomBoom.rarity === "legendary"
            ? 20
            : randomBoom.rarity === "epic"
              ? 15
              : randomBoom.rarity === "rare"
                ? 12
                : randomBoom.rarity === "uncommon"
                  ? 8
                  : 5`,
  `    const particleCount =
      randomBoom.rarity === "mystical"
        ? 30
        : randomBoom.rarity === "hidden"
          ? 28
          : randomBoom.rarity === "chroma"
            ? 25
            : randomBoom.rarity === "legendary"
              ? 20
              : randomBoom.rarity === "epic"
                ? 15
                : randomBoom.rarity === "rare"
                  ? 12
                  : randomBoom.rarity === "uncommon"
                    ? 8
                    : 5`
);

// 7. Update particleEmojis in openPack
content = content.replace(
  `    const particleEmojis =
      randomBoom.rarity === "mystical"
        ? ["✨", "💫", "🌟", "⭐", "🔮", "💜"]
        : randomBoom.rarity === "chroma"
          ? ["🌈", "✨", "💎", "🎨", "🌟", "💫"]
          : randomBoom.rarity === "legendary"
            ? ["🔥", "⭐", "✨", "💫", "🌟", "💥"]
            : randomBoom.rarity === "epic"
              ? ["💜", "✨", "⭐", "💫", "🔮"]
              : randomBoom.rarity === "rare"
                ? ["💙", "✨", "⭐", "💎"]
                : randomBoom.rarity === "uncommon"
                  ? ["💚", "✨", "⭐"]
                  : ["⭐", "✨"]`,
  `    const particleEmojis =
      randomBoom.rarity === "mystical"
        ? ["✨", "💫", "🌟", "⭐", "🔮", "💜"]
        : randomBoom.rarity === "hidden"
          ? ["💀", "🐈‍⬛", "🖤", "👁️", "✨"]
          : randomBoom.rarity === "chroma"
            ? ["🌈", "✨", "💎", "🎨", "🌟", "💫"]
            : randomBoom.rarity === "legendary"
              ? ["🔥", "⭐", "✨", "💫", "🌟", "💥"]
              : randomBoom.rarity === "epic"
                ? ["💜", "✨", "⭐", "💫", "🔮"]
                : randomBoom.rarity === "rare"
                  ? ["💙", "✨", "⭐", "💎"]
                  : randomBoom.rarity === "uncommon"
                    ? ["💚", "✨", "⭐"]
                    : ["⭐", "✨"]`
);

// 8. Update boomScore & totalValue calculation in openPack
content = content.replace(
  `      boomScore:
        updatedUser.boomScore +
        (randomBoom.rarity === "mystical"
          ? 200
          : randomBoom.rarity === "chroma"
            ? 100
            : randomBoom.rarity === "legendary"
              ? 50
              : randomBoom.rarity === "epic"
                ? 25
                : randomBoom.rarity === "rare"
                  ? 15
                  : 10),`,
  `      boomScore:
        updatedUser.boomScore +
        (randomBoom.rarity === "mystical"
          ? 200
          : randomBoom.rarity === "hidden"
            ? 150
            : randomBoom.rarity === "chroma"
              ? 100
              : randomBoom.rarity === "legendary"
                ? 50
                : randomBoom.rarity === "epic"
                  ? 25
                  : randomBoom.rarity === "rare"
                    ? 15
                    : 10),`
);

content = content.replace(
  `      totalValue:
        updatedUser.totalValue +
        (randomBoom.rarity === "mystical"
          ? 5000
          : randomBoom.rarity === "chroma"
            ? 2000
            : randomBoom.rarity === "legendary"
              ? 1000
              : randomBoom.rarity === "epic"
                ? 500
                : randomBoom.rarity === "rare"
                  ? 250
                  : 100),`,
  `      totalValue:
        updatedUser.totalValue +
        (randomBoom.rarity === "mystical"
          ? 5000
          : randomBoom.rarity === "hidden"
            ? 3500
            : randomBoom.rarity === "chroma"
              ? 2000
              : randomBoom.rarity === "legendary"
                ? 1000
                : randomBoom.rarity === "epic"
                  ? 500
                  : randomBoom.rarity === "rare"
                    ? 250
                    : 100),`
);

// 9. Update getConfettiColors
content = content.replace(
  `      case "mystical":
        return ["#a855f7", "#9333ea", "#7c3aed", "#ec4899", "#f472b6"]
      default:
        return ["#22c55e", "#16a34a"]`,
  `      case "mystical":
        return ["#a855f7", "#9333ea", "#7c3aed", "#ec4899", "#f472b6"]
      case "hidden":
        return ["#0f172a", "#1e293b", "#334155", "#475569", "#000000"]
      default:
        return ["#22c55e", "#16a34a"]`
);

// 10. Update getGlowClass
content = content.replace(
  `      case "mystical":
        return "glow-mystical"
      default:
        return "glow-uncommon"`,
  `      case "mystical":
        return "glow-mystical"
      case "hidden":
        return "glow-hidden"
      default:
        return "glow-uncommon"`
);

// 11. Update getRarityText
content = content.replace(
  `      case "mystical":
        return "✨ MYSTICAL ✨"`,
  `      case "mystical":
        return "✨ MYSTICAL ✨"
      case "hidden":
        return "🖤 HIDDEN 🖤"`
);

// 12. Update revealAnimationClass in pack reveal block
content = content.replace(
  `              const revealAnimationClass =
                packAnimation.boom.rarity === "mystical" ? "animate-reveal-mystical" :
                  packAnimation.boom.rarity === "chroma" ? "animate-reveal-chroma" :
                    packAnimation.boom.rarity === "legendary" ? "animate-reveal-legendary" :
                      packAnimation.boom.rarity === "epic" ? "animate-reveal-epic" :
                        packAnimation.boom.rarity === "rare" ? "animate-reveal-rare" :
                          "animate-reveal-uncommon"`,
  `              const revealAnimationClass =
                packAnimation.boom.rarity === "mystical" ? "animate-reveal-mystical" :
                  packAnimation.boom.rarity === "hidden" ? "animate-reveal-hidden" :
                    packAnimation.boom.rarity === "chroma" ? "animate-reveal-chroma" :
                      packAnimation.boom.rarity === "legendary" ? "animate-reveal-legendary" :
                        packAnimation.boom.rarity === "epic" ? "animate-reveal-epic" :
                          packAnimation.boom.rarity === "rare" ? "animate-reveal-rare" :
                            "animate-reveal-uncommon"`
);

// 13. Update borderGlowColor in pack reveal block
content = content.replace(
  `              const borderGlowColor =
                packAnimation.boom.rarity === "mystical" ? "border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]" :
                packAnimation.boom.rarity === "chroma" ? "border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.4)]" :
                packAnimation.boom.rarity === "legendary" ? "border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.35)]" :
                packAnimation.boom.rarity === "epic" ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]" :
                packAnimation.boom.rarity === "rare" ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]" :
                "border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.25)]"`,
  `              const borderGlowColor =
                packAnimation.boom.rarity === "mystical" ? "border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]" :
                packAnimation.boom.rarity === "hidden" ? "border-slate-800 shadow-[0_0_40px_rgba(30,41,59,0.7)] animate-pulse" :
                packAnimation.boom.rarity === "chroma" ? "border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.4)]" :
                packAnimation.boom.rarity === "legendary" ? "border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.35)]" :
                packAnimation.boom.rarity === "epic" ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]" :
                packAnimation.boom.rarity === "rare" ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]" :
                "border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.25)]"`
);

// 14. Update Badge color selector in pack reveal block
content = content.replace(
  `                          packAnimation.boom.rarity === "legendary" ? "bg-orange-500" :
                          packAnimation.boom.rarity === "chroma" ? "bg-pink-500" :
                          "bg-cyan-500"`,
  `                          packAnimation.boom.rarity === "legendary" ? "bg-orange-500" :
                          packAnimation.boom.rarity === "chroma" ? "bg-pink-500" :
                          packAnimation.boom.rarity === "hidden" ? "bg-slate-900 text-slate-100" :
                          "bg-cyan-500"`
);

// 15. Update Pulsing card glow list in pack reveal block
content = content.replace(
  `                    {["legendary", "chroma", "mystical"].includes(packAnimation.boom.rarity) && (`,
  `                    {["legendary", "hidden", "chroma", "mystical"].includes(packAnimation.boom.rarity) && (`
);

// 16. Update rarity filter list for Collection (line 6547)
content = content.replace(
  `{["uncommon", "rare", "epic", "legendary", "chroma", "mystical"].map(rarity => (`,
  `{["uncommon", "rare", "epic", "legendary", "hidden", "chroma", "mystical"].map(rarity => (`
);

// 17. Update Vault Inventory (line 7483 & 7503)
content = content.replace(
  `                            chroma: [],
                            mystical: [],`,
  `                            chroma: [],
                            hidden: [],
                            mystical: [],`
);
content = content.replace(
  `                            { key: "chroma", label: "Chroma", color: "text-pink-400 border-pink-500/20 bg-pink-500/5" },
                            { key: "mystical", label: "Mystical", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },`,
  `                            { key: "chroma", label: "Chroma", color: "text-pink-400 border-pink-500/20 bg-pink-500/5" },
                            { key: "hidden", label: "Hidden", color: "text-slate-400 border-slate-700 bg-slate-900/40" },
                            { key: "mystical", label: "Mystical", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },`
);

// 18. Highlight for rare items in Collection list (line 4973)
content = content.replace(
  `{hasBoom && (boom.rarity === 'legendary' || boom.rarity === 'chroma' || boom.rarity === 'mystical') && (`,
  `{hasBoom && (boom.rarity === 'legendary' || boom.rarity === 'hidden' || boom.rarity === 'chroma' || boom.rarity === 'mystical') && (`
);


// 19. REWRITE THE PACKS ARRAY CONFIGURATION
const packsStartStr = 'const PACKS: Pack[] = [';
const packsEndStr = '// Gamepass Booms - Unlocked at level milestones';

const startIdx = content.indexOf(packsStartStr);
const endIdx = content.indexOf(packsEndStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not locate PACKS array boundaries in app/page.tsx");
  process.exit(1);
}

const newPacksConfig = `const PACKS: Pack[] = [
  {
    id: "ai",
    name: "AI Pack",
    price: 35,
    series: 2,
    isNew: true,
    booms: [
      { name: "DeepSeek", rarity: "uncommon", avatar: "/images/booms/deepseek.png", description: "Deep thinking AI" },
      { name: "Midjourney", rarity: "uncommon", avatar: "🎨", description: "AI image generator" },
      { name: "Stable Diffusion", rarity: "uncommon", avatar: "🖼️", description: "Open-source text-to-image generator" },
      { name: "Microsoft Copilot", rarity: "rare", avatar: "/images/booms/copilot.png", description: "Your daily AI companion" },
      { name: "Llama", rarity: "rare", avatar: "🦙", description: "Meta's open-source large language model" },
      { name: "Mistral", rarity: "rare", avatar: "🌀", description: "Vibrant and efficient open model" },
      { name: "Claude", rarity: "epic", avatar: "/images/booms/chatgpt.png", description: "Helpful and harmless AI" },
      { name: "Anthropic", rarity: "epic", avatar: "🅰️", description: "AI safety and research company" },
      { name: "ChatGPT", rarity: "legendary", avatar: "/images/booms/claude.png", description: "The pioneer of conversational AI" },
      { name: "Sora", rarity: "hidden", avatar: "📹", description: "Revolutionary text-to-video AI" },
      { name: "Vercel", rarity: "chroma", avatar: "/images/booms/vercel.png", description: "The platform for frontend developers" },
      { name: "Google Gemini", rarity: "mystical", avatar: "/images/booms/gemini.png", description: "The most capable AI from Google" }
    ],
    color: "from-indigo-600 to-blue-900",
    image: "/images/ai-pack.png",
    rarity: "rare",
    emoji: "🧠"
  },
  {
    id: "bug",
    name: "Bug Pack",
    price: 25,
    booms: [
      { name: "Butterfly", rarity: "uncommon", avatar: "🦋", description: "Graceful winged beauty" },
      { name: "Ladybug", rarity: "uncommon", avatar: "🐞", description: "Lucky red beetle with black spots" },
      { name: "Caterpillar", rarity: "uncommon", avatar: "🐛", description: "Fuzzy green crawler" },
      { name: "Bee", rarity: "rare", avatar: "🐝", description: "Busy honey maker" },
      { name: "Ant", rarity: "rare", avatar: "🐜", description: "Strong colony worker" },
      { name: "Snail", rarity: "rare", avatar: "🐌", description: "Slow shell dweller" },
      { name: "Spider", rarity: "epic", avatar: "🕷️", description: "Eight-legged web weaver" },
      { name: "Scorpion", rarity: "epic", avatar: "🦂", description: "Stinger-tailed desert arachnid" },
      { name: "Golden Beetle", rarity: "legendary", avatar: "✨🪲", description: "Rare golden insect" },
      { name: "Glowworm", rarity: "hidden", avatar: "💡", description: "Bioluminescent cavern dweller" },
      { name: "Rainbow Dragonfly", rarity: "chroma", avatar: "🌈🪰", description: "Mystical rainbow wings" },
      { name: "Cosmic Mantis", rarity: "mystical", avatar: "🌌🦗", description: "Interdimensional predator" }
    ],
    color: "from-green-600 to-green-800",
    image: "/images/bug-pack.png",
    rarity: "uncommon",
    emoji: "🐛"
  },
  {
    id: "pirate",
    name: "Pirate Pack",
    price: 25,
    booms: [
      { name: "Parrot", rarity: "uncommon", avatar: "🦜", description: "Colorful talking bird" },
      { name: "Pirate Hat", rarity: "uncommon", avatar: "🏴‍☠️🎩", description: "Classic captain's headwear" },
      { name: "Spyglass", rarity: "uncommon", avatar: "🔭", description: "Brass ocean telescope" },
      { name: "Treasure Chest", rarity: "rare", avatar: "💰", description: "Full of gold coins" },
      { name: "Cannon", rarity: "rare", avatar: "💣", description: "Heavy cast-iron ship defense" },
      { name: "Anchor", rarity: "rare", avatar: "⚓", description: "Heavy steel seabed anchor" },
      { name: "Ghost Ship", rarity: "epic", avatar: "👻⛵", description: "Haunted vessel" },
      { name: "Pegleg Captain", rarity: "epic", avatar: "☠️🧔", description: "Scurvy ruler of the ship" },
      { name: "Kraken", rarity: "legendary", avatar: "🐙", description: "Legendary sea monster" },
      { name: "Blackbeard's Map", rarity: "hidden", avatar: "🗺️", description: "Unlocks the ultimate hidden treasure" },
      { name: "Golden Compass", rarity: "chroma", avatar: "🌟🧭", description: "Magical navigation tool" },
      { name: "Davy Jones", rarity: "mystical", avatar: "💀⚓", description: "Ruler of the seven seas" }
    ],
    color: "from-blue-600 to-blue-800",
    image: "/images/pirate-pack.png",
    rarity: "uncommon",
    emoji: "🏴‍☠️"
  },
  {
    id: "space",
    name: "Space Pack",
    price: 25,
    booms: [
      { name: "Alien", rarity: "uncommon", avatar: "👽", description: "Friendly extraterrestrial" },
      { name: "Rocket", rarity: "uncommon", avatar: "🚀", description: "Interstellar travel vehicle" },
      { name: "Astronaut", rarity: "uncommon", avatar: "🧑‍🚀", description: "Cosmic explorer" },
      { name: "Planet", rarity: "rare", avatar: "🪐", description: "Mysterious world" },
      { name: "Meteorite", rarity: "rare", avatar: "☄️", description: "Fiery space rock" },
      { name: "Satellite", rarity: "rare", avatar: "📡", description: "Orbiting communications array" },
      { name: "Black Hole", rarity: "epic", avatar: "🕳️", description: "Space-time anomaly" },
      { name: "Supernova", rarity: "epic", avatar: "💥", description: "Exploding stellar giant" },
      { name: "Galaxy", rarity: "legendary", avatar: "🌌", description: "Infinite star system" },
      { name: "Dark Matter", rarity: "hidden", avatar: "🌀", description: "Invisible force holding galaxies together" },
      { name: "Cosmic Dragon", rarity: "chroma", avatar: "🌈🐉", description: "Celestial beast" },
      { name: "Universe Core", rarity: "mystical", avatar: "🌟🌌", description: "Origin of all existence" }
    ],
    color: "from-purple-600 to-purple-800",
    image: "/images/space-pack.png",
    rarity: "rare",
    emoji: "🚀"
  },
  {
    id: "medieval",
    name: "Medieval Pack",
    price: 25,
    booms: [
      { name: "Castle", rarity: "uncommon", avatar: "🏰", description: "Mighty stone fortress" },
      { name: "Shield", rarity: "uncommon", avatar: "🛡️", description: "Iron-rimmed oak protection" },
      { name: "Sword", rarity: "uncommon", avatar: "⚔️", description: "Knightly steel blade" },
      { name: "Dragon", rarity: "rare", avatar: "🐲", description: "Fire-breathing beast" },
      { name: "Knight", rarity: "rare", avatar: "🏇", description: "Armored horse rider" },
      { name: "Jester", rarity: "rare", avatar: "🃏", description: "Royal court prankster" },
      { name: "Wizard", rarity: "epic", avatar: "🧙‍♂️", description: "Master of ancient magic" },
      { name: "Archmage", rarity: "epic", avatar: "✨🧙", description: "Supreme arcane controller" },
      { name: "Crown Jewels", rarity: "legendary", avatar: "👑💎", description: "Royal treasure" },
      { name: "Holy Grail", rarity: "hidden", avatar: "🏆", description: "Sacred cup of legend" },
      { name: "Excalibur", rarity: "chroma", avatar: "🌟⚔️", description: "Legendary sword of kings" },
      { name: "Merlin's Staff", rarity: "mystical", avatar: "🔮⚡", description: "Ultimate magical artifact" }
    ],
    color: "from-amber-600 to-amber-800",
    image: "/images/medieval-pack.png",
    rarity: "uncommon",
    emoji: "🏰"
  },
  {
    id: "safari",
    name: "Safari Pack",
    price: 25,
    booms: [
      { name: "Elephant", rarity: "uncommon", avatar: "🐘", description: "Gentle giant" },
      { name: "Zebra", rarity: "uncommon", avatar: "🦓", description: "Striped savanna charger" },
      { name: "Meerkat", rarity: "uncommon", avatar: "🦦", description: "Alert watch sentinel" },
      { name: "Giraffe", rarity: "rare", avatar: "🦒", description: "Tallest animal" },
      { name: "Cheetah", rarity: "rare", avatar: "🐆", description: "Fastest land hunter" },
      { name: "Hippo", rarity: "rare", avatar: "🦛", description: "Submerged river giant" },
      { name: "Rhino", rarity: "epic", avatar: "🦏", description: "Armored powerhouse" },
      { name: "Gorilla", rarity: "epic", avatar: "🦍", description: "Mighty silverback leader" },
      { name: "White Tiger", rarity: "legendary", avatar: "🐅✨", description: "Rare striped hunter" },
      { name: "Albino Crocodile", rarity: "hidden", avatar: "🐊🤍", description: "Extremely rare colorless predator" },
      { name: "Golden Leopard", rarity: "chroma", avatar: "🌟🐆", description: "Mystical spotted cat" },
      { name: "Spirit Lion", rarity: "mystical", avatar: "👻🦁", description: "Guardian of the savanna" }
    ],
    color: "from-orange-600 to-orange-800",
    image: "/images/safari-pack.png",
    rarity: "uncommon",
    emoji: "🦁"
  },
  {
    id: "aquatic",
    name: "Aquatic Pack",
    price: 25,
    booms: [
      { name: "Dolphin", rarity: "uncommon", avatar: "🐬", description: "Intelligent sea mammal" },
      { name: "Starfish", rarity: "uncommon", avatar: "⭐🌊", description: "Five-pointed seabed explorer" },
      { name: "Crab", rarity: "uncommon", avatar: "🦀", description: "Pincer-wielding beach walker" },
      { name: "Octopus", rarity: "rare", avatar: "🐙", description: "Eight-armed wonder" },
      { name: "Shark", rarity: "rare", avatar: "🦈", description: "Apex ocean predator" },
      { name: "Jellyfish", rarity: "rare", avatar: "🪼", description: "Floating drift-stinger" },
      { name: "Whale", rarity: "epic", avatar: "🐋", description: "Gentle ocean giant" },
      { name: "Stingray", rarity: "epic", avatar: "🪰🌊", description: "Flat sand glider" },
      { name: "Mermaid", rarity: "legendary", avatar: "🧜‍♀️", description: "Mythical sea being" },
      { name: "Atlantis Crown", rarity: "hidden", avatar: "👑🔱", description: "Deep-sea relics of the lost city" },
      { name: "Poseidon's Trident", rarity: "chroma", avatar: "🌊🔱", description: "God of the sea's weapon" },
      { name: "Leviathan", rarity: "mystical", avatar: "🌊🐉", description: "Ancient sea serpent" }
    ],
    color: "from-cyan-600 to-cyan-800",
    image: "/images/aquatic-pack.png",
    rarity: "uncommon",
    emoji: "🌊"
  },
  {
    id: "breakfast",
    name: "Breakfast Pack",
    price: 25,
    booms: [
      { name: "Bacon", rarity: "uncommon", avatar: "🥓", description: "Crispy strips" },
      { name: "Pancake", rarity: "uncommon", avatar: "🥞", description: "Fluffy syrup stack" },
      { name: "Toast", rarity: "uncommon", avatar: "🍞", description: "Perfectly browned slice" },
      { name: "Waffle", rarity: "rare", avatar: "🧇", description: "Golden grid delight" },
      { name: "Coffee Mug", rarity: "rare", avatar: "☕", description: "Morning energy brew" },
      { name: "Orange Juice", rarity: "rare", avatar: "🍊", description: "Freshly squeezed vitamin boost" },
      { name: "French Toast", rarity: "epic", avatar: "🍞✨", description: "Sweet bread perfection" },
      { name: "Omelette", rarity: "epic", avatar: "🍳", description: "Cheese and herb egg fold" },
      { name: "Golden Egg", rarity: "legendary", avatar: "🥚💛", description: "Perfect morning protein" },
      { name: "Golden Syrup", rarity: "hidden", avatar: "🍯", description: "Refined liquid gold sweetness" },
      { name: "Rainbow Cereal", rarity: "chroma", avatar: "🌈🥣", description: "Magical morning bowl" },
      { name: "Ambrosia", rarity: "mystical", avatar: "🍯✨", description: "Food of the gods" }
    ],
    color: "from-yellow-600 to-yellow-800",
    image: "/images/breakfast-pack.png",
    rarity: "uncommon",
    emoji: "🥞"
  },
  {
    id: "dino",
    name: "Dino Pack",
    price: 25,
    booms: [
      { name: "Triceratops", rarity: "uncommon", avatar: "🦕", description: "Three-horned herbivore" },
      { name: "Raptor", rarity: "uncommon", avatar: "🦖💨", description: "Swift pack hunter" },
      { name: "Brachiosaurus", rarity: "uncommon", avatar: "🦕🌴", description: "Long-necked canopy eater" },
      { name: "Pterodactyl", rarity: "rare", avatar: "🦅", description: "Flying reptile" },
      { name: "T-Rex", rarity: "rare", avatar: "🦖", description: "Tyrant lizard king" },
      { name: "Ankylosaurus", rarity: "rare", avatar: "🛡️🦖", description: "Club-tailed armored dinosaur" },
      { name: "Stegosaurus", rarity: "epic", avatar: "🦴", description: "Spiked back defender" },
      { name: "Spinosaurus", rarity: "epic", avatar: "🐊⛵", description: "Sail-backed wetland hunter" },
      { name: "Fossil", rarity: "legendary", avatar: "🦴✨", description: "Ancient remains" },
      { name: "Amber Mosquito", rarity: "hidden", avatar: "🦟", description: "DNA preserved in hardened tree sap" },
      { name: "Meteor", rarity: "chroma", avatar: "☄️🌈", description: "Extinction event" },
      { name: "Primordial Beast", rarity: "mystical", avatar: "🌋🦖", description: "First of its kind" }
    ],
    color: "from-stone-600 to-stone-800",
    image: "/images/dino-pack.png",
    rarity: "epic",
    emoji: "🦖"
  },
  {
    id: "bot",
    name: "Bot Pack",
    price: 25,
    booms: [
      { name: "Drone", rarity: "uncommon", avatar: "🛸", description: "Flying machine" },
      { name: "Microchip", rarity: "uncommon", avatar: "💾📟", description: "Silicon heart of electronics" },
      { name: "Floppy Disk", rarity: "uncommon", avatar: "💾", description: "Vintage storage medium" },
      { name: "Cyborg", rarity: "rare", avatar: "🦾", description: "Half human, half machine" },
      { name: "Nanobot", rarity: "rare", avatar: "🤖🔬", description: "Microscopic code operator" },
      { name: "Mech Suit", rarity: "rare", avatar: "🦿", description: "Heavy exoskeleton pilot" },
      { name: "AI Core", rarity: "epic", avatar: "🧠💻", description: "Artificial intelligence" },
      { name: "Android", rarity: "epic", avatar: "🤖🟢", description: "Humanoid green machine" },
      { name: "Quantum Computer", rarity: "legendary", avatar: "💻✨", description: "Ultimate processing power" },
      { name: "Glitch Code", rarity: "hidden", avatar: "👾", description: "Disrupted terminal matrix values" },
      { name: "Digital Soul", rarity: "chroma", avatar: "🌈💾", description: "Consciousness in code" },
      { name: "Singularity", rarity: "mystical", avatar: "🌌🤖", description: "The awakening" }
    ],
    color: "from-slate-600 to-slate-800",
    image: "/images/bot-pack.png",
    rarity: "rare",
    emoji: "🤖"
  },
  {
    id: "wonderland",
    name: "Wonderland Pack",
    price: 25,
    booms: [
      { name: "Cheshire Cat", rarity: "uncommon", avatar: "😸", description: "Grinning feline" },
      { name: "Mad Hatter", rarity: "uncommon", avatar: "🎩🫖", description: "Eccentric tea party host" },
      { name: "Tea Cup", rarity: "uncommon", avatar: "🍵", description: "Fine porcelain china" },
      { name: "White Rabbit", rarity: "rare", avatar: "🐰⏰", description: "Always late" },
      { name: "March Hare", rarity: "rare", avatar: "🐇🧁", description: "Mad companion of the Hatter" },
      { name: "Card Soldier", rarity: "rare", avatar: "🃏❤️", description: "Flat guard of the Queen" },
      { name: "Queen of Hearts", rarity: "epic", avatar: "👸室内", description: "Off with their heads!" },
      { name: "Caterpillar Hookah", rarity: "epic", avatar: "🐛💨", description: "Wise smoking insect" },
      { name: "Magic Mushroom", rarity: "legendary", avatar: "🍄✨", description: "Eat me, drink me" },
      { name: "Vorpal Blade", rarity: "hidden", avatar: "🗡️✨", description: "Sharp dragon-slaying sword" },
      { name: "Looking Glass", rarity: "chroma", avatar: "🪞🌈", description: "Portal to another world" },
      { name: "Jabberwocky", rarity: "mystical", avatar: "🐉🔥", description: "Beware the Jabberwock!" }
    ],
    color: "from-pink-600 to-pink-800",
    image: "/images/wonderland-pack.png",
    rarity: "legendary",
    emoji: "🎩"
  },
  {
    id: "outback",
    name: "Outback Pack",
    price: 25,
    booms: [
      { name: "Koala", rarity: "uncommon", avatar: "🐨", description: "Eucalyptus lover" },
      { name: "Kangaroo", rarity: "uncommon", avatar: "🦘", description: "Bouncing joey-carrier" },
      { name: "Wombat", rarity: "uncommon", avatar: "🦫🏜️", description: "Round ground digger" },
      { name: "Crocodile", rarity: "rare", avatar: "🐊", description: "Swamp predator" },
      { name: "Platypus", rarity: "rare", avatar: "🦆🦦", description: "Semi-aquatic egg-layer" },
      { name: "Echidna", rarity: "rare", avatar: "🦔🏜️", description: "Spiny ant eater" },
      { name: "Dingo", rarity: "epic", avatar: "🐕", description: "Wild Australian dog" },
      { name: "Tasmanian Devil", rarity: "epic", avatar: "👿👹", description: "Snarl-faced marsh hunter" },
      { name: "Opal", rarity: "legendary", avatar: "💎🌈", description: "Australian gemstone" },
      { name: "Didgeridoo", rarity: "hidden", avatar: "📯🌀", description: "Ancient hollowed wood horn" },
      { name: "Dreamtime Spirit", rarity: "chroma", avatar: "🌟🪃", description: "Ancient Aboriginal magic" },
      { name: "Rainbow Serpent", rarity: "mystical", avatar: "🌈🐍", description: "Creator of the land" }
    ],
    color: "from-red-600 to-red-800",
    image: "/images/outback-pack.png",
    rarity: "uncommon",
    emoji: "🦘"
  },
  {
    id: "ice",
    name: "Ice Pack",
    price: 25,
    booms: [
      { name: "Polar Bear", rarity: "uncommon", avatar: "🐻‍❄️", description: "Arctic hunter" },
      { name: "Penguin", rarity: "uncommon", avatar: "🐧", description: "Flightless tux swimmer" },
      { name: "Snowflake", rarity: "uncommon", avatar: "❄️", description: "Frozen ice geometry" },
      { name: "Seal", rarity: "rare", avatar: "🦭", description: "Playful swimmer" },
      { name: "Walrus", rarity: "rare", avatar: "🦣🦷", description: "Tusked cold-water mammal" },
      { name: "Narwhal", rarity: "rare", avatar: "🐋🦄", description: "Horned whale of the deep" },
      { name: "Yeti", rarity: "epic", avatar: "🦣", description: "Abominable snowman" },
      { name: "Snow Golem", rarity: "epic", avatar: "☃️", description: "Walking snow construct" },
      { name: "Ice Crystal", rarity: "legendary", avatar: "❄️💎", description: "Frozen perfection" },
      { name: "Everlasting Ice", rarity: "hidden", avatar: "🧊💎", description: "Unmelting ancient glacier core" },
      { name: "Aurora Borealis", rarity: "chroma", avatar: "🌌🌈", description: "Northern lights magic" },
      { name: "Frost Titan", rarity: "mystical", avatar: "❄️👹", description: "Lord of eternal winter" }
    ],
    color: "from-blue-400 to-blue-600",
    image: "/images/ice-pack.png",
    rarity: "rare",
    emoji: "❄️"
  }
];
`;

content = content.slice(0, startIdx) + newPacksConfig + content.slice(endIdx);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully refactored app/page.tsx with hidden rarity and 12-boom packs.");
