export interface Pack {
  id: string
  name: string
  price: number
  booms: BoomItem[]
  color: string
  image: string
  rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical" | "hidden"
  emoji?: string // Added emoji property
  series?: number
  isNew?: boolean
}

export interface BoomItem {
  name: string
  rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical" | "hidden"
  avatar: string
  description: string
  asset?: string // Path to SVG/PNG asset
}

export const PACKS: Pack[] = [
  {
    id: "plus",
    name: "Plus Pack",
    price: 30,
    booms: [
      { name: "Plus Crown", rarity: "uncommon", avatar: "👑➕", description: "Exclusive crown for Plus members" },
      { name: "Golden Plus", rarity: "uncommon", avatar: "✨➕", description: "A shiny symbol of premium status" },
      { name: "Plus Shield", rarity: "uncommon", avatar: "🛡️➕", description: "Protects your premium reputation" },
      { name: "Plus Star", rarity: "rare", avatar: "⭐➕", description: "Shining bright for Plus users" },
      { name: "Neon Plus", rarity: "rare", avatar: "🌈➕", description: "Glowing neon symbol" },
      { name: "Plus Diamond", rarity: "rare", avatar: "💎➕", description: "Premium precious gem" },
      { name: "Plus Phoenix", rarity: "epic", avatar: "🔥➕", description: "Rises from the premium ashes" },
      { name: "Plus Galaxy", rarity: "epic", avatar: "🌌➕", description: "Interstellar premium mark" },
      { name: "Plus Dragon", rarity: "legendary", avatar: "🐉➕", description: "Legendary premium beast" },
      { name: "Plus Key", rarity: "hidden", avatar: "🔑➕", description: "Unlocks secret premium doors" },
      { name: "Plus Matrix", rarity: "chroma", avatar: "🌈👾➕", description: "Chroma shifting premium code" },
      { name: "Plus Overlord", rarity: "mystical", avatar: "⚡🌌➕", description: "Absolute ruler of the Plus dimension" }
    ],
    color: "from-amber-500 via-yellow-600 to-orange-700",
    image: "/images/plus-pack.png",
    rarity: "mystical",
    emoji: "⚡"
  },
  {
    id: "og",
    name: "OG Pack",
    price: 50,
    booms: [
      { name: "Nurik", rarity: "uncommon", avatar: "/images/booms/og/nurik.jpg", description: "Respected OG community member" },
      { name: "Eok", rarity: "uncommon", avatar: "/images/booms/og/eok.png", description: "Respected OG community member" },
      { name: "Yessir", rarity: "uncommon", avatar: "/images/booms/og/yessir.jpg", description: "Respected OG community member" },
      { name: "OmarBoss", rarity: "rare", avatar: "/images/booms/og/omarboss.jpg", description: "Respected OG community member" },
      { name: "Gunar69", rarity: "rare", avatar: "/images/booms/og/gunar69.jpg", description: "Respected OG community member" },
      { name: "MrVortex", rarity: "rare", avatar: "/images/booms/og/mrvortex.png", description: "Respected OG community member" },
      { name: "deniz", rarity: "epic", avatar: "/images/booms/og/deniz.png", description: "Respected OG community member" },
      { name: "(●ˇ∀ˇ●)", rarity: "epic", avatar: "/images/booms/og/emoji_guy.jpg", description: "Respected OG community member" },
      { name: "HadiGidek", rarity: "legendary", avatar: "/images/booms/og/hadigidek.jpg", description: "Respected OG community member" },
      { name: "TUran1545", rarity: "hidden", avatar: "/images/booms/og/turan1545.jpg", description: "Respected OG community member" },
      { name: "StrmY_YT", rarity: "chroma", avatar: "/images/booms/og/strmy_yt.jpg", description: "Respected OG community member" },
      { name: "system", rarity: "mystical", avatar: "/images/booms/og/system.jpg", description: "Respected OG community member" }
    ],
    color: "from-purple-600 via-indigo-700 to-indigo-900",
    image: "/images/og-pack.png",
    rarity: "legendary",
    emoji: "👑"
  },
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

export const GAMEPASS_BOOMS = [
  { level: 10, rarity: "uncommon" as const, name: "Random Uncommon" },
  { level: 20, rarity: "rare" as const, name: "Random Rare" },
  { level: 30, rarity: "epic" as const, name: "Random Epic" },
  { level: 40, rarity: "legendary" as const, name: "Random Legendary" },
  { level: 50, rarity: "chroma" as const, name: "Random Chroma" },
  { level: 60, rarity: "mystical" as const, name: "Random Mystical" },
  { level: 70, rarity: "mystical" as const, name: "The Trophy", isLimited: true },
]

export const LIMITED_BOOMS = [
  { name: "Void Dragon", rarity: "mystical", avatar: "🐲🌌", description: "Ruler of the dark matter", price: 5000 },
  { name: "Infinity Gauntlet", rarity: "mystical", avatar: "💎🥊", description: "Power to reshape reality", price: 7500 },
  { name: "Cosmic Phoenix", rarity: "mystical", avatar: "🔥🦅", description: "Eternal rebirth in starlight", price: 10000 },
  { name: "God Eye", rarity: "mystical", avatar: "👁️✨", description: "See all, know all", price: 15000 },
]

export const RARITY_CHANCES = {
  uncommon: 60.849,
  rare: 30,
  epic: 8,
  legendary: 1,
  chroma: 0.1,
  hidden: 0.05,
  mystical: 0.001,
}
