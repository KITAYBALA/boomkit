"use client"
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

// Advanced computer identification system
const generateSystemSignature = (): string => {
  // Abort immediately during SSR – return a constant placeholder
  if (typeof window === "undefined") return "ssr-placeholder"

  const getCanvasFingerprint = (): string => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return "no-canvas"

    canvas.width = 200
    canvas.height = 50
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillStyle = "#f60"
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = "#069"
    ctx.fillText("BoomKit Security 🔒", 2, 15)
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
    ctx.fillText("Computer ID System", 4, 35)

    return canvas.toDataURL()
  }

  const getWebGLFingerprint = (): string => {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (!gl) return "no-webgl"

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown"
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown"

    return `${vendor}|${renderer}`
  }

  const getAudioFingerprint = (): string => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      oscillator.type = "triangle"
      oscillator.frequency.value = 10000
      gainNode.gain.value = 0.05

      oscillator.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)

      audioContext.close()
      return Array.from(dataArray.slice(0, 10)).join(",")
    } catch {
      return "no-audio"
    }
  }

  const scr = typeof screen !== "undefined" ? screen : { width: 0, height: 0, colorDepth: 0 }

  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(",") || "",
    scr.width + "x" + scr.height + "x" + scr.colorDepth,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "unknown",
    navigator.deviceMemory?.toString() || "unknown",
    navigator.platform,
    navigator.cookieEnabled.toString(),
    navigator.doNotTrack || "unknown",
    window.devicePixelRatio?.toString() || "1",
    navigator.maxTouchPoints?.toString() || "0",
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getAudioFingerprint(),
    // Additional browser-specific features
    typeof window.chrome !== "undefined" ? "chrome" : "other",
    navigator.vendor || "unknown",
    navigator.product || "unknown",
  ]

  // Create hash from components
  const signature = components.join("|")
  let hash = 0
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36).toUpperCase()
}

// Persistent storage system
const STORAGE_KEY = "boomkit_authorized_system"
const BACKUP_STORAGE_KEY = "boomkit_system_backup"

const isAuthorizedSystem = (): boolean => {
  if (typeof window === "undefined") return false // running in SSR
  const currentSignature = generateSystemSignature()

  // Check localStorage
  const storedSignature = localStorage.getItem(STORAGE_KEY)
  if (storedSignature === currentSignature) {
    return true
  }

  // Check sessionStorage as backup
  const backupSignature = sessionStorage.getItem(BACKUP_STORAGE_KEY)
  if (backupSignature === currentSignature) {
    // Restore to localStorage
    localStorage.setItem(STORAGE_KEY, currentSignature)
    return true
  }

  return false
}

const authorizeCurrentSystem = (): void => {
  const signature = generateSystemSignature()
  localStorage.setItem(STORAGE_KEY, signature)
  sessionStorage.setItem(BACKUP_STORAGE_KEY, signature)
  console.log("System authorized with signature:", signature)
}

// Your master authorization key (change this to something unique)
const MASTER_AUTHORIZATION_KEY = "OKTAY_MASTER_2024_BOOMKIT_SECURE"

interface GameUser {
  id: string
  username: string
  email: string
  age: number
  tokens: number
  dailyTokens: number
  packs: string[]
  booms: { [key: string]: number } // Changed to track quantities
  isOwner: boolean
  isBanned: boolean
  isMuted: boolean
  status: "pending" | "approved" | "rejected"
  reason: string
  role: string
  joinDate: string
  boomScore: number
  totalValue: number
  profilePicture: string
  isPlusUser: boolean
  nameColor: string
  bannerColor: string
  lastDailySpin: string
  badges: string[] // Added badges array
  muteExpiry?: number | null
  banExpiry?: number | null
  banReason?: string
  lastSeen: number // Timestamp of last activity
  packsOpened?: number // Added for Supabase sync
  // password?: string; // Removed password from interface to avoid unintended exposure
}

interface UserRole {
  id: string
  name: string
  color: string
  permissions: string[]
}

