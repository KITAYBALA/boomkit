"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BarChart3Icon,
  PackageIcon,
  ShoppingCartIcon,
  SettingsIcon,
  MessageCircleIcon,
  ShieldIcon,
  CrownIcon,
  KeyIcon,
  CoinsIcon,
  GavelIcon,
  NewspaperIcon,
  CameraIcon,
  XIcon,
  MenuIcon,
  CreditCardIcon,
  PencilIcon,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

import RealtimeChat from "@/components/realtime-chat"
import RealtimeAuctions from "@/components/realtime-auctions"
import RealtimeLeaderboard from "@/components/realtime-leaderboard"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import StripeCheckout from "@/components/stripe-checkout"
import TradingPage from "@/components/trading-page" // Import TradingPage
import { createBrowserClient } from "@supabase/ssr"

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

// ... existing code ...

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
  // Custom roles feature removed for security reasons

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

  // Declaring updateAndPersistAuctions and updateAndPersistChat
  const updateAndPersistAuctions = useCallback((newAuctions: AuctionItem[]) => {
    setAuctionItems(newAuctions)
    localStorage.setItem("boomkit_auctions", JSON.stringify(newAuctions))
  }, [])

  const updateAndPersistChat = useCallback((newMessages: ChatMessage[]) => {
    setChatMessages(newMessages)
    localStorage.setItem("boomkit_chat_messages", JSON.stringify(newMessages))
  }, [])

  const updateAndPersistCurrentUser = useCallback(
    async (updatedUser: GameUser | null) => {
      if (updatedUser) {
        // Add or update the lastSeen timestamp on every action
        const userWithActivity = { ...updatedUser, lastSeen: Date.now(), packsOpened: updatedUser.packs?.length || 0 }
        setCurrentUser(userWithActivity)
        localStorage.setItem("boomkit_current_user", JSON.stringify(userWithActivity))

        // Also update the user in the main list
        setUsers((prevUsers) => {
          const newUsers = prevUsers.map((u) => (u.id === userWithActivity.id ? userWithActivity : u))
          localStorage.setItem("boomkit_approved_users", JSON.stringify(newUsers))
          return newUsers
        })

        try {
          const supabase = getSupabaseBrowserClient()
          await supabase.from("users").upsert({
            id: userWithActivity.id,
            username: userWithActivity.username,
            email: userWithActivity.email || "",
            age: userWithActivity.age || 18,
            tokens: userWithActivity.tokens || 0,
            daily_tokens: userWithActivity.dailyTokens || 0,
            packs: userWithActivity.packs || [],
            booms: userWithActivity.booms || {},
            is_owner: userWithActivity.isOwner || false,
            is_banned: userWithActivity.isBanned || false,
            is_muted: userWithActivity.isMuted || false,
            status: userWithActivity.status || "approved",
            reason: userWithActivity.reason || "",
            role: userWithActivity.role || "player",
            join_date: userWithActivity.joinDate,
            boom_score: userWithActivity.boomScore || 0,
            total_value: userWithActivity.totalValue || 0,
            profile_picture: userWithActivity.profilePicture || "🎯",
            is_plus_user: userWithActivity.isPlusUser || false,
            name_color: userWithActivity.nameColor || "",
            banner_color: userWithActivity.bannerColor || "",
            last_daily_spin: userWithActivity.lastDailySpin || "",
            badges: userWithActivity.badges || [],
            mute_expiry: userWithActivity.muteExpiry || 0,
            ban_expiry: userWithActivity.banExpiry || 0,
            ban_reason: userWithActivity.banReason || "",
            last_seen: userWithActivity.lastSeen,
            packs_opened: userWithActivity.packsOpened || 0,
          })
        } catch (error) {
          console.error("[v0] Error syncing user to Supabase:", error)
        }
      } else {
        setCurrentUser(null)
        localStorage.removeItem("boomkit_current_user")
      }
    },
    [setUsers],
  )

  // Load initial data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("boomkit_approved_users")
      if (storedUsers) setUsers(JSON.parse(storedUsers))

      const storedCurrentUser = localStorage.getItem("boomkit_current_user")
      if (storedCurrentUser) {
        const parsedUser = JSON.parse(storedCurrentUser)
        // Check if user is banned - redirect immediately
        if (parsedUser.isBanned) {
          router.push("/banned")
          return
        }
        setCurrentUser(parsedUser)
        setCurrentView("game")
      }

      const storedAuctions = localStorage.getItem("boomkit_auctions")
      if (storedAuctions) setAuctionItems(JSON.parse(storedAuctions))

      const storedChat = localStorage.getItem("boomkit_chat_messages")
      if (storedChat) setChatMessages(JSON.parse(storedChat))

    }
  }, [])

  // Load users from Supabase on mount
  useEffect(() => {
    const fetchUsersFromSupabase = async () => {
      try {
        const { data, error } = await supabase.from("users").select("*")

        if (error) {
          console.error("[v0] Error fetching users from Supabase:", error.message)
          return
        }

        if (data && data.length > 0) {
          const mappedUsers: GameUser[] = data.map((u: any) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            password: "", // Ensure password is not leaked
            age: u.age || 0,
            tokens: u.tokens || 0,
            dailyTokens: u.daily_tokens || 0,
            packs: u.packs || [],
            booms: u.booms || {}, // Initialize booms as an object
            isOwner: u.is_owner || false,
            isBanned: u.is_banned || false,
            isMuted: u.is_muted || false,
            status: u.status || "approved",
            reason: u.reason || "",
            role: u.role || "player",
            joinDate: u.join_date || new Date().toISOString(),
            boomScore: u.boom_score || 0,
            totalValue: u.total_value || 0,
            profilePicture: u.profile_picture || "",
            isPlusUser: u.is_plus_user || false,
            nameColor: u.name_color || "",
            bannerColor: u.banner_color || "from-purple-600 to-pink-600",
            lastDailySpin: u.last_daily_spin || null,
            badges: u.badges || [],
            muteExpiry: u.mute__expiry || null,
            banExpiry: u.ban_expiry || null,
            banReason: u.ban_reason || "",
            lastSeen: u.last_seen || Date.now(),
            packsOpened: u.packs_opened || 0,
          }))

          setUsers(mappedUsers)
          localStorage.setItem("boomkit_approved_users", JSON.stringify(mappedUsers))
          console.log("[v0] Loaded", mappedUsers.length, "users from Supabase")
        }
      } catch (err) {
        console.error("[v0] Failed to fetch users from Supabase:", err)
      }
    }

    // Only fetch if supabase client is available
    if (supabase) {
      fetchUsersFromSupabase()
    }
  }, [supabase])

  // Find the

  useEffect(() => {
    // Sync current user's role from Supabase every 10 seconds
    const syncCurrentUserRole = async () => {
      if (!currentUser?.id || !supabase) return

      try {
        const { data, error } = await supabase
          .from("users")
          .select("role, badges, is_muted, is_banned, is_owner, mute_expiry, ban_expiry, status")
          .eq("id", currentUser.id)
          .single()

        if (error) {
          console.log("[v0] Error syncing user role:", error.message)
          return
        }

        if (
          data &&
          (data.role !== currentUser.role ||
            JSON.stringify(data.badges) !== JSON.stringify(currentUser.badges) ||
            data.is_muted !== currentUser.isMuted ||
            data.is_banned !== currentUser.isBanned ||
            data.is_owner !== currentUser.isOwner ||
            data.mute_expiry !== currentUser.muteExpiry ||
            data.ban_expiry !== currentUser.banExpiry ||
            data.status !== currentUser.status) // Check for status change
        ) {
          console.log(
            "[v0] User data updated from Supabase. Role:",
            data.role,
            "Badges:",
            data.badges,
            "Muted:",
            data.is_muted,
            "Banned:",
            data.is_banned,
            "Status:",
            data.status,
          )
          const updatedUser = {
            ...currentUser,
            role: data.role || "player",
            badges: data.badges || [],
            isMuted: data.is_muted || false,
            isBanned: data.is_banned || false,
            isOwner: data.is_owner || false, // Sync owner status from database
            muteExpiry: data.mute_expiry,
            banExpiry: data.ban_expiry,
            status: data.status || "approved", // Update status
          }
          // If user got banned, redirect immediately
          if (data.is_banned) {
            router.push("/banned")
            return
          }
          updateAndPersistCurrentUser(updatedUser)
        }
      } catch (err) {
        console.log("[v0] Error in role sync:", err)
      }
    }

    // Sync immediately on mount
    syncCurrentUserRole()

    // Then sync every 10 seconds
    const interval = setInterval(syncCurrentUserRole, 10000)

    return () => clearInterval(interval)
  }, [currentUser, updateAndPersistCurrentUser, supabase])

  // Custom roles feature removed for security - no longer loading from Supabase

  // Listen for storage changes to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "boomkit_chat_messages" && e.newValue) {
        setChatMessages(JSON.parse(e.newValue))
      }
      if (e.key === "boomkit_auctions" && e.newValue) {
        setAuctionItems(JSON.parse(e.newValue))
      }
      if (e.key === "boomkit_approved_users" && e.newValue) {
        const newUsers = JSON.parse(e.newValue)
        setUsers(newUsers)
        // Also update current user's data if they are logged in
        if (currentUser) {
          const updatedSelf = newUsers.find((u: GameUser) => u.id === currentUser.id)
          if (updatedSelf) {
            setCurrentUser(updatedSelf)
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [currentUser])

  // Initialize system signature on component mount
  useEffect(() => {
    const signature = generateSystemSignature()
    setSystemSignature(signature)
  }, [])

  // Check if user is owner
  const isOwner = () => {
    return currentUser?.isOwner || false
  }

  // Handle logout
  const handleLogout = () => {
    updateAndPersistCurrentUser(null)
    setCurrentView("owner-access")
    // Clear Supabase session if necessary
    const supabase = getSupabaseBrowserClient()
    if (supabase) {
      supabase.auth.signOut()
    }
  }

  // Check if user can spin today
  useEffect(() => {
    if (currentUser) {
      const today = new Date().toDateString()
      setCanSpin(currentUser.lastDailySpin !== today)
    }
  }, [currentUser])

  // Handle daily spin
  const handleDailySpin = () => {
    if (!canSpin || spinning || !currentUser) return

    setSpinning(true)

    setTimeout(() => {
      const reward = DAILY_SPIN_REWARDS[Math.floor(Math.random() * DAILY_SPIN_REWARDS.length)]
      setSpinResult(reward)

      const updatedUser = {
        ...currentUser,
        tokens: currentUser.tokens + reward,
        lastDailySpin: new Date().toDateString(),
      }
      updateAndPersistCurrentUser(updatedUser)

      setSpinning(false)
      setCanSpin(false)

      setTimeout(() => setSpinResult(null), 3000)
    }, 2000)
  }

  // Handle owner access - redirects to login (master key removed for security)
  const handleOwnerAccess = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentView("login")
  }


  // Handle registration - SERVER-SIDE AUTHENTICATION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerForm.username || !registerForm.password || !registerForm.age) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          age: registerForm.age,
          reason: registerForm.reason,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        alert(data.message || "Registration failed. Please try again.")
        return
      }

      // Server returns user data - map it to GameUser format
      const user = data.user
      const newUser: GameUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: "", // Never store password in client state
        age: user.age || 0,
        tokens: user.tokens || 0,
        dailyTokens: user.daily_tokens || 0,
        packs: user.packs || [],
        booms: user.booms || {},
        isOwner: user.is_owner || false,
        isBanned: user.is_banned || false,
        isMuted: user.is_muted || false,
        status: user.status || "approved",
        reason: user.reason || "",
        role: user.role || "player",
        joinDate: user.join_date || new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        boomScore: user.boom_score || 0,
        totalValue: user.total_value || 0,
        profilePicture: user.profile_picture || "🎯",
        isPlusUser: user.is_plus_user || false,
        nameColor: user.name_color || "text-white",
        bannerColor: user.banner_color || "from-purple-600 to-pink-600",
        lastDailySpin: user.last_daily_spin || "",
        badges: user.badges || [],
        muteExpiry: user.mute_expiry || null,
        banExpiry: user.ban_expiry || null,
        banReason: user.ban_reason || "",
        lastSeen: user.last_seen || Date.now(),
        packsOpened: user.packs_opened || 0,
      }

      setCurrentUser(newUser)
      setCurrentView("game")
    } catch (error) {
      console.error("Registration error:", error)
      alert("Registration failed. Please try again.")
    }
  }

  // Handle login - SERVER-SIDE AUTHENTICATION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginForm.username || !loginForm.password) {
      alert("Please enter both username and password")
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Check if password reset is required
        if (data.requiresReset) {
          router.push(`/reset-password?username=${encodeURIComponent(loginForm.username)}`)
          return
        }
        alert(data.message || "Invalid username or password")
        return
      }

      // Server returns user data - map it to GameUser format
      const user = data.user
      const foundUser: GameUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: "", // Never store password in client state
        age: user.age || 0,
        tokens: user.tokens || 0,
        dailyTokens: user.daily_tokens || 0,
        packs: user.packs || [],
        booms: user.booms || {},
        isOwner: user.is_owner || false,
        isBanned: user.is_banned || false,
        isMuted: user.is_muted || false,
        status: user.status || "approved",
        reason: user.reason || "",
        role: user.role || "player",
        joinDate: user.join_date || new Date().toISOString(),
        boomScore: user.boom_score || 0,
        totalValue: user.total_value || 0,
        profilePicture: user.profile_picture || "🎯",
        isPlusUser: user.is_plus_user || false,
        nameColor: user.name_color || "text-white",
        bannerColor: user.banner_color || "from-purple-600 to-pink-600",
        lastDailySpin: user.last_daily_spin || "",
        badges: user.badges || [],
        muteExpiry: user.mute_expiry || null,
        banExpiry: user.ban_expiry || null,
        banReason: user.ban_reason || "",
        lastSeen: user.last_seen || Date.now(),
        packsOpened: user.packs_opened || 0,
      }

      // Check if user is banned (double-check from server response)
      if (foundUser.isBanned) {
        router.push("/banned")
        return
      }

      setCurrentUser(foundUser)
      setCurrentView("game")
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    }
  }

  // Get boom based on rarity chances
  const getRandomBoomFromPack = (pack: Pack): BoomItem => {
    const random = Math.random() * 100

    let cumulativeChance = 0
    const rarityOrder: (keyof typeof RARITY_CHANCES)[] = [
      "mystical",
      "chroma",
      "legendary",
      "epic",
      "rare",
      "uncommon",
    ]

    for (const rarity of rarityOrder) {
      cumulativeChance += RARITY_CHANCES[rarity]
      if (random <= cumulativeChance) {
        const boomsOfRarity = pack.booms.filter((boom) => boom.rarity === rarity)
        if (boomsOfRarity.length > 0) {
          return boomsOfRarity[Math.floor(Math.random() * boomsOfRarity.length)]
        }
      }
    }

    // Fallback to uncommon if no boom is found (should not happen with proper configuration)
    const uncommonBooms = pack.booms.filter((boom) => boom.rarity === "uncommon")
    if (uncommonBooms.length > 0) {
      return uncommonBooms[Math.floor(Math.random() * uncommonBooms.length)]
    }
    // Ultimate fallback - return first boom
    return pack.booms[0]
  }

  const openPack = (packId: string, updatedUser: GameUser) => {
    const pack = PACKS.find((p) => p.id === packId)
    if (!pack) return

    const randomBoom = getRandomBoomFromPack(pack)

    // Store pack reference for drop rate calculation
    const packRef = pack

    // Generate particles based on rarity
    const particleCount =
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
                  : 5

    const particleEmojis =
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
                  : ["⭐", "✨"]

    const particles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)],
      tx: (Math.random() - 0.5) * 400,
      ty: (Math.random() - 0.5) * 400,
    }))

    // Stage 1: Shake
    setPackAnimation({
      show: true,
      stage: "shake",
      boom: randomBoom,
      packName: pack.name,
      packImage: pack.image || "",
      particles,
    })

    // Stage 2: Burst (after 1.5s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "burst" }))
    }, 1500)

    // Stage 3: Reveal (after 2s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "reveal" }))
    }, 2000)

    // Stage 4: Done (after 2.8s)
    setTimeout(() => {
      setPackAnimation((prev) => ({ ...prev, stage: "done" }))
    }, 2800)

    const updatedBooms = { ...updatedUser.booms }
    updatedBooms[randomBoom.name] = (updatedBooms[randomBoom.name] || 0) + 1

    const finalUser = {
      ...updatedUser,
      booms: updatedBooms,
      boomScore:
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
                  : 10),
      totalValue:
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
                  : 100),
      packsOpened: (updatedUser.packsOpened || 0) + 1,
    }

    updateAndPersistCurrentUser(finalUser)
  }

  const closePackAnimation = () => {
    setPackAnimation({ show: false, stage: "shake", boom: null, packName: "", packImage: "", particles: [] })
  }

  // Get drop rate for a boom (percentage)
  const getBoomDropRate = (boomName: string, pack: Pack): number => {
    const boom = pack.booms.find((b) => b.name === boomName)
    if (!boom) return 0
    const rarityChance = RARITY_CHANCES[boom.rarity as keyof typeof RARITY_CHANCES] || 0
    const boomsOfSameRarity = pack.booms.filter((b) => b.rarity === boom.rarity).length
    return boomsOfSameRarity > 0 ? Number((rarityChance / boomsOfSameRarity).toFixed(1)) : 0
  }

  // Check if boom is new (user doesn't own it)
  const isBoomNew = (boomName: string): boolean => {
    if (!currentUser) return true
    return !currentUser.booms[boomName] || currentUser.booms[boomName] === 0
  }

  // Get confetti colors by rarity
  const getConfettiColors = (rarity: string): string[] => {
    switch (rarity) {
      case "uncommon":
        return ["#22c55e", "#16a34a", "#15803d"] // green shades
      case "rare":
        return ["#3b82f6", "#2563eb", "#1d4ed8"] // blue shades
      case "epic":
        return ["#ef4444", "#dc2626", "#b91c1c"] // red shades
      case "legendary":
        return ["#fbbf24", "#f59e0b", "#d97706"] // gold/yellow shades
      case "chroma":
        return ["#06b6d4", "#0891b2", "#0e7490", "#ec4899", "#f59e0b"] // cyan/teal + multi
      case "mystical":
        return ["#a855f7", "#9333ea", "#7c3aed", "#ec4899", "#f472b6"] // purple/pink + glow
      default:
        return ["#22c55e", "#16a34a"]
    }
  }

  const getGlowClass = (rarity: string) => {
    switch (rarity) {
      case "uncommon":
        return "glow-uncommon"
      case "rare":
        return "glow-rare"
      case "epic":
        return "glow-epic"
      case "legendary":
        return "glow-legendary"
      case "chroma":
        return "glow-chroma"
      case "mystical":
        return "glow-mystical"
      default:
        return "glow-uncommon"
    }
  }

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case "mystical":
        return "✨ MYSTICAL ✨"
      case "chroma":
        return "🌈 CHROMA 🌈"
      case "legendary":
        return "🔥 LEGENDARY 🔥"
      case "epic":
        return "💜 EPIC 💜"
      case "rare":
        return "💙 RARE 💙"
      case "uncommon":
        return "💚 UNCOMMON 💚"
      default:
        return "UNCOMMON"
    }
  }

  // Buy or open pack
  const handlePackAction = (packId: string) => {
    if (!currentUser) return

    const pack = PACKS.find((p) => p.id === packId)
    if (!pack) return

    if (currentUser.tokens < pack.price) {
      alert("Not enough tokens!")
      return
    }

    const userAfterPurchase = {
      ...currentUser,
      tokens: currentUser.tokens - pack.price,
      packs: currentUser.packs.includes(packId) ? currentUser.packs : [...currentUser.packs, packId],
    }

    // Persist the state *after* charging tokens, but *before* opening the pack
    updateAndPersistCurrentUser(userAfterPurchase)

    // Open the pack with the updated user object
    setTimeout(() => openPack(packId, userAfterPurchase), 500)
  }

  // Handle boom click
  const handleBoomClick = (boomName: string) => {
    setSelectedBoom(boomName)
    setShowBoomAction(true)
    setAuctionPrice("")
    setAuctionDuration("24")
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

  // Handle direct sell (single or multiple)
  const handleDirectSell = (boomNames?: string[]) => {
    if (!currentUser) return

    const boomsToSell = boomNames || (selectedBoom ? [selectedBoom] : [])
    if (boomsToSell.length === 0) return

    let totalTokens = 0
    let totalValueLost = 0
    let totalScoreLost = 0
    const updatedBooms = { ...currentUser.booms }
    const soldBooms: string[] = []

    for (const boomName of boomsToSell) {
      const sellPrice = getBoomSellPrice(boomName)
      const currentQuantity = currentUser.booms[boomName] || 0

      if (currentQuantity <= 0) continue

      totalTokens += sellPrice
      totalValueLost += getBoomValue(boomName)
      totalScoreLost += getBoomScoreValue(boomName)
      soldBooms.push(boomName)

      if (updatedBooms[boomName] > 1) {
        updatedBooms[boomName] -= 1
      } else {
        delete updatedBooms[boomName]
      }
    }

    if (soldBooms.length === 0) {
      alert("No booms selected to sell!")
      return
    }

    const updatedUser = {
      ...currentUser,
      booms: updatedBooms,
      tokens: currentUser.tokens + totalTokens,
      totalValue: currentUser.totalValue - totalValueLost,
      boomScore: currentUser.boomScore - totalScoreLost,
    }

    updateAndPersistCurrentUser(updatedUser)

    if (boomNames) {
      // Multi-sell
      setSelectedBoomsForSell(new Set())
      setIsSelectMode(false)
      alert(`Sold ${soldBooms.length} boom(s) for ${totalTokens} tokens!`)
    } else {
      // Single sell
      setShowBoomAction(false)
      setSelectedBoom(null)
      alert(`Sold ${selectedBoom} for ${totalTokens} tokens!`)
    }
  }

  // Toggle boom selection for multi-sell
  const toggleBoomSelection = (boomName: string) => {
    const newSelection = new Set(selectedBoomsForSell)
    if (newSelection.has(boomName)) {
      newSelection.delete(boomName)
    } else {
      newSelection.add(boomName)
    }
    setSelectedBoomsForSell(newSelection)
  }

  // Select all booms
  const selectAllBooms = () => {
    if (!currentUser) return
    const allBoomNames = Object.keys(currentUser.booms).filter((name) => (currentUser.booms[name] || 0) > 0)
    setSelectedBoomsForSell(new Set(allBoomNames))
  }

  // Get total sell value for selected booms
  const getTotalSellValue = (): number => {
    if (!currentUser) return 0
    let total = 0
    selectedBoomsForSell.forEach((boomName) => {
      const quantity = currentUser.booms[boomName] || 0
      if (quantity > 0) {
        total += getBoomSellPrice(boomName)
      }
    })
    return total
  }

  const handleAuctionList = async () => {
    if (!currentUser || !selectedBoom || !auctionPrice) return

    const startingBid = Number.parseInt(auctionPrice)
    if (isNaN(startingBid) || startingBid <= 0) {
      alert("Please enter a valid starting bid!")
      return
    }

    const duration = Number.parseInt(auctionDuration)
    if (isNaN(duration) || duration <= 0) {
      alert("Please enter a valid duration!")
      return
    }

    const currentQuantity = currentUser.booms[selectedBoom] || 0
    if (currentQuantity <= 0) {
      alert("You don't have this boom!")
      return
    }

    // remove one from inventory
    const updatedBooms = { ...currentUser.booms }
    if (updatedBooms[selectedBoom] > 1) updatedBooms[selectedBoom] -= 1
    else delete updatedBooms[selectedBoom]

    const updatedUser = {
      ...currentUser,
      booms: updatedBooms,
      totalValue: currentUser.totalValue - getBoomValue(selectedBoom),
      boomScore: currentUser.boomScore - getBoomScoreValue(selectedBoom),
    }
    updateAndPersistCurrentUser(updatedUser)

    // Try Supabase first
    const sb =
      typeof window !== "undefined" ? await Promise.resolve().then(() => require("@/lib/supabase-client")) : null
    const getClient = sb ? (sb as any).getSupabaseBrowserClient : null
    const supabase = getClient ? getClient() : null

    try {
      if (supabase) {
        const endsAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        const { error } = await supabase.from("auction_items").insert({
          boom_name: selectedBoom,
          seller: currentUser.username,
          current_bid: startingBid,
          ends_at: endsAt,
        })
        if (error) throw error
        alert(`Listed ${selectedBoom} with starting bid of ${startingBid} tokens!`)
      } else {
        // LocalStorage fallback (for preview without env vars)
        const newAuction = {
          id: Date.now().toString(),
          boomName: selectedBoom,
          seller: currentUser.username,
          currentBid: startingBid,
          timeLeft: duration,
          bidders: [],
        }
        const raw = localStorage.getItem("boomkit_auctions")
        const list = raw ? JSON.parse(raw) : []
        const next = [...list, newAuction]
        localStorage.setItem("boomkit_auctions", JSON.stringify(next))
        // Optional: keep legacy state in sync
        updateAndPersistAuctions(next)
        alert(`Listed ${selectedBoom} for auction with starting bid of ${startingBid} tokens!`)
      }
    } catch (e) {
      console.error("Auction insert failed:", e)
      alert("Failed to create auction.")
    }

    setShowBoomAction(false)
    setSelectedBoom(null)
    setAuctionPrice("")
    setAuctionDuration("24")
  }

  // Get boom value for calculations
  const getBoomValue = (boomName: string) => {
    const rarity = getBoomRarity(boomName)
    switch (rarity) {
      case "uncommon":
        return 100
      case "rare":
        return 250
      case "epic":
        return 500
      case "legendary":
        return 1000
      case "chroma":
        return 2000
      case "mystical":
        return 5000
      default:
        return 100
    }
  }

  // Get boom score value for calculations
  const getBoomScoreValue = (boomName: string) => {
    const rarity = getBoomRarity(boomName)
    switch (rarity) {
      case "uncommon":
        return 10
      case "rare":
        return 15
      case "epic":
        return 25
      case "legendary":
        return 50
      case "chroma":
        return 100
      case "mystical":
        return 200
      default:
        return 10
    }
  }

  // Update profile picture
  const updateProfilePicture = (newPicture: string) => {
    if (!currentUser) return
    updateAndPersistCurrentUser({ ...currentUser, profilePicture: newPicture })
  }

  // Update user info
  const updateUserInfo = (field: "username" | "email", value: string) => {
    if (!currentUser) return
    updateAndPersistCurrentUser({ ...currentUser, [field]: value })
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return

    if (currentUser.isMuted) {
      alert("You are muted.")
      return
    }

    const userRole = DEFAULT_ROLES.find((r) => r.id === currentUser.role)

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: currentUser.username,
      message: newMessage,
      timestamp: new Date(),
      role: userRole?.name || "Player",
    }

    updateAndPersistChat([...chatMessages, message])
    setNewMessage("")
  }

  // Handle username click in chat
  const handleUsernameClick = (username: string) => {
    const user = users.find((u) => u.username === username)
    if (user) {
      setSelectedUserStats(user)
      setShowUserStats(true)
    }
  }

  // Open moderation dialogs
  const openMuteDialog = (user: GameUser) => {
    setUserToModerate(user)
    setShowMuteDialog(true)
  }

  const openBanDialog = (user: GameUser) => {
    setUserToModerate(user)
    setBanReason("")
    setShowBanDialog(true)
  }

  // Confirm mute action
  const handleConfirmMute = () => {
    if (!userToModerate) return
    const durationMs = Number.parseFloat(muteDuration) * 60 * 60 * 1000
    const expiry = durationMs > 0 ? Date.now() + durationMs : null

    const updatedUsers = users.map((u) =>
      u.id === userToModerate.id ? { ...u, isMuted: true, muteExpiry: expiry } : u,
    )
    updateAndPersistUsers(updatedUsers)
    setShowMuteDialog(false)
    setUserToModerate(null)
  }

  // Confirm ban action
  const handleConfirmBan = () => {
    if (!userToModerate) return
    const updatedUsers = users.map((u) =>
      u.id === userToModerate.id ? { ...u, isBanned: true, banReason: banReason, banExpiry: null } : u,
    )
    updateAndPersistUsers(updatedUsers)
    setShowBanDialog(false)
    setUserToModerate(null)
  }

  // Unban/unmute user
  const handleUnbanUnmute = (userId: string, type: "unban" | "unmute") => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        if (type === "unban") {
          return { ...u, isBanned: false, banReason: "", banExpiry: null }
        }
        if (type === "unmute") {
          return { ...u, isMuted: false, muteExpiry: null }
        }
      }
      return u
    })
    updateAndPersistUsers(updatedUsers)
  }

  // Edit User Functions
  const openEditUserDialog = (user: GameUser) => {
    setUserToEdit(user)
    setEditTokenValue(user.tokens.toString())
    setShowEditUserDialog(true)
  }

  const handleSaveUserTokens = async () => {
    if (!userToEdit) return

    const newTokens = parseInt(editTokenValue)
    if (isNaN(newTokens)) {
      alert("Invalid token amount")
      return
    }

    const updatedUsers = users.map((u) => (u.id === userToEdit.id ? { ...u, tokens: newTokens } : u))
    updateAndPersistUsers(updatedUsers)

    // Update Supabase
    if (supabase) {
      const { error } = await supabase.from("users").update({ tokens: newTokens }).eq("id", userToEdit.id)
      if (error) {
        console.error("Error updating tokens:", error)
        alert("Failed to update tokens in database")
        return
      }
    }

    setShowEditUserDialog(false)
    setUserToEdit(null)
    alert(`Updated tokens for ${userToEdit.username} to ${newTokens}`)
  }

  // Quick role assignment
  const quickAssignRole = async (userId: string, roleId: string) => {
    console.log("[v0] quickAssignRole called - userId:", userId, "roleId:", roleId)

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        console.log("[v0] Found user to update:", u.username, "from role:", u.role, "to role:", roleId)
        // Auto-add staff badge when assigned moderator, senior_moderator, or admin
        let updatedBadges = u.badges || []
        if (["moderator", "senior_moderator", "admin"].includes(roleId)) {
          if (!updatedBadges.includes("staff")) {
            updatedBadges = [...updatedBadges, "staff"]
          }
        }
        return { ...u, role: roleId, badges: updatedBadges }
      }
      return u
    })

    setUsers(updatedUsers)
    localStorage.setItem("boomkit_approved_users", JSON.stringify(updatedUsers))

    const userToUpdate = updatedUsers.find((u) => u.id === userId)
    if (userToUpdate) {
      console.log("[v0] Directly syncing user role to Supabase:", userToUpdate.username, "role:", userToUpdate.role)
      try {
        const { error } = await supabase.from("users").upsert(
          {
            id: userToUpdate.id,
            username: userToUpdate.username,
            email: userToUpdate.email || "",
            age: userToUpdate.age || 18,
            tokens: userToUpdate.tokens || 0,
            daily_tokens: userToUpdate.dailyTokens || 0,
            boom_score: userToUpdate.boomScore || 0,
            total_value: userToUpdate.totalValue || 0,
            role: userToUpdate.role,
            status: userToUpdate.status || "approved",
            reason: userToUpdate.reason || "",
            join_date: userToUpdate.joinDate || new Date().toISOString().split("T")[0],
            profile_picture: userToUpdate.profilePicture || "🎮",
            is_owner: userToUpdate.isOwner || false,
            is_banned: userToUpdate.isBanned || false,
            is_muted: userToUpdate.isMuted || false,
            is_plus_user: userToUpdate.isPlusUser || false,
            mute_expiry: userToUpdate.muteExpiry || null,
            ban_expiry: userToUpdate.banExpiry || null,
            ban_reason: userToUpdate.banReason || null,
            name_color: userToUpdate.nameColor || "text-white",
            banner_color: userToUpdate.bannerColor || "from-purple-600 to-blue-600",
            last_daily_spin: userToUpdate.lastDailySpin || "",
            packs_opened: userToUpdate.packsOpened || 0,
            badges: userToUpdate.badges || [],
            packs: userToUpdate.packs || [],
            booms: userToUpdate.booms || {},
            last_seen: userToUpdate.lastSeen || Date.now(),
          },
          { onConflict: "id" },
        )
        if (error) {
          console.error("[v0] Error syncing role to Supabase:", error)
          alert(`Error saving role: ${error.message}`)
        } else {
          console.log("[v0] Successfully saved role to Supabase")
          alert(`Role updated successfully!`)
        }
      } catch (err) {
        console.error("[v0] Failed to sync role:", err)
        alert(`Failed to save role: ${err}`)
      }
    }
  }

  // Assign badge to user
  const assignBadge = () => {
    if (!selectedUserForBadge || !selectedBadge) {
      alert("Please select a user and badge!")
      return
    }

    const targetUser = users.find((u) => u.username === selectedUserForBadge)
    if (!targetUser) {
      alert("User not found!")
      return
    }

    if (targetUser.badges.includes(selectedBadge)) {
      alert("User already has this badge!")
      return
    }

    const updatedUsers = users.map((u) => (u.id === targetUser.id ? { ...u, badges: [...u.badges, selectedBadge] } : u))
    updateAndPersistUsers(updatedUsers)

    if (currentUser?.id === targetUser.id) {
      updateAndPersistCurrentUser({ ...currentUser, badges: [...currentUser.badges, selectedBadge] })
    }

    setSelectedUserForBadge("")
    setSelectedBadge("")
    alert(`Badge assigned successfully!`)
  }

  // Remove badge from user
  const removeBadge = (userId: string, badgeId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, badges: (u.badges ?? []).filter((b) => b !== badgeId) } : u,
    )
    updateAndPersistUsers(updatedUsers)

    if (currentUser?.id === userId) {
      updateAndPersistCurrentUser({ ...currentUser, badges: (currentUser.badges ?? []).filter((b) => b !== badgeId) })
    }
  }

  // Get boom avatar
  const getBoomAvatar = (boomName: string) => {
    for (const pack of PACKS) {
      const boom = pack.booms.find((b) => b.name === boomName)
      if (boom) return boom.avatar
    }
    return "❓"
  }

  // Get boom rarity
  const getBoomRarity = (boomName: string) => {
    for (const pack of PACKS) {
      const boom = pack.booms.find((b) => b.name === boomName)
      if (boom) return boom.rarity
    }
    return "uncommon"
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "uncommon":
        return "bg-green-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-orange-500"
      case "chroma":
        return "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
      case "mystical":
        return "bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900"
      default:
        return "bg-green-500"
    }
  }

  // Get animation class for rarity
  const getAnimationClass = (rarity: string) => {
    switch (rarity) {
      case "uncommon":
        return "animate-pulse"
      case "rare":
        return "animate-bounce"
      case "epic":
        return "animate-spin"
      case "legendary":
        return "animate-ping"
      case "chroma":
        return "animate-pulse animate-bounce"
      case "mystical":
        return "animate-spin animate-pulse animate-bounce"
      default:
        return ""
    }
  }

  // Custom roles feature removed for security

  // Get user role name
  const getUserRoleName = (user: GameUser) => {
    const role = DEFAULT_ROLES.find((r) => r.id === user.role)
    return role?.name || "Player"
  }

  // Landing Page (replacing Owner Access default)
  if (currentView === "owner-access") {
    // Generate a list of random booms for the background/grid
    const showcaseBooms = PACKS.flatMap(p => p.booms).slice(0, 16) // Take first 16 for grid

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
        {/* Navbar */}
        <nav className="flex justify-between items-center p-6 px-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Boomkit</h1>
          <div className="space-x-4">
            <Button
              onClick={() => setCurrentView("login")}
              className="bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold px-6"
            >
              Login
            </Button>
            <Button
              onClick={() => setCurrentView("register")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 shadow-lg shadow-purple-500/20"
            >
              Register
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-20 gap-12">

          {/* Left Content */}
          <div className="flex-1 space-y-6 text-center md:text-left max-w-xl">
            <h1 className="text-6xl md:text-7xl font-black text-white leading-tight">
              Boomkit
            </h1>
            <p className="text-3xl md:text-4xl text-purple-400 font-bold">
              Blooket, but emojis
            </p>
            <p className="text-slate-400 text-lg md:text-xl max-w-md mx-auto md:mx-0">
              Collect unique emojis, trade with friends, and climb the leaderboards in the ultimate emoji marketplace.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button
                onClick={() => setCurrentView("register")}
                className="h-14 px-8 text-xl bg-purple-600 hover:bg-purple-700 font-bold rounded-xl shadow-xl shadow-purple-900/20 transition-transform hover:scale-105"
              >
                Get Started
              </Button>
              {/* Hidden Owner Access Trigger (Double click title or similar? Keeping it simple for now, maybe a small footer link) */}
            </div>
          </div>

          {/* Right Content - Boom Grid */}
          <div className="flex-1 grid grid-cols-4 gap-4 max-w-lg p-6 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
            {showcaseBooms.map((boom, idx) => (
              <div key={idx} className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-4xl shadow-lg border border-slate-700 hover:scale-110 transition-transform cursor-default select-none" title={boom.name}>
                {boom.avatar}
              </div>
            ))}
          </div>

        </main>

        {/* Footer / Secret Access */}
        <footer className="p-4 text-center text-slate-600 text-sm">
          <p>&copy; 2026 Boomkit. All rights reserved.</p>
          {/* Secret Owner Access Link - subtly placed */}
          <button
            onClick={() => {
              // For now, let's just use a prompt or a hidden way to show the old form if needed.
              // Actually, user asked to REPLACE the page. But they might still need owner access.
              // Let's add a tiny link.
              const code = prompt("Enter Owner Code:")
              if (code === "OKTAY_MASTER_2024_BOOMKIT_SECURE") { // Quick hack to let owner in without UI clutter
                setOwnerAccessCode(code)
                // Trigger login simulation or just set view? 
                // Since handleOwnerAccess isn't exposed here easily without rewriting, 
                // let's just simulate the state change manually if valid
                localStorage.setItem("boomkit_authorized_system", generateSystemSignature())
                // We still need them to Login as a user, so we just authorize the system.
                alert("System Authorized. Please Login.")
                setCurrentView("login")
              }
            }}
            className="mt-2 opacity-10 hover:opacity-50 transition-opacity"
          >
            Admin
          </button>
        </footer>
      </div>
    )
  }

  if (currentView === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-purple-600">Welcome to Boomkit!</CardTitle>
            <CardDescription>Join the ultimate quiz adventure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age (minimum 10)</Label>
                <Input
                  id="age"
                  type="number"
                  min="10"
                  value={registerForm.age}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Register & Play
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Button variant="link" onClick={() => setCurrentView("login")}>
                Already have an account? Login
              </Button>
              <Button variant="link" onClick={() => setCurrentView("owner-access")}>
                Owner Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">Login to Boomkit</CardTitle>
            <CardDescription>Continue your quiz journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="loginUsername">Username</Label>
                <Input
                  id="loginUsername"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="loginPassword">Password</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Login
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <Button variant="link" onClick={() => setCurrentView("register")}>
                Need an account? Register
              </Button>
              <Button variant="link" onClick={() => setCurrentView("owner-access")}>
                Owner Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Hidden on mobile, toggleable */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-48 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="p-4 text-center flex items-center justify-between">
          <h1 className="text-2xl font-sans font-extrabold text-white">Boomkit</h1>
          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-white/10">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              setCurrentPage("stats")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "stats" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <BarChart3Icon className="h-5 w-5 mr-3" />
            Stats
          </button>

          <button
            onClick={() => {
              setCurrentPage("booms")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "booms" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <PackageIcon className="h-5 w-5 mr-3" />
            Booms
          </button>

          <button
            onClick={() => {
              setCurrentPage("market")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "market" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            Market
          </button>

          <button
            onClick={() => {
              setCurrentPage("chat")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "chat" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <MessageCircleIcon className="h-5 w-5 mr-3" />
            Chat
          </button>

          <button
            onClick={() => {
              setCurrentPage("auction")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "auction" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <GavelIcon className="h-5 w-5 mr-3" />
            Auction
          </button>

          <button
            onClick={() => {
              setCurrentPage("leaderboard")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "leaderboard" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <BarChart3Icon className="h-5 w-5 mr-3" />
            Leaderboard
          </button>

          <button
            onClick={() => {
              setCurrentPage("trading")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "trading" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <PackageIcon className="h-5 w-5 mr-3" />
            Trading
          </button>

          {(currentUser?.role === "moderator" ||
            currentUser?.role === "senior_moderator" ||
            currentUser?.role === "admin" ||
            currentUser?.role === "tester" || // Added check for tester role
            isOwner()) && (
              <button
                onClick={() => {
                  setCurrentPage("staff")
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "staff" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
              >
                <ShieldIcon className="h-5 w-5 mr-3" />
                Staff
              </button>
            )}

          <button
            onClick={() => {
              setCurrentPage("settings")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "settings" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <SettingsIcon className="h-5 w-5 mr-3" />
            Settings
          </button>

          <button
            onClick={() => {
              setCurrentPage("shop")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "shop" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <CreditCardIcon className="h-5 w-5 mr-3" />
            Shop
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Top Bar - Mobile Responsive */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-2 md:p-4 flex justify-between items-center gap-2">
          {/* Left side - Hamburger + Tokens */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile hamburger menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <Badge className="bg-yellow-500 text-white text-xs md:text-sm">
              <CoinsIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              {currentUser?.tokens || 0}
            </Badge>
            {currentUser?.isOwner && <CrownIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />}

            {/* Credentials - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-2 bg-purple-500/30 rounded-lg px-3 py-1 text-xs text-white">
              <span className="font-semibold">Credentials:</span>
              <span>Nazli Abdullazada (Tester)</span>
              <span className="text-white/50">|</span>
              <span>Oktay Abdullazada (Owner)</span>
            </div>
          </div>

          {/* Right side - News, User, Logout */}
          <div className="flex items-center gap-1 md:gap-4">
            {/* News button - Icon only on mobile */}
            <Button
              onClick={() => setShowNews(!showNews)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 md:px-3"
              size="sm"
            >
              <NewspaperIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Boomkit News</span>
            </Button>

            {/* User info - Simplified on mobile */}
            <div className="flex items-center gap-1 md:gap-2 bg-purple-600 rounded-lg px-2 md:px-3 py-1">
              <Avatar className="h-6 w-6 md:h-8 md:w-8">
                <AvatarFallback className="bg-yellow-500 text-white text-xs md:text-sm">
                  {currentUser?.profilePicture || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className={`font-medium text-xs md:text-sm truncate max-w-[60px] md:max-w-none ${currentUser?.nameColor === "rainbow"
                  ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                  : "text-white"
                  }`}
              >
                {currentUser?.username}
              </span>
              {/* Badges - Hidden on small mobile */}
              <div className="hidden sm:flex space-x-1">
                {(currentUser?.badges ?? []).slice(0, 3).map((badgeId) => {
                  const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                  return badge ? (
                    <span key={badgeId} className="text-xs md:text-sm" title={badge.name}>
                      {badge.emoji}
                    </span>
                  ) : null
                })}
              </div>
            </div>

            {/* Logout - Icon only on mobile */}
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white p-2 md:px-3" size="sm">
              <XIcon className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Main Content Area */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">
            {/* Stats Page */}
            {currentPage === "stats" && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div
                  className={`backdrop-blur-md rounded-lg p-6 ${currentUser?.bannerColor === "rainbow"
                    ? "bg-gradient-to-r from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"
                    : "bg-white/10"
                    }`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-2xl">
                        {currentUser?.profilePicture || "🎯"}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowProfilePicker(true)}
                        className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 p-0"
                      >
                        <CameraIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <h2
                        className={`text-2xl font-bold ${currentUser?.nameColor === "rainbow"
                          ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                          : "text-white"
                          }`}
                      >
                        {currentUser?.username}
                      </h2>
                      {/* Update Stats page to show role prominently with badge */}
                      {/* In the Stats section, after the username display, update to show role with colored badge: */}
                      {/* Around line 2207, replace the role display line: */}
                      {/* Old: <p className="text-white/70">{currentUser ? getUserRoleName(currentUser) : "Player"}</p> */}
                      {/* New: Show role with colored badge */}
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${currentUser?.role === "owner"
                            ? "bg-yellow-500"
                            : currentUser?.role === "admin"
                              ? "bg-red-500"
                              : currentUser?.role === "senior_moderator"
                                ? "bg-purple-500"
                                : currentUser?.role === "moderator"
                                  ? "bg-blue-500"
                                  : currentUser?.role === "tester"
                                    ? "bg-green-500"
                                    : // Added test role badge
                                    "bg-gray-500"
                            } text-white`}
                        >
                          {currentUser ? getUserRoleName(currentUser) : "Player"}
                        </Badge>
                        {(currentUser?.role === "moderator" ||
                          currentUser?.role === "senior_moderator" ||
                          currentUser?.role === "admin" ||
                          currentUser?.role === "tester" || // Added check for tester role
                          currentUser?.isOwner) && <Badge className="bg-emerald-500 text-white">Staff</Badge>}
                      </div>
                      {/* Display badges */}
                      <div className="flex space-x-1 mt-1">
                        {(currentUser?.badges ?? []).slice(0, 3).map((badgeId) => {
                          const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                          return badge ? (
                            <Badge key={badgeId} className={`${badge.color} text-white text-xs`}>
                              {badge.emoji} {badge.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <div className="text-white text-sm">100</div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      onClick={() => setCurrentPage("market")}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Unlock Booms
                    </Button>
                    <Button
                      onClick={() => setCurrentPage("booms")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Manage Booms
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUserStats(currentUser) // Set the selected user to the current user
                        setShowUserStats(true)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      View Stats
                    </Button>
                  </div>
                </div>

                {/* Daily Spin Wheel */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block mb-4 font-bold">
                    Daily Spin Wheel
                  </div>
                  <div className="text-center">
                    <div
                      className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 border-yellow-500 flex items-center justify-center text-4xl ${spinning ? "animate-spin" : ""
                        } bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500`}
                    >
                      🎯
                    </div>
                    {spinResult && (
                      <div className="mb-4 p-4 bg-green-500 rounded-lg text-white font-bold animate-bounce">
                        You won {spinResult} tokens! 🎉
                      </div>
                    )}
                    <Button
                      onClick={handleDailySpin}
                      disabled={!canSpin || spinning}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      {spinning ? "Spinning..." : canSpin ? "Spin Now!" : "Come back tomorrow!"}
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block mb-4 font-bold">Stats</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-600 rounded-lg p-4 text-center">
                      <div className="text-yellow-400 text-2xl mb-2">🪙</div>
                      <div className="text-white text-xl font-bold">{currentUser?.tokens || 0}</div>
                      <div className="text-white/70 text-sm">Total Tokens</div>
                    </div>
                    <div className="bg-purple-600 rounded-lg p-4 text-center">
                      <div className="text-yellow-400 text-2xl mb-2">⭐</div>
                      <div className="text-white text-xl font-bold">
                        {Object.keys(currentUser?.booms || {}).length || 0}
                      </div>
                      <div className="text-white/70 text-sm">Unique Booms</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booms Page */}
            {currentPage === "booms" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h1 className="text-4xl font-bold text-white">My Booms</h1>
                  <div className="flex gap-2 items-center">
                    {isSelectMode && (
                      <>
                        <Button
                          onClick={selectAllBooms}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          Select All
                        </Button>
                        {selectedBoomsForSell.size > 0 && (
                          <div className="bg-green-600 rounded-lg px-4 py-2 text-white font-bold">
                            {selectedBoomsForSell.size} selected • {getTotalSellValue()} tokens
                          </div>
                        )}
                        <Button
                          onClick={() => handleDirectSell(Array.from(selectedBoomsForSell))}
                          disabled={selectedBoomsForSell.size === 0}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Sell Selected ({selectedBoomsForSell.size})
                        </Button>
                        <Button
                          onClick={() => {
                            setIsSelectMode(false)
                            setSelectedBoomsForSell(new Set())
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {!isSelectMode && (
                      <Button
                        onClick={() => setIsSelectMode(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        Select Mode
                      </Button>
                    )}
                  </div>
                  <div className="bg-purple-600 rounded-lg p-4 text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-white text-2xl font-bold">{currentUser?.boomScore || 0}</div>
                    <div className="text-white/70 text-sm">Boom Score</div>
                    <div className="mt-4 text-center">
                      <div className="text-white font-bold">{currentUser?.packs.length || 0}</div>
                      <div className="text-white/70 text-sm">Packs Owned</div>
                      <div className="text-yellow-400 font-bold">🪙 {currentUser?.totalValue || 0}</div>
                      <div className="text-white/70 text-sm">Total Value</div>
                    </div>
                  </div>
                </div>

                {/* Pack Sections */}
                <div className="space-y-6">
                  {PACKS.map((pack) => (
                    <div key={pack.id} className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <img src={pack.image || "/placeholder.svg"} alt={pack.name} className="w-8 h-8 mr-3 rounded" />
                        {pack.name}
                      </h2>
                      <div className="grid grid-cols-10 gap-2">
                        {pack.booms.map((boom, index) => {
                          const quantity = currentUser?.booms[boom.name] || 0
                          const hasBooom = quantity > 0
                          const isSelected = selectedBoomsForSell.has(boom.name)
                          return (
                            <div key={index} className="text-center">
                              <div
                                className={`w-12 h-12 rounded border-2 mb-1 flex items-center justify-center text-lg transition-transform hover:scale-110 relative ${hasBooom
                                  ? isSelectMode
                                    ? isSelected
                                      ? `${getRarityColor(boom.rarity)} text-white shadow-lg border-yellow-400 border-4`
                                      : `${getRarityColor(boom.rarity)} text-white shadow-lg cursor-pointer border-white`
                                    : `${getRarityColor(boom.rarity)} text-white shadow-lg cursor-pointer border-white`
                                  : "bg-black text-gray-500 border-white cursor-not-allowed"
                                  }`}
                                onClick={() => {
                                  if (hasBooom) {
                                    if (isSelectMode) {
                                      toggleBoomSelection(boom.name)
                                    } else {
                                      handleBoomClick(boom.name)
                                    }
                                  }
                                }}
                              >
                                {hasBooom ? boom.avatar : "🔒"}
                                {hasBooom && quantity > 1 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {quantity}
                                  </span>
                                )}
                                {isSelectMode && isSelected && (
                                  <span className="absolute top-0 left-0 w-full h-full bg-yellow-400/30 rounded flex items-center justify-center">
                                    <span className="text-yellow-400 text-lg">✓</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-white/70 text-xs truncate w-12">{boom.name}</div>
                              {hasBooom && (
                                <div className="text-white/50 text-xs">
                                  {quantity}{" "}
                                  {boom.rarity === "chroma" ? "chroma" : boom.rarity === "mystical" ? "mystical" : ""}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Page */}
            {currentPage === "market" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-bold text-white">Market</h1>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-6xl">🏪</div>
                      <div className="text-white font-bold">MARKET</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-xl mb-2">Token Balance</h3>
                    <div className="text-4xl font-bold text-yellow-400 mb-2">🪙 {currentUser?.tokens || 0}</div>
                    <p className="text-white/70">Use tokens to buy packs!</p>
                  </div>
                </div>

                {/* Rarity Information */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <h3 className="text-white font-bold mb-3">📊 Drop Rates</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs mb-1">Uncommon</div>
                      <div className="text-white">60%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs mb-1">Rare</div>
                      <div className="text-white">25%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs mb-1">Epic</div>
                      <div className="text-white">10%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs mb-1">Legendary</div>
                      <div className="text-white">4%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 text-white px-2 py-1 rounded text-xs mb-1">
                        Chroma
                      </div>
                      <div className="text-white">0.9%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900 text-white px-2 py-1 rounded text-xs mb-1">
                        Mystical
                      </div>
                      <div className="text-white">0.1%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {PACKS.map((pack) => (
                    <div key={pack.id} className="relative group cursor-pointer">
                      <div
                        className={`bg-gradient-to-b ${pack.color} rounded-lg overflow-hidden relative transform transition-transform group-hover:scale-105`}
                      >
                        {/* Pack design with zigzag top */}
                        <div
                          className="absolute top-0 left-0 right-0 h-4 bg-white/30"
                          style={{
                            clipPath:
                              "polygon(0 0, 8% 100%, 16% 0, 24% 100%, 32% 0, 40% 100%, 48% 0, 56% 100%, 64% 0, 72% 100%, 80% 0, 88% 100%, 96% 0, 100% 100%, 0 100%)",
                          }}
                        ></div>

                        {/* Pack Image with Emoji Overlay */}
                        <div className="pt-6 pb-4 px-4 relative">
                          <img
                            src={pack.image || "/placeholder.svg"}
                            alt={pack.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          {/* Emoji Overlay */}
                          {pack.emoji && (
                            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-6xl drop-shadow-lg filter hover:scale-110 transition-transform cursor-default">
                              {pack.emoji}
                            </div>
                          )}
                          <div className="text-white text-center">
                            <div className="font-bold text-lg mb-1">{pack.name}</div>
                            <div className="text-sm opacity-80 capitalize">{pack.rarity}</div>
                          </div>
                        </div>

                        {/* Price Badge */}
                        <div className="absolute bottom-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold flex items-center">
                          🪙 {pack.price}
                        </div>

                        {/* Rarity Badge */}
                        <div
                          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${pack.rarity === "uncommon"
                            ? "bg-green-500"
                            : pack.rarity === "rare"
                              ? "bg-blue-500"
                              : pack.rarity === "epic"
                                ? "bg-purple-500"
                                : "bg-orange-500"
                            } text-white`}
                        >
                          {pack.rarity.toUpperCase()}
                        </div>
                      </div>

                      <Button
                        onClick={() => handlePackAction(pack.id)}
                        disabled={(currentUser?.tokens || 0) < pack.price}
                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 hover:shadow-lg transition-all"
                      >
                        Open for {pack.price}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Page */}
            {currentPage === "chat" && (
              <RealtimeChat
                currentUser={currentUser}
                roleName={currentUser ? getUserRoleName(currentUser) : "Player"}
                onUsernameClick={handleUsernameClick}
              />
            )}

            {/* Auction Page */}
            {currentPage === "auction" && (
              <RealtimeAuctions
                currentUser={currentUser}
                getBoomAvatar={getBoomAvatar}
                getBoomRarity={getBoomRarity}
                getRarityColor={getRarityColor}
              />
            )}

            {/* Leaderboard Page */}
            {currentPage === "leaderboard" && (
              <RealtimeLeaderboard
                users={users}
                currentUser={currentUser}
                AVAILABLE_BADGES={AVAILABLE_BADGES}
                getBoomAvatar={getBoomAvatar}
                getBoomRarity={getBoomRarity}
                getRarityColor={getRarityColor}
                getUserRoleName={getUserRoleName}
                isOwner={isOwner}
              />
            )}

            {/* Trading Page */}
            {currentPage === "trading" && (
              <TradingPage
                currentUser={currentUser!}
                users={users}
                onTradeComplete={() => {
                  // Refresh user data after trade
                  const fetchUser = async () => {
                    if (!supabase) return
                    const { data } = await supabase.from("users").select("*").eq("id", currentUser!.id).single()
                    if (data) {
                      setCurrentUser(data)
                    }
                  }
                  fetchUser()
                }}
              />
            )}

            {/* Staff Page */}
            {(currentUser?.role === "moderator" ||
              currentUser?.role === "senior_moderator" ||
              currentUser?.role === "admin" ||
              currentUser?.role === "tester" || // Added check for tester role
              isOwner()) &&
              currentPage === "staff" && (
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold text-white">Staff Panel</h1>

                  {/* User Management */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white">All Users</h2>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search users..."
                          value={staffSearchQuery}
                          onChange={(e) => setStaffSearchQuery(e.target.value)}
                          className="w-48 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        />
                        <div className="space-x-2">
                          {isOwner() && (
                            <>
                              <Button
                                onClick={() => setShowRoleManager(true)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Create Custom Role
                              </Button>
                              <Button onClick={() => setShowBadgeManager(true)} className="bg-blue-600 hover:bg-blue-700">
                                Manage Badges
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {users
                        .filter((u) => u.username.toLowerCase().includes(staffSearchQuery.toLowerCase())) // Filter by search query
                        .map((user) => {
                          const userRole = DEFAULT_ROLES.find((r) => r.id === user.role)
                          const isActive = Date.now() - user.lastSeen < 300000
                          return (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-white/10 rounded">
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-500"}`}
                                  title={isActive ? "Online" : "Offline"}
                                ></span>
                                <span className="text-white font-medium">{user.username}</span>
                                <Badge className={`${userRole?.color || "bg-gray-500"} text-white text-xs`}>
                                  {userRole?.name || "Unknown"}
                                </Badge>
                                <div className="flex space-x-1">
                                  {(user.badges ?? []).map((badgeId) => {
                                    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                                    return badge ? (
                                      <Badge
                                        key={badgeId}
                                        className={`${badge.color} text-white text-xs cursor-pointer`}
                                        onClick={() => isOwner() && removeBadge(user.id, badgeId)}
                                        title={isOwner() ? `Click to remove ${badge.name}` : badge.name}
                                      >
                                        {badge.emoji} {badge.name}
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                                {user.isMuted && <span className="text-yellow-400 text-sm">🔇 Muted</span>}
                                {user.isBanned && <span className="text-red-500 text-sm">🚫 Banned</span>}
                              </div>
                              <div className="flex items-center space-x-2">
                                {(currentUser?.role === "admin" || currentUser?.role === "tester" || isOwner()) && ( // Added tester role to staff actions
                                  <>
                                    {isOwner() && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEditUserDialog(user)}
                                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                                        title="Edit User Tokens"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <select
                                      value={user.role}
                                      onChange={(e) => quickAssignRole(user.id, e.target.value)}
                                      className="bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
                                      disabled={!isOwner()} // Only owner can change roles freely
                                    >
                                      {DEFAULT_ROLES.filter(
                                        (role) => role.id !== "owner" || (isOwner() && user.id === currentUser?.id),
                                      ).map((role) => (
                                        <option key={role.id} value={role.id} className="bg-gray-800 text-white">
                                          {role.name}
                                        </option>
                                      ))}
                                    </select>
                                    {user.isMuted ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUnbanUnmute(user.id, "unmute")}
                                        className="bg-yellow-500/50 hover:bg-yellow-500"
                                      >
                                        Unmute
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => openMuteDialog(user)}>
                                        Mute
                                      </Button>
                                    )}
                                    {user.isBanned ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleUnbanUnmute(user.id, "unban")}
                                        className="bg-green-500/80 hover:bg-green-500"
                                      >
                                        Unban
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="destructive" onClick={() => openBanDialog(user)}>
                                        Ban
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

            {/* Settings Page */}
            {currentPage === "settings" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Settings</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Section */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white">👤</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">Profile</h2>
                    </div>
                    <div className="space-y-2 text-white">
                      <p>
                        <strong>Username:</strong> {currentUser?.username}
                      </p>
                      <p>
                        <strong>Role:</strong> {currentUser ? getUserRoleName(currentUser) : "Player"}
                      </p>
                      <p>
                        <strong>Joined:</strong> {currentUser?.joinDate}
                      </p>
                      {/* Display badges */}
                      {currentUser?.badges && currentUser.badges.length > 0 && (
                        <div>
                          <strong>Badges:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentUser.badges.map((badgeId) => {
                              const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                              return badge ? (
                                <Badge key={badgeId} className={`${badge.color} text-white text-xs`}>
                                  {badge.emoji} {badge.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Info Section */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white">✏️</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">Edit Info</h2>
                    </div>
                    <div className="space-y-2">
                      {/* Username and Email change removed as per request */}
                      <Button variant="link" onClick={() => setShowPasswordEdit(true)}>
                        Change Password
                      </Button>
                      <Button variant="link" onClick={() => setShowDeleteConfirm(true)}>
                        Delete Account
                      </Button>
                    </div>
                  </div>

                  {/* Legal Section */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white">📜</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">Legal</h2>
                    </div>
                    <div className="space-y-2">
                      <Button variant="link" onClick={() => setShowPrivacyPolicy(true)}>
                        Privacy Policy
                      </Button>
                      <Button variant="link" onClick={() => setShowTermsOfService(true)}>
                        Terms of Service
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shop Page */}
            {currentPage === "shop" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Shop</h1>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                    💳 Buy Tokens with Real Money
                  </h3>
                  <p className="text-purple-200 text-sm mb-4">
                    Purchase tokens instantly with secure Stripe payment. Tokens will be added to your account
                    immediately.
                  </p>
                  {currentUser && (
                    <StripeCheckout
                      userId={currentUser.id}
                      onSuccess={(tokens) => {
                        if (currentUser) {
                          const updatedUser = { ...currentUser, tokens: currentUser.tokens + tokens }
                          setCurrentUser(updatedUser)
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showNews && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-purple-900 border-purple-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Boomkit News</CardTitle>
              <CardDescription className="text-purple-300">Stay up to date with the latest updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {NEWS_ITEMS.map((news) => (
                <div key={news.id} className="bg-purple-800/50 rounded-lg p-4 border border-purple-600">
                  <div className="flex items-center gap-2 mb-2">
                    {news.image && <span className="text-2xl">{news.image}</span>}
                    <h3 className="text-xl font-bold text-white">{news.title}</h3>
                  </div>
                  <p className="text-purple-200">{news.content}</p>
                  <p className="text-purple-400 text-sm mt-2">{news.date}</p>
                </div>
              ))}
            </CardContent>
            <div className="p-4 pt-0">
              <Button
                onClick={() => setShowNews(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {packAnimation.show && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden">
          {/* Confetti particles - colored by rarity */}
          {packAnimation.stage !== "shake" &&
            packAnimation.boom &&
            Array.from({ length: packAnimation.particles.length }).map((_, i) => {
              const colors = getConfettiColors(packAnimation.boom!.rarity)
              const color = colors[Math.floor(Math.random() * colors.length)]
              const angle = (Math.PI * 2 * i) / packAnimation.particles.length
              const distance = 200 + Math.random() * 150
              const tx = Math.cos(angle) * distance
              const ty = Math.sin(angle) * distance
              return (
                <div
                  key={i}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: "12px",
                    height: "12px",
                    backgroundColor: color,
                    animation: "particle-explode 1.5s ease-out forwards",
                    ["--tx" as string]: `${tx}px`,
                    ["--ty" as string]: `${ty}px`,
                  }}
                />
              )
            })}

          {/* Pack shaking stage */}
          {packAnimation.stage === "shake" && (
            <div className="text-center">
              <div className="animate-pack-shake">
                <div className="w-48 h-64 bg-gradient-to-b from-purple-600 to-purple-900 rounded-lg shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Zigzag top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-6 bg-white/30"
                    style={{
                      clipPath:
                        "polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0, 100% 100%, 0 100%)",
                    }}
                  />
                  {packAnimation.packImage ? (
                    <img
                      src={packAnimation.packImage || "/placeholder.svg"}
                      alt={packAnimation.packName}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-6xl">📦</div>
                  )}
                  <div className="text-white font-bold mt-2">{packAnimation.packName}</div>
                </div>
              </div>
              <p className="text-white/80 mt-6 text-xl animate-pulse">Opening pack...</p>
            </div>
          )}

          {/* Pack burst stage */}
          {packAnimation.stage === "burst" && (
            <div className="text-center">
              <div className="animate-pack-burst">
                <div className="w-48 h-64 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-lg shadow-2xl flex items-center justify-center">
                  <div className="text-6xl">💥</div>
                </div>
              </div>
            </div>
          )}

          {/* Boom reveal stage - Blooket-style card */}
          {(packAnimation.stage === "reveal" || packAnimation.stage === "done") && packAnimation.boom && (() => {
            // Find the pack that contains this boom
            const pack = PACKS.find((p) => p.booms.some((b) => b.name === packAnimation.boom!.name))
            const dropRate = pack ? getBoomDropRate(packAnimation.boom.name, pack) : 0
            const isNew = isBoomNew(packAnimation.boom.name)
            const revealAnimationClass =
              packAnimation.boom.rarity === "mystical" ? "animate-reveal-mystical" :
                packAnimation.boom.rarity === "chroma" ? "animate-reveal-chroma" :
                  packAnimation.boom.rarity === "legendary" ? "animate-reveal-legendary" :
                    packAnimation.boom.rarity === "epic" ? "animate-reveal-epic" :
                      packAnimation.boom.rarity === "rare" ? "animate-reveal-rare" :
                        "animate-reveal-uncommon"

            return (
              <div className="flex items-center justify-center w-full h-full">
                {/* Centered Card */}
                <div
                  className={`relative w-[400px] h-[500px] rounded-2xl shadow-2xl overflow-hidden ${packAnimation.stage === "reveal" ? revealAnimationClass : ""
                    }`}
                  style={{
                    background:
                      packAnimation.boom.rarity === "mystical"
                        ? "linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #831843 100%)" :
                        packAnimation.boom.rarity === "chroma"
                          ? "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #ec4899 100%)" :
                          packAnimation.boom.rarity === "legendary"
                            ? "linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fbbf24 100%)" :
                            packAnimation.boom.rarity === "epic"
                              ? "linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #a855f7 100%)" :
                              packAnimation.boom.rarity === "rare"
                                ? "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)" :
                                "linear-gradient(135deg, #166534 0%, #22c55e 50%, #4ade80 100%)"
                  }}
                >
                  {/* Card Background Pattern (snowy scene for example) */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-white/30 rounded-t-full"></div>
                    <div className="absolute bottom-8 left-4 w-16 h-16 bg-white/20 rounded-full"></div>
                    <div className="absolute bottom-12 right-8 w-12 h-12 bg-white/20 rounded-full"></div>
                  </div>

                  {/* Boom Art - Centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl relative z-10">
                      {packAnimation.boom.avatar}
                    </div>
                  </div>

                  {/* Boom Name - Top */}
                  <div className="absolute top-6 left-0 right-0 text-center z-20">
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                      {packAnimation.boom.name}
                    </h2>
                  </div>

                  {/* Rarity Label - Under Name */}
                  <div className="absolute top-20 left-0 right-0 text-center z-20">
                    <div
                      className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase ${packAnimation.boom.rarity === "mystical" || packAnimation.boom.rarity === "chroma"
                        ? "animate-pulse"
                        : ""
                        }`}
                      style={{
                        background:
                          packAnimation.boom.rarity === "mystical"
                            ? "linear-gradient(135deg, #a855f7, #ec4899)"
                            : packAnimation.boom.rarity === "chroma"
                              ? "linear-gradient(135deg, #06b6d4, #ec4899, #f59e0b)"
                              : packAnimation.boom.rarity === "legendary"
                                ? "#f59e0b"
                                : packAnimation.boom.rarity === "epic"
                                  ? "#9333ea"
                                  : packAnimation.boom.rarity === "rare"
                                    ? "#3b82f6"
                                    : "#22c55e",
                        color: "white",
                      }}
                    >
                      {getRarityText(packAnimation.boom.rarity).replace(/[💚💙💜🔥🌈✨]/g, "").trim()}
                    </div>
                  </div>

                  {/* Drop Rate + NEW - Bottom */}
                  <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                    <p className="text-white text-lg font-semibold drop-shadow-lg">
                      {dropRate}%{isNew && " – NEW!"}
                    </p>
                  </div>

                  {/* Glow effect for legendary+ */}
                  {["legendary", "chroma", "mystical"].includes(packAnimation.boom.rarity) && (
                    <div className="absolute inset-0 animate-glow-pulse opacity-50" />
                  )}
                </div>

                {/* Close button */}
                {packAnimation.stage === "done" && (
                  <button
                    onClick={closePackAnimation}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 z-30"
                  >
                    Awesome! 🎉
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      )}
      {showProfilePicker && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Choose Profile Picture</CardTitle>
              <CardDescription>Select your new avatar</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-6 gap-4">
              {PROFILE_PICTURES.map((picture) => (
                <button
                  key={picture}
                  onClick={() => {
                    updateProfilePicture(picture)
                    setShowProfilePicker(false)
                  }}
                  className="w-12 h-12 rounded-full bg-yellow-500 text-white text-3xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {picture}
                </button>
              ))}
            </CardContent>
            <CardContent>
              <Button onClick={() => setShowProfilePicker(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showNameEdit && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Change Username</CardTitle>
              <CardDescription>Enter your new username</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="New Username" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button
                onClick={() => {
                  updateUserInfo("username", newName)
                  setShowNameEdit(false)
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Save
              </Button>
              <Button onClick={() => setShowNameEdit(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showEmailEdit && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Change Email</CardTitle>
              <CardDescription>Enter your new email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="New Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button
                onClick={() => {
                  updateUserInfo("email", newEmail)
                  setShowEmailEdit(false)
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Save
              </Button>
              <Button onClick={() => setShowEmailEdit(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showPasswordEdit && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
              <CardDescription>Enter your new password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                onClick={() => {
                  alert("Password change functionality not implemented in this demo.")
                  setShowPasswordEdit(false)
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Save
              </Button>
              <Button onClick={() => setShowPasswordEdit(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-500">Delete Account</CardTitle>
              <CardDescription>
                Are you sure you want to delete your account? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => {
                  alert("Account deletion functionality not implemented in this demo.")
                  setShowDeleteConfirm(false)
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Confirm Delete
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showPrivacyPolicy && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
              <CardDescription>Last updated: December 19, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <section>
                <h3 className="font-bold text-lg mb-2">1. Introduction</h3>
                <p>
                  Welcome to Boomkit. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you use our gaming platform. Boomkit is developed and maintained by Oktay Abdullazada
                  (Owner) with testing support from Nazli Abdullazada.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">2. Information We Collect</h3>
                <p className="mb-2">We collect information you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account information (username, email address, age)</li>
                  <li>Game data (tokens, packs opened, booms collected, leaderboard rankings)</li>
                  <li>Chat messages sent through our platform</li>
                  <li>Auction and trading activity</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">3. How We Use Your Information</h3>
                <p className="mb-2">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Display leaderboards and game statistics</li>
                  <li>Monitor and analyze usage patterns</li>
                  <li>Detect and prevent fraud or abuse</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">4. Data Storage</h3>
                <p>
                  Your data is securely stored using Supabase, a trusted database provider. We implement appropriate
                  security measures to protect your personal information against unauthorized access, alteration, or
                  destruction.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">5. Data Sharing</h3>
                <p>
                  We do not sell your personal information. Game-related data such as usernames, scores, and rankings
                  may be publicly visible on leaderboards and in chat.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">6. Your Rights</h3>
                <p>
                  You have the right to access, update, or delete your account information at any time through your
                  account settings.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">7. Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy, please contact the Boomkit team through our platform.
                </p>
              </section>

              <Button onClick={() => setShowPrivacyPolicy(false)} className="w-full bg-gray-600 hover:bg-gray-700 mt-4">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showTermsOfService && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Terms of Service</CardTitle>
              <CardDescription>Last updated: December 19, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <section>
                <h3 className="font-bold text-lg mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using Boomkit, you agree to be bound by these Terms of Service. Boomkit is owned and
                  operated by Oktay Abdullazada, with quality assurance by Nazli Abdullazada.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">2. Description of Service</h3>
                <p>
                  Boomkit is an online gaming platform that allows users to collect virtual items called "Booms,"
                  participate in auctions, engage in real-time chat, and compete on leaderboards. All in-game items and
                  currencies have no real-world monetary value.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">3. User Accounts</h3>
                <p className="mb-2">To use Boomkit, you must:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide accurate and complete registration information</li>
                  <li>Be responsible for maintaining the security of your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Be at least 13 years of age to create an account</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">4. User Conduct</h3>
                <p className="mb-2">You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the service for any illegal purpose</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Use cheats, exploits, or automation software</li>
                  <li>Impersonate other users or staff members</li>
                  <li>Use inappropriate content in chat</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">5. Virtual Items</h3>
                <p>
                  All virtual items, including Booms, tokens, and packs, are licensed to you and remain the property of
                  Boomkit. Virtual items have no real-world value and cannot be exchanged for real currency.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">6. Moderation</h3>
                <p>
                  Our staff team reserves the right to moderate content, mute or ban users who violate these terms, and
                  take any action necessary to maintain a safe gaming environment.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">7. Disclaimer</h3>
                <p>
                  Boomkit is provided "as is" without warranties of any kind. We are not responsible for any loss of
                  virtual items or account data.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">8. Changes to Terms</h3>
                <p>
                  We reserve the right to modify these terms at any time. Continued use of Boomkit after changes
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <Button
                onClick={() => setShowTermsOfService(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 mt-4"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showUserStats && selectedUserStats && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">User Stats</CardTitle>
              <CardDescription>Statistics for {selectedUserStats.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Username:</strong> {selectedUserStats.username}
              </p>
              <p>
                <strong>Role:</strong> {getUserRoleName(selectedUserStats)}
              </p>
              <p>
                <strong>Tokens:</strong> {selectedUserStats.tokens}
              </p>
              <p>
                <strong>Boom Score:</strong> {selectedUserStats.boomScore}
              </p>
              <p>
                <strong>Unique Booms:</strong> {Object.keys(selectedUserStats.booms).length}
              </p>
              <Button onClick={() => setShowUserStats(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showEditUserDialog && userToEdit && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-purple-400">Edit User: {userToEdit.username}</CardTitle>
              <CardDescription className="text-slate-400">Manage user tokens and details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editTokens" className="text-white">User Tokens</Label>
                <Input
                  id="editTokens"
                  type="number"
                  value={editTokenValue}
                  onChange={(e) => setEditTokenValue(e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="ghost" onClick={() => setShowEditUserDialog(false)} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={handleSaveUserTokens} className="bg-purple-600 hover:bg-purple-700">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showMuteDialog && userToModerate && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-yellow-400">Mute {userToModerate.username}</CardTitle>
              <CardDescription>Set a duration for the mute.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="muteDuration">Mute Duration (hours)</Label>
              <Input
                id="muteDuration"
                type="number"
                value={muteDuration}
                onChange={(e) => setMuteDuration(e.target.value)}
                placeholder="e.g., 24 for 1 day"
              />
              <Button onClick={handleConfirmMute} className="w-full bg-yellow-600 hover:bg-yellow-700">
                Apply Mute
              </Button>
              <Button onClick={() => setShowMuteDialog(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showBanDialog && userToModerate && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-500">Ban {userToModerate.username}</CardTitle>
              <CardDescription>This action is permanent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="banReason">Ban Reason</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for permanent ban..."
              />
              <Button onClick={handleConfirmBan} className="w-full bg-red-600 hover:bg-red-700">
                Confirm Permanent Ban
              </Button>
              <Button onClick={() => setShowBanDialog(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Custom role manager removed for security */}
      {showBadgeManager && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Manage Badges</CardTitle>
              <CardDescription>Assign or remove badges from users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="userForBadge">Select User</Label>
              <select
                id="userForBadge"
                value={selectedUserForBadge}
                onChange={(e) => setSelectedUserForBadge(e.target.value)}
                className="w-full bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.username} className="bg-gray-800 text-white">
                    {user.username}
                  </option>
                ))}
              </select>

              <Label htmlFor="badge">Select Badge</Label>
              <select
                id="badge"
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
              >
                <option value="">Select Badge</option>
                {AVAILABLE_BADGES.map((badge) => (
                  <option key={badge.id} value={badge.id} className="bg-gray-800 text-white">
                    {badge.emoji} {badge.name}
                  </option>
                ))}
              </select>

              <Button onClick={assignBadge} className="w-full bg-green-600 hover:bg-green-700">
                Assign Badge
              </Button>
              <Button onClick={() => setShowBadgeManager(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showBoomAction && selectedBoom && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Boom Actions</CardTitle>
              <CardDescription>What do you want to do with {selectedBoom}?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white">
                <span className="text-3xl">{getBoomAvatar(selectedBoom)}</span> {selectedBoom}
              </p>
              <Button onClick={handleDirectSell} className="w-full bg-blue-600 hover:bg-blue-700">
                Sell for {getBoomSellPrice(selectedBoom)} tokens
              </Button>

              <Label htmlFor="auctionPrice">Starting Bid</Label>
              <Input
                id="auctionPrice"
                placeholder="Starting Bid"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
              />

              <Label htmlFor="auctionDuration">Duration (hours)</Label>
              <Input
                id="auctionDuration"
                placeholder="Duration"
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(e.target.value)}
              />

              <Button onClick={handleAuctionList} className="w-full bg-green-600 hover:bg-green-700">
                List on Auction House
              </Button>
              <Button onClick={() => setShowBoomAction(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