interface Pack {
  id: string
  name: string
  price: number
  booms: BoomItem[]
  color: string
  image: string
  rarity: "uncommon" | "rare" | "epic" | "legendary"
  emoji?: string // Added emoji property
}

interface BoomItem {
  name: string
  rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical"
  avatar: string
  description: string
  asset?: string // Path to SVG/PNG asset
}

interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: Date
  role: string // Changed from country to role
}

interface AuctionItem {
  id: string
  boomName: string
  seller: string
  currentBid: number
  timeLeft: number
  bidders: string[]
}

interface NewsItem {
  id: string
  title: string
  content: string
  date: string
  image?: string
}

// Get boom sell price
const getBoomSellPrice = (boomName: string) => {
  const rarity = getBoomRarity(boomName)
  switch (rarity) {
    case "uncommon":
      return 15
    case "rare":
      return 25
    case "epic":
      return 75
    case "legendary":
      return 250
    case "chroma":
      return 500
    case "mystical":
      return 1000
    default:
      return 15
  }
}

// Get boom rarity (dummy implementation for illustration)
const getBoomRarity = (boomName: string): string => {
  // Dummy implementation for illustration
  return "uncommon"
}

interface CustomRole {
  id: string
  name: string
  color: string
  assignedBy: string
  assignedDate: string
  permissions?: string[] // Added permissions property
}

const DEFAULT_ROLES: UserRole[] = [
  {
    id: "player",
    name: "Player",
    color: "bg-gray-500",
    permissions: ["chat", "play"],
  },
  {
    id: "tester", // Added Tester role
    name: "Tester",
    color: "bg-green-500",
    permissions: ["chat", "play"],
  },
  {
    id: "moderator",
    name: "Moderator",
    color: "bg-green-500",
    permissions: ["chat", "play", "mute", "kick"],
  },
  {
    id: "senior_moderator",
    name: "Senior Moderator",
    color: "bg-blue-500",
    permissions: ["chat", "play", "mute", "kick", "ban", "manage_chat"],
  },
  {
    id: "admin",
    name: "Admin",
    color: "bg-purple-500",
    permissions: ["chat", "play", "mute", "kick", "ban", "manage_chat", "manage_users", "manage_packs"],
  },
  {
    id: "owner",
    name: "Owner",
    color: "bg-yellow-500",
    permissions: ["all"],
  },
]

// Available badges
const AVAILABLE_BADGES = [
  { id: "trusted", name: "Trusted", emoji: "🛡️", color: "bg-blue-500" },
  { id: "staff", name: "Staff", emoji: "⚡", color: "bg-green-500" },
  { id: "og", name: "OG", emoji: "👑", color: "bg-purple-500" },
  { id: "developer", name: "Developer", emoji: "💻", color: "bg-red-500" },
]

const PACKS: Pack[] = [
  {
    id: "bug",
    name: "Bug Pack",
    price: 25,
    booms: [
      { name: "Butterfly", rarity: "uncommon", avatar: "🦋", description: "Graceful winged beauty" },
      { name: "Bee", rarity: "rare", avatar: "🐝", description: "Busy honey maker" },
      { name: "Spider", rarity: "epic", avatar: "🕷️", description: "Eight-legged web weaver" },
      { name: "Golden Beetle", rarity: "legendary", avatar: "✨🪲", description: "Rare golden insect" },
      { name: "Rainbow Dragonfly", rarity: "chroma", avatar: "🌈🪰", description: "Mystical rainbow wings" },
      { name: "Cosmic Mantis", rarity: "mystical", avatar: "🌌🦗", description: "Interdimensional predator" },
    ],
    color: "from-green-600 to-green-800",
    image: "/images/bug-pack.png",
    rarity: "uncommon",
    emoji: "🐛",
  },
  {
    id: "pirate",
    name: "Pirate Pack",
    price: 25,
    booms: [
      { name: "Parrot", rarity: "uncommon", avatar: "🦜", description: "Colorful talking bird" },
      { name: "Treasure Chest", rarity: "rare", avatar: "💰", description: "Full of gold coins" },
      { name: "Ghost Ship", rarity: "epic", avatar: "👻⛵", description: "Haunted vessel" },
      { name: "Kraken", rarity: "legendary", avatar: "🐙", description: "Legendary sea monster" },
      { name: "Golden Compass", rarity: "chroma", avatar: "🌟🧭", description: "Magical navigation tool" },
      { name: "Davy Jones", rarity: "mystical", avatar: "💀⚓", description: "Ruler of the seven seas" },
    ],
    color: "from-blue-600 to-blue-800",
    image: "/images/pirate-pack.png",
    rarity: "uncommon",
    emoji: "🏴‍☠️",
  },
  {
    id: "space",
    name: "Space Pack",
    price: 25,
    booms: [
      { name: "Alien", rarity: "uncommon", avatar: "👽", description: "Friendly extraterrestrial" },
      { name: "Planet", rarity: "rare", avatar: "🪐", description: "Mysterious world" },
      { name: "Black Hole", rarity: "epic", avatar: "🕳️", description: "Space-time anomaly" },
      { name: "Galaxy", rarity: "legendary", avatar: "🌌", description: "Infinite star system" },
      { name: "Cosmic Dragon", rarity: "chroma", avatar: "🌈🐉", description: "Celestial beast" },
      { name: "Universe Core", rarity: "mystical", avatar: "🌟🌌", description: "Origin of all existence" },
    ],
    color: "from-purple-600 to-purple-800",
    image: "/images/space-pack.png",
    rarity: "rare",
    emoji: "🚀",
  },
  {
    id: "medieval",
    name: "Medieval Pack",
    price: 25,
    booms: [
      { name: "Castle", rarity: "uncommon", avatar: "🏰", description: "Mighty stone fortress" },
      { name: "Dragon", rarity: "rare", avatar: "🐲", description: "Fire-breathing beast" },
      { name: "Wizard", rarity: "epic", avatar: "🧙‍♂️", description: "Master of ancient magic" },
      { name: "Crown Jewels", rarity: "legendary", avatar: "👑💎", description: "Royal treasure" },
      { name: "Excalibur", rarity: "chroma", avatar: "🌟⚔️", description: "Legendary sword of kings" },
      { name: "Merlin's Staff", rarity: "mystical", avatar: "🔮⚡", description: "Ultimate magical artifact" },
    ],
    color: "from-amber-600 to-amber-800",
    image: "/images/medieval-pack.png",
    rarity: "uncommon",
    emoji: "🏰",
  },
  {
    id: "safari",
    name: "Safari Pack",
    price: 25,
    booms: [
      { name: "Elephant", rarity: "uncommon", avatar: "🐘", description: "Gentle giant" },
      { name: "Giraffe", rarity: "rare", avatar: "🦒", description: "Tallest animal" },
      { name: "Rhino", rarity: "epic", avatar: "🦏", description: "Armored powerhouse" },
      { name: "White Tiger", rarity: "legendary", avatar: "🐅✨", description: "Rare striped hunter" },
      { name: "Golden Leopard", rarity: "chroma", avatar: "🌟🐆", description: "Mystical spotted cat" },
      { name: "Spirit Lion", rarity: "mystical", avatar: "👻🦁", description: "Guardian of the savanna" },
    ],
    color: "from-orange-600 to-orange-800",
    image: "/images/safari-pack.png",
    rarity: "uncommon",
    emoji: "🦁",
  },
  {
    id: "aquatic",
    name: "Aquatic Pack",
    price: 25,
    booms: [
      { name: "Dolphin", rarity: "uncommon", avatar: "🐬", description: "Intelligent sea mammal" },
      { name: "Octopus", rarity: "rare", avatar: "🐙", description: "Eight-armed wonder" },
      { name: "Whale", rarity: "epic", avatar: "🐋", description: "Gentle ocean giant" },
      { name: "Mermaid", rarity: "legendary", avatar: "🧜‍♀️", description: "Mythical sea being" },
      { name: "Poseidon's Trident", rarity: "chroma", avatar: "🌊🔱", description: "God of the sea's weapon" },
      { name: "Leviathan", rarity: "mystical", avatar: "🌊🐉", description: "Ancient sea serpent" },
    ],
    color: "from-cyan-600 to-cyan-800",
    image: "/images/aquatic-pack.png",
    rarity: "uncommon",
    emoji: "🌊",
  },
  {
    id: "breakfast",
    name: "Breakfast Pack",
    price: 25,
    booms: [
      { name: "Bacon", rarity: "uncommon", avatar: "🥓", description: "Crispy strips" },
      { name: "Waffle", rarity: "rare", avatar: "🧇", description: "Golden grid delight" },
      { name: "French Toast", rarity: "epic", avatar: "🍞✨", description: "Sweet bread perfection" },
      { name: "Golden Egg", rarity: "legendary", avatar: "🥚💛", description: "Perfect morning protein" },
      { name: "Rainbow Cereal", rarity: "chroma", avatar: "🌈🥣", description: "Magical morning bowl" },
      { name: "Ambrosia", rarity: "mystical", avatar: "🍯✨", description: "Food of the gods" },
    ],
    color: "from-yellow-600 to-yellow-800",
    image: "/images/breakfast-pack.png",
    rarity: "uncommon",
    emoji: "🥞",
  },
  {
    id: "dino",
    name: "Dino Pack",
    price: 25,
    booms: [
      { name: "Triceratops", rarity: "uncommon", avatar: "🦕", description: "Three-horned herbivore" },
      { name: "Pterodactyl", rarity: "rare", avatar: "🦅", description: "Flying reptile" },
      { name: "Stegosaurus", rarity: "epic", avatar: "🦴", description: "Spiked back defender" },
      { name: "Fossil", rarity: "legendary", avatar: "🦴✨", description: "Ancient remains" },
      { name: "Meteor", rarity: "chroma", avatar: "☄️🌈", description: "Extinction event" },
      { name: "Primordial Beast", rarity: "mystical", avatar: "🌋🦖", description: "First of its kind" },
    ],
    color: "from-stone-600 to-stone-800",
    image: "/images/dino-pack.png",
    rarity: "epic",
    emoji: "🦖",
  },
  {
    id: "bot",
    name: "Bot Pack",
    price: 25,
    booms: [
      { name: "Drone", rarity: "uncommon", avatar: "🛸", description: "Flying machine" },
      { name: "Cyborg", rarity: "rare", avatar: "🦾", description: "Half human, half machine" },
      { name: "AI Core", rarity: "epic", avatar: "🧠💻", description: "Artificial intelligence" },
      { name: "Quantum Computer", rarity: "legendary", avatar: "💻✨", description: "Ultimate processing power" },
      { name: "Digital Soul", rarity: "chroma", avatar: "🌈💾", description: "Consciousness in code" },
      { name: "Singularity", rarity: "mystical", avatar: "🌌🤖", description: "The awakening" },
    ],
    color: "from-slate-600 to-slate-800",
    image: "/images/bot-pack.png",
    rarity: "rare",
    emoji: "🤖",
  },
  {
    id: "wonderland",
    name: "Wonderland Pack",
    price: 25,
    booms: [
      { name: "Cheshire Cat", rarity: "uncommon", avatar: "😸", description: "Grinning feline" },
      { name: "White Rabbit", rarity: "rare", avatar: "🐰⏰", description: "Always late" },
      { name: "Queen of Hearts", rarity: "epic", avatar: "👸♥️", description: "Off with their heads!" },
      { name: "Magic Mushroom", rarity: "legendary", avatar: "🍄✨", description: "Eat me, drink me" },
      { name: "Looking Glass", rarity: "chroma", avatar: "🪞🌈", description: "Portal to another world" },
      { name: "Jabberwocky", rarity: "mystical", avatar: "🐉🔥", description: "Beware the Jabberwock!" },
    ],
    color: "from-pink-600 to-pink-800",
    image: "/images/wonderland-pack.png",
    rarity: "legendary",
    emoji: "🎩",
  },
  {
    id: "outback",
    name: "Outback Pack",
    price: 25,
    booms: [
      { name: "Koala", rarity: "uncommon", avatar: "🐨", description: "Eucalyptus lover" },
      { name: "Crocodile", rarity: "rare", avatar: "🐊", description: "Swamp predator" },
      { name: "Dingo", rarity: "epic", avatar: "🐕", description: "Wild Australian dog" },
      { name: "Opal", rarity: "legendary", avatar: "💎🌈", description: "Australian gemstone" },
      { name: "Dreamtime Spirit", rarity: "chroma", avatar: "🌟🪃", description: "Ancient Aboriginal magic" },
      { name: "Rainbow Serpent", rarity: "mystical", avatar: "🌈🐍", description: "Creator of the land" },
    ],
    color: "from-red-600 to-red-800",
    image: "/images/outback-pack.png",
    rarity: "uncommon",
    emoji: "🦘",
  },
  {
    id: "ice",
    name: "Ice Pack",
    price: 25,
    booms: [
      { name: "Polar Bear", rarity: "uncommon", avatar: "🐻‍❄️", description: "Arctic hunter" },
      { name: "Seal", rarity: "rare", avatar: "🦭", description: "Playful swimmer" },
      { name: "Yeti", rarity: "epic", avatar: "🦣", description: "Abominable snowman" },
      { name: "Ice Crystal", rarity: "legendary", avatar: "❄️💎", description: "Frozen perfection" },
      { name: "Aurora Borealis", rarity: "chroma", avatar: "🌌🌈", description: "Northern lights magic" },
      { name: "Frost Titan", rarity: "mystical", avatar: "❄️👹", description: "Lord of eternal winter" },
    ],
    color: "from-blue-400 to-blue-600",
    image: "/images/ice-pack.png",
    rarity: "rare",
    emoji: "❄️",
  },
]

// Rarity chances for pack opening (total = 100%)
const RARITY_CHANCES = {
  uncommon: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  chroma: 0.9,
  mystical: 0.1,
}

const DAILY_SPIN_REWARDS = [500, 750, 1000, 1250, 1500, 2000, 2500, 5000]

const PROFILE_PICTURES = [
  "🎯",
  "🎮",
  "🎲",
  "🎪",
  "🎨",
  "🎭",
  "🎸",
  "🎺",
  "🎻",
  "🎤",
  "⚡",
  "🔥",
  "💎",
  "⭐",
  "🌟",
  "✨",
  "🌈",
  "🦄",
  "🐉",
  "👑",
]

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "0",
    title: "Boomkit V1.0 is Out!",
    content:
      "We are thrilled to announce the official release of Boomkit V1.0! This major milestone brings real-time chat, live auctions, global leaderboards, and pack opening features. Thank you to our amazing community for your support. Special thanks to Nazli Abdullazada (Tester) and Oktay Abdullazada (Owner) for making this possible!",
    date: "2024-12-19",
    image: "🎉",
  },
]

export default function BoomkitGame() {
  const [currentView, setCurrentView] = useState<"register" | "login" | "game" | "owner-access">("owner-access")
  const [currentPage, setCurrentPage] = useState<
    | "stats"
    | "booms"
    | "market"
    | "settings"
    | "chat"
    | "auction"
    | "staff"
    | "news"
    | "upgrade"
    | "leaderboard"
    | "trading"
  >("stats")
  const [currentUser, setCurrentUser] = useState<GameUser | null>(null)
  const [users, setUsers] = useState<GameUser[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [ownerAccessCode, setOwnerAccessCode] = useState("")
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([])
  const [showNews, setShowNews] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // <-- Added mobile sidebar state
  const [packAnimation, setPackAnimation] = useState<{
    show: boolean
    stage: "shake" | "burst" | "reveal" | "done"
    boom: BoomItem | null
    packName: string
    packImage: string
    particles: Array<{ id: number; emoji: string; tx: number; ty: number }>
  }>({
    show: false,
    stage: "shake",
    boom: null,
    packName: "",
    packImage: "",
    particles: [],
  })
  const [showProfilePicker, setShowProfilePicker] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [showEmailEdit, setShowEmailEdit] = useState(false)
  const [showPasswordEdit, setShowPasswordEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [staffSearchQuery, setStaffSearchQuery] = useState("") // Added for Staff search
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false) // Fixed typo from setShowShowPrivacyPolicy
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [canSpin, setCanSpin] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)
  const [showUserStats, setShowUserStats] = useState(false)
  const [selectedUserStats, setSelectedUserStats] = useState<GameUser | null>(null)
  const [systemSignature, setSystemSignature] = useState<string>("")
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [showRoleManager, setShowRoleManager] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("bg-blue-500")
  const [selectedUserForRole, setSelectedUserForRole] = useState("")

  const supabase = useMemo(() => (typeof window !== "undefined" ? getSupabaseBrowserClient() : null), [])
  const router = useRouter()

  // Badge management states
  const [showBadgeManager, setShowBadgeManager] = useState(false)
  const [selectedUserForBadge, setSelectedUserForBadge] = useState("")
  const [selectedBadge, setSelectedBadge] = useState("")

  // Boom selling/auction states
  const [showBoomAction, setShowBoomAction] = useState(false)
  const [selectedBoom, setSelectedBoom] = useState<string | null>(null)
  const [auctionPrice, setAuctionPrice] = useState("")
  const [auctionDuration, setAuctionDuration] = useState("24")
  // Multi-sell states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedBoomsForSell, setSelectedBoomsForSell] = useState<Set<string>>(new Set())

  // Moderation states
  const [showMuteDialog, setShowMuteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [userToModerate, setUserToModerate] = useState<GameUser | null>(null)
  const [muteDuration, setMuteDuration] = useState("1") // in hours
  const [banReason, setBanReason] = useState("")

  // Edit User State
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [editTokenValue, setEditTokenValue] = useState("")
  const [userToEdit, setUserToEdit] = useState<GameUser | null>(null)

  // Secret owner access code

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    reason: "",
  })

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  })

  // --- DATA PERSISTENCE AND SYNC HOOKS ---

  const updateAndPersistUsers = useCallback(
    async (newUsers: GameUser[]) => {
      setUsers(newUsers)
      localStorage.setItem("boomkit_approved_users", JSON.stringify(newUsers))

      for (const user of newUsers) {
        if (!supabase) continue
        try {
          console.log("[v0] Syncing user to Supabase:", user.username, "role:", user.role)
          const { error } = await supabase.from("users").upsert(
            {
              id: user.id,
              username: user.username,
              email: user.email || "",
              tokens: user.tokens || 0,
              boom_score: user.boomScore || 0,
              role: user.role,
              status: user.status || "approved",
              is_banned: user.isBanned || false,
              is_muted: user.isMuted || false,
              mute_expiry: user.muteExpiry || null,
              ban_expiry: user.banExpiry || null,
              ban_reason: user.banReason || null,
              banner_color: user.bannerColor || "from-purple-600 to-pink-600",
              packs_opened: user.packsOpened || 0,
              badges: user.badges || [],
              packs: user.packs || [],
              booms: user.booms || {},
              daily_tokens: user.dailyTokens || 0,
              total_value: user.totalValue || 0,
              join_date: user.joinDate || new Date().toISOString().split("T")[0],
              profile_picture: user.profilePicture || "🎮",
              is_owner: user.isOwner || false,
              is_plus_user: user.isPlusUser || false,
              last_daily_spin: user.lastDailySpin || "",
              name_color: user.nameColor || "text-white",
              last_seen: user.lastSeen || Date.now(),
              reason: user.reason || "",
            },
            { onConflict: "id" },
          )
          if (error) {
            console.error("[v0] Error syncing user:", user.username, error)
          } else {
            console.log("[v0] Successfully synced user:", user.username)
          }
        } catch (err) {
          console.error("[v0] Failed to sync user to Supabase:", err)
        }
      }
    },
    [supabase],
  )

  // Declaring updateAndPersistAuctions and updateAndPersist
}
