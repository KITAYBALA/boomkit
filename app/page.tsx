"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  SendIcon,
  GavelIcon,
  NewspaperIcon,
  CameraIcon,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

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
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

interface BoomItem {
  name: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical"
  avatar: string
  description: string
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

interface CustomRole {
  id: string
  name: string
  color: string
  assignedBy: string
  assignedDate: string
}

const DEFAULT_ROLES: UserRole[] = [
  {
    id: "player",
    name: "Player",
    color: "bg-gray-500",
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
      { name: "Ladybug", rarity: "common", avatar: "🐞", description: "A cute spotted beetle" },
      { name: "Butterfly", rarity: "uncommon", avatar: "🦋", description: "Graceful winged beauty" },
      { name: "Bee", rarity: "rare", avatar: "🐝", description: "Busy honey maker" },
      { name: "Spider", rarity: "epic", avatar: "🕷️", description: "Eight-legged web weaver" },
      { name: "Golden Beetle", rarity: "legendary", avatar: "✨🪲", description: "Rare golden insect" },
      { name: "Rainbow Dragonfly", rarity: "chroma", avatar: "🌈🪰", description: "Mystical rainbow wings" },
      { name: "Cosmic Mantis", rarity: "mystical", avatar: "🌌🦗", description: "Interdimensional predator" },
    ],
    color: "from-green-600 to-green-800",
    image: "/images/bug-pack.png",
    rarity: "common",
  },
  {
    id: "pirate",
    name: "Pirate Pack",
    price: 25,
    booms: [
      { name: "Captain", rarity: "common", avatar: "🏴‍☠️", description: "Fearless ship captain" },
      { name: "Parrot", rarity: "uncommon", avatar: "🦜", description: "Colorful talking bird" },
      { name: "Treasure Chest", rarity: "rare", avatar: "💰", description: "Full of gold coins" },
      { name: "Ghost Ship", rarity: "epic", avatar: "👻⛵", description: "Haunted vessel" },
      { name: "Kraken", rarity: "legendary", avatar: "🐙", description: "Legendary sea monster" },
      { name: "Golden Compass", rarity: "chroma", avatar: "🌟🧭", description: "Magical navigation tool" },
      { name: "Davy Jones", rarity: "mystical", avatar: "💀⚓", description: "Ruler of the seven seas" },
    ],
    color: "from-blue-600 to-blue-800",
    image: "/images/pirate-pack.png",
    rarity: "common",
  },
  {
    id: "space",
    name: "Space Pack",
    price: 30,
    booms: [
      { name: "Rocket", rarity: "common", avatar: "🚀", description: "Fast space vehicle" },
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
  },
  {
    id: "medieval",
    name: "Medieval Pack",
    price: 35,
    booms: [
      { name: "Knight", rarity: "common", avatar: "⚔️", description: "Brave armored warrior" },
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
  },
  {
    id: "safari",
    name: "Safari Pack",
    price: 30,
    booms: [
      { name: "Lion", rarity: "common", avatar: "🦁", description: "King of the jungle" },
      { name: "Elephant", rarity: "uncommon", avatar: "🐘", description: "Gentle giant" },
      { name: "Giraffe", rarity: "rare", avatar: "🦒", description: "Tallest animal" },
      { name: "Rhino", rarity: "epic", avatar: "🦏", description: "Armored powerhouse" },
      { name: "White Tiger", rarity: "legendary", avatar: "🐅✨", description: "Rare striped hunter" },
      { name: "Golden Leopard", rarity: "chroma", avatar: "🌟🐆", description: "Mystical spotted cat" },
      { name: "Spirit Lion", rarity: "mystical", avatar: "👻🦁", description: "Guardian of the savanna" },
    ],
    color: "from-orange-600 to-orange-800",
    image: "/images/safari-pack.png",
    rarity: "common",
  },
  {
    id: "aquatic",
    name: "Aquatic Pack",
    price: 28,
    booms: [
      { name: "Shark", rarity: "common", avatar: "🦈", description: "Ocean predator" },
      { name: "Dolphin", rarity: "uncommon", avatar: "🐬", description: "Intelligent sea mammal" },
      { name: "Octopus", rarity: "rare", avatar: "🐙", description: "Eight-armed wonder" },
      { name: "Whale", rarity: "epic", avatar: "🐋", description: "Gentle ocean giant" },
      { name: "Mermaid", rarity: "legendary", avatar: "🧜‍♀️", description: "Mythical sea being" },
      { name: "Poseidon's Trident", rarity: "chroma", avatar: "🌊🔱", description: "God of the sea's weapon" },
      { name: "Leviathan", rarity: "mystical", avatar: "🌊🐉", description: "Ancient sea serpent" },
    ],
    color: "from-cyan-600 to-cyan-800",
    image: "/images/aquatic-pack.png",
    rarity: "common",
  },
  {
    id: "breakfast",
    name: "Breakfast Pack",
    price: 20,
    booms: [
      { name: "Pancakes", rarity: "common", avatar: "🥞", description: "Fluffy morning treat" },
      { name: "Bacon", rarity: "uncommon", avatar: "🥓", description: "Crispy strips" },
      { name: "Waffle", rarity: "rare", avatar: "🧇", description: "Golden grid delight" },
      { name: "French Toast", rarity: "epic", avatar: "🍞✨", description: "Sweet bread perfection" },
      { name: "Golden Egg", rarity: "legendary", avatar: "🥚💛", description: "Perfect morning protein" },
      { name: "Rainbow Cereal", rarity: "chroma", avatar: "🌈🥣", description: "Magical morning bowl" },
      { name: "Ambrosia", rarity: "mystical", avatar: "🍯✨", description: "Food of the gods" },
    ],
    color: "from-yellow-600 to-yellow-800",
    image: "/images/breakfast-pack.png",
    rarity: "common",
  },
  {
    id: "dino",
    name: "Dino Pack",
    price: 40,
    booms: [
      { name: "T-Rex", rarity: "common", avatar: "🦖", description: "King of dinosaurs" },
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
  },
  {
    id: "bot",
    name: "Bot Pack",
    price: 45,
    booms: [
      { name: "Robot", rarity: "common", avatar: "🤖", description: "Mechanical helper" },
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
  },
  {
    id: "wonderland",
    name: "Wonderland Pack",
    price: 50,
    booms: [
      { name: "Mad Hatter", rarity: "common", avatar: "🎩", description: "Crazy tea party host" },
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
  },
  {
    id: "outback",
    name: "Outback Pack",
    price: 32,
    booms: [
      { name: "Kangaroo", rarity: "common", avatar: "🦘", description: "Hopping marsupial" },
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
  },
  {
    id: "ice",
    name: "Ice Pack",
    price: 38,
    booms: [
      { name: "Penguin", rarity: "common", avatar: "🐧", description: "Tuxedo bird" },
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
  },
]

// Rarity chances for pack opening
const RARITY_CHANCES = {
  common: 25,
  uncommon: 20,
  rare: 10,
  epic: 3,
  legendary: 1,
  chroma: 0.1,
  mystical: 0.01,
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
    id: "1",
    title: "New Game Mode: Boom Battle is Live!",
    content:
      "Team up, collect ingredients, and stir up something sweet in Boom Battle, Boomkit's tropical team game mode!",
    date: "2024-01-15",
    image: "🥥",
  },
  {
    id: "2",
    title: "Race to gather ingredients and drop them in your team's cup",
    content: "Get back to your cup to Stir during the next phase",
    date: "2024-01-14",
  },
  {
    id: "3",
    title: "Answer questions to stay energized throughout the game",
    content: "Boomkit Plus users can host Boom Battle",
    date: "2024-01-13",
  },
]

export default function BoomkitGame() {
  const [currentView, setCurrentView] = useState<"register" | "login" | "game" | "owner-access">("owner-access")
  const [currentPage, setCurrentPage] = useState<
    "stats" | "booms" | "market" | "settings" | "chat" | "auction" | "staff" | "news" | "upgrade" | "leaderboard"
  >("stats")
  const [currentUser, setCurrentUser] = useState<GameUser | null>(null)
  const [users, setUsers] = useState<GameUser[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [ownerAccessCode, setOwnerAccessCode] = useState("")
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([])
  const [showNews, setShowNews] = useState(false)
  const [packAnimation, setPackAnimation] = useState<{
    show: boolean
    boom: BoomItem | null
    packName: string
  }>({ show: false, boom: null, packName: "" })
  const [showProfilePicker, setShowProfilePicker] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [showEmailEdit, setShowEmailEdit] = useState(false)
  const [showPasswordEdit, setShowPasswordEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
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

  // Badge management states
  const [showBadgeManager, setShowBadgeManager] = useState(false)
  const [selectedUserForBadge, setSelectedUserForBadge] = useState("")
  const [selectedBadge, setSelectedBadge] = useState("")

  // Boom selling/auction states
  const [showBoomAction, setShowBoomAction] = useState(false)
  const [selectedBoom, setSelectedBoom] = useState<string | null>(null)
  const [auctionPrice, setAuctionPrice] = useState("")
  const [auctionDuration, setAuctionDuration] = useState("24")

  // Moderation states
  const [showMuteDialog, setShowMuteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [userToModerate, setUserToModerate] = useState<GameUser | null>(null)
  const [muteDuration, setMuteDuration] = useState("1") // in hours
  const [banReason, setBanReason] = useState("")

  // Secret owner access code
  const SECRET_OWNER_CODE = "OKTAY2024BOOMKIT"

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

  const updateAndPersistUsers = useCallback((newUsers: GameUser[]) => {
    setUsers(newUsers)
    localStorage.setItem("boomkit_approved_users", JSON.stringify(newUsers))
  }, [])

  const updateAndPersistCurrentUser = useCallback(
    (updatedUser: GameUser | null) => {
      if (updatedUser) {
        // Add or update the lastSeen timestamp on every action
        const userWithActivity = { ...updatedUser, lastSeen: Date.now() }
        setCurrentUser(userWithActivity)
        localStorage.setItem("boomkit_current_user", JSON.stringify(userWithActivity))

        // Also update the user in the main list
        setUsers((prevUsers) => {
          const newUsers = prevUsers.map((u) => (u.id === userWithActivity.id ? userWithActivity : u))
          localStorage.setItem("boomkit_approved_users", JSON.stringify(newUsers))
          return newUsers
        })
      } else {
        setCurrentUser(null)
        localStorage.removeItem("boomkit_current_user")
      }
    },
    [setUsers],
  )

  const updateAndPersistChat = useCallback((newMessages: ChatMessage[]) => {
    setChatMessages(newMessages)
    localStorage.setItem("boomkit_chat_messages", JSON.stringify(newMessages))
  }, [])

  const updateAndPersistAuctions = useCallback((newAuctions: AuctionItem[]) => {
    setAuctionItems(newAuctions)
    localStorage.setItem("boomkit_auctions", JSON.stringify(newAuctions))
  }, [])

  // Load initial data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("boomkit_approved_users")
      if (storedUsers) setUsers(JSON.parse(storedUsers))

      const storedCurrentUser = localStorage.getItem("boomkit_current_user")
      if (storedCurrentUser) {
        setCurrentUser(JSON.parse(storedCurrentUser))
        setCurrentView("game")
      }

      const storedAuctions = localStorage.getItem("boomkit_auctions")
      if (storedAuctions) setAuctionItems(JSON.parse(storedAuctions))

      const storedChat = localStorage.getItem("boomkit_chat_messages")
      if (storedChat) setChatMessages(JSON.parse(storedChat))

      const storedCustomRoles = localStorage.getItem("boomkit_custom_roles")
      if (storedCustomRoles) setCustomRoles(JSON.parse(storedCustomRoles))
    }
  }, [])

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

  // Handle owner access code
  const handleOwnerAccess = (e: React.FormEvent) => {
    e.preventDefault()

    if (ownerAccessCode === MASTER_AUTHORIZATION_KEY) {
      authorizeCurrentSystem()
      alert("System authorized! You can now use the regular owner access code.")
      setOwnerAccessCode("")
      return
    }

    if (!isAuthorizedSystem()) {
      alert(
        `🚫 ACCESS DENIED 🚫\n\nThis computer is not authorized for owner access.\n\nSystem ID: ${systemSignature.substring(0, 12)}...\n\nContact the system administrator for authorization.`,
      )
      setOwnerAccessCode("")
      return
    }

    if (ownerAccessCode === SECRET_OWNER_CODE) {
      const allBooms: { [key: string]: number } = {}
      PACKS.forEach((pack) => {
        pack.booms.forEach((boom) => {
          allBooms[boom.name] = 5
        })
      })

      const ownerUser: GameUser = {
        id: "owner",
        username: "Oktay",
        email: "oktay.abdullazadeh@gmail.com",
        age: 25,
        tokens: 999999,
        dailyTokens: 0,
        packs: PACKS.map((pack) => pack.id),
        booms: allBooms,
        isOwner: true,
        isBanned: false,
        isMuted: false,
        status: "approved",
        reason: "",
        role: "owner",
        joinDate: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        boomScore: 999,
        totalValue: 50000,
        profilePicture: "👑",
        isPlusUser: true,
        nameColor: "rainbow",
        bannerColor: "rainbow",
        lastDailySpin: "",
        badges: ["developer", "og"],
        lastSeen: Date.now(),
      }
      updateAndPersistCurrentUser(ownerUser)
      setCurrentView("game")
    } else {
      alert("Invalid access code!")
      setOwnerAccessCode("")
    }
  }

  // Handle registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (Number.parseInt(registerForm.age) < 10) {
      alert("You must be at least 10 years old to register.")
      return
    }

    const newUser: GameUser = {
      id: Date.now().toString(),
      username: registerForm.username,
      email: registerForm.email,
      age: Number.parseInt(registerForm.age),
      tokens: 0,
      dailyTokens: 0,
      packs: [],
      booms: {},
      isOwner: false,
      isBanned: false,
      isMuted: false,
      status: "approved", // Auto-approve
      reason: registerForm.reason,
      role: "player",
      joinDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      boomScore: 0,
      totalValue: 0,
      profilePicture: "🎯",
      isPlusUser: false,
      nameColor: "white",
      bannerColor: "purple",
      lastDailySpin: "",
      badges: [],
      lastSeen: Date.now(),
    }

    updateAndPersistUsers([...users, newUser])
    updateAndPersistCurrentUser(newUser)
    setCurrentView("game")
  }

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const user = users.find((u) => u.username === loginForm.username)
    if (!user) {
      alert("Invalid credentials.")
      return
    }

    // Check for expired ban/mute
    let userWasUpdated = false
    if (user.isBanned && user.banExpiry && user.banExpiry < Date.now()) {
      user.isBanned = false
      user.banExpiry = null
      user.banReason = ""
      userWasUpdated = true
    }
    if (user.isMuted && user.muteExpiry && user.muteExpiry < Date.now()) {
      user.isMuted = false
      user.muteExpiry = null
      userWasUpdated = true
    }

    if (userWasUpdated) {
      const newUsers = users.map((u) => (u.id === user!.id ? user! : u))
      updateAndPersistUsers(newUsers)
    }

    if (user.status === "approved" && !user.isBanned) {
      updateAndPersistCurrentUser(user)
      setCurrentView("game")
    } else if (user.isBanned) {
      alert(`You are banned. Reason: ${user.banReason || "No reason specified."}`)
    } else {
      alert("Account not approved.")
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
      "common",
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

    const commonBooms = pack.booms.filter((boom) => boom.rarity === "common")
    return commonBooms[Math.floor(Math.random() * commonBooms.length)]
  }

  // Open pack with animation
  const openPack = (packId: string, updatedUser: GameUser) => {
    const pack = PACKS.find((p) => p.id === packId)
    if (!pack) return

    const randomBoom = getRandomBoomFromPack(pack)

    setPackAnimation({ show: true, boom: randomBoom, packName: pack.name })

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
                  : randomBoom.rarity === "uncommon"
                    ? 10
                    : 5),
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
                  : randomBoom.rarity === "uncommon"
                    ? 100
                    : 50),
    }

    updateAndPersistCurrentUser(finalUser)

    setTimeout(() => {
      setPackAnimation({ show: false, boom: null, packName: "" })
    }, 3000)
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
      case "common":
        return 15
      case "uncommon":
        return 35
      case "rare":
        return 75
      case "epic":
        return 150
      case "legendary":
        return 400
      case "chroma":
        return 800
      case "mystical":
        return 2000
      default:
        return 10
    }
  }

  // Handle direct sell
  const handleDirectSell = () => {
    if (!currentUser || !selectedBoom) return

    const sellPrice = getBoomSellPrice(selectedBoom)
    const currentQuantity = currentUser.booms[selectedBoom] || 0

    if (currentQuantity <= 0) {
      alert("You don't have this boom!")
      return
    }

    const updatedBooms = { ...currentUser.booms }
    if (updatedBooms[selectedBoom] > 1) {
      updatedBooms[selectedBoom] -= 1
    } else {
      delete updatedBooms[selectedBoom]
    }

    const updatedUser = {
      ...currentUser,
      booms: updatedBooms,
      tokens: currentUser.tokens + sellPrice,
      totalValue: currentUser.totalValue - getBoomValue(selectedBoom),
      boomScore: currentUser.boomScore - getBoomScoreValue(selectedBoom),
    }

    updateAndPersistCurrentUser(updatedUser)

    setShowBoomAction(false)
    setSelectedBoom(null)
    alert(`Sold ${selectedBoom} for ${sellPrice} tokens!`)
  }

  // Handle auction listing
  const handleAuctionList = () => {
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

    const newAuction: AuctionItem = {
      id: Date.now().toString(),
      boomName: selectedBoom,
      seller: currentUser.username,
      currentBid: startingBid,
      timeLeft: duration,
      bidders: [],
    }

    const updatedBooms = { ...currentUser.booms }
    if (updatedBooms[selectedBoom] > 1) {
      updatedBooms[selectedBoom] -= 1
    } else {
      delete updatedBooms[selectedBoom]
    }

    const updatedUser = {
      ...currentUser,
      booms: updatedBooms,
      totalValue: currentUser.totalValue - getBoomValue(selectedBoom),
      boomScore: currentUser.boomScore - getBoomScoreValue(selectedBoom),
    }

    updateAndPersistCurrentUser(updatedUser)
    updateAndPersistAuctions([...auctionItems, newAuction])

    setShowBoomAction(false)
    setSelectedBoom(null)
    alert(`Listed ${selectedBoom} for auction with starting bid of ${startingBid} tokens!`)
  }

  // Get boom value for calculations
  const getBoomValue = (boomName: string) => {
    const rarity = getBoomRarity(boomName)
    switch (rarity) {
      case "common":
        return 50
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
        return 25
    }
  }

  // Get boom score value for calculations
  const getBoomScoreValue = (boomName: string) => {
    const rarity = getBoomRarity(boomName)
    switch (rarity) {
      case "common":
        return 5
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
        return 2
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

    const userRole =
      DEFAULT_ROLES.find((r) => r.id === currentUser.role) || customRoles.find((r) => r.id === currentUser.role)

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

  // Quick role assignment
  const quickAssignRole = (userId: string, roleId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role: roleId } : u))
    updateAndPersistUsers(updatedUsers)
    alert(`Role updated successfully!`)
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
    return "common"
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
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
        return "bg-gray-500"
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

  // Create custom role
  const createCustomRole = () => {
    if (!newRoleName.trim() || !selectedUserForRole) {
      alert("Please enter role name and select a user!")
      return
    }

    const targetUser = users.find((u) => u.username === selectedUserForRole)
    if (!targetUser) {
      alert("User not found!")
      return
    }

    const newRole: CustomRole = {
      id: `custom_${Date.now()}`,
      name: newRoleName,
      color: newRoleColor,
      assignedBy: currentUser?.username || "System",
      assignedDate: new Date().toLocaleDateString(),
    }

    const updatedCustomRoles = [...customRoles, newRole]
    setCustomRoles(updatedCustomRoles)
    localStorage.setItem("boomkit_custom_roles", JSON.stringify(updatedCustomRoles))

    const updatedUsers = users.map((u) => (u.id === targetUser.id ? { ...u, role: newRole.id } : u))
    updateAndPersistUsers(updatedUsers)

    setNewRoleName("")
    setNewRoleColor("bg-blue-500")
    setSelectedUserForRole("")
    alert(`Custom role "${newRole.name}" created and assigned to ${targetUser.username}!`)
  }

  // Get user role name
  const getUserRoleName = (user: GameUser) => {
    const role = DEFAULT_ROLES.find((r) => r.id === user.role) || customRoles.find((r) => r.id === user.role)
    return role?.name || "Player"
  }

  if (currentView === "owner-access") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-orange-600 flex items-center justify-center">
              <CrownIcon className="h-8 w-8 mr-2" />
              Owner Access
            </CardTitle>
            <CardDescription>Enter your secret access code to continue as owner</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOwnerAccess} className="space-y-4">
              <div>
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  type="password"
                  value={ownerAccessCode}
                  onChange={(e) => setOwnerAccessCode(e.target.value)}
                  placeholder="Enter your secret code"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                <KeyIcon className="h-4 w-4 mr-2" />
                Access as Owner
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Button variant="link" onClick={() => setCurrentView("login")}>
                Regular User Login
              </Button>
              <Button variant="link" onClick={() => setCurrentView("register")}>
                New User Registration
              </Button>
            </div>
          </CardContent>
        </Card>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
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
      {/* Sidebar - Blooket Style */}
      <div className="w-48 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold text-white">Boomkit</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          <button
            onClick={() => setCurrentPage("stats")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "stats" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <BarChart3Icon className="h-5 w-5 mr-3" />
            Stats
          </button>

          <button
            onClick={() => setCurrentPage("booms")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "booms" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <PackageIcon className="h-5 w-5 mr-3" />
            Booms
          </button>

          <button
            onClick={() => setCurrentPage("market")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "market" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            Market
          </button>

          <button
            onClick={() => setCurrentPage("chat")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "chat" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <MessageCircleIcon className="h-5 w-5 mr-3" />
            Chat
          </button>

          <button
            onClick={() => setCurrentPage("auction")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "auction" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <GavelIcon className="h-5 w-5 mr-3" />
            Auction
          </button>

          <button
            onClick={() => setCurrentPage("leaderboard")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "leaderboard" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <BarChart3Icon className="h-5 w-5 mr-3" />
            Leaderboard
          </button>

          {(currentUser?.role === "moderator" ||
            currentUser?.role === "senior_moderator" ||
            currentUser?.role === "admin" ||
            isOwner()) && (
            <button
              onClick={() => setCurrentPage("staff")}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === "staff" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <ShieldIcon className="h-5 w-5 mr-3" />
              Staff
            </button>
          )}

          <button
            onClick={() => setCurrentPage("settings")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === "settings" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <SettingsIcon className="h-5 w-5 mr-3" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Badge className="bg-yellow-500 text-white">
              <CoinsIcon className="h-4 w-4 mr-1" />
              {currentUser?.tokens || 0}
            </Badge>
            {currentUser?.isOwner && <CrownIcon className="h-6 w-6 text-yellow-400" />}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowNews(!showNews)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              size="sm"
            >
              <NewspaperIcon className="h-4 w-4 mr-2" />
              Boomkit News
            </Button>
            <div className="flex items-center space-x-2 bg-purple-600 rounded-lg px-3 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-yellow-500 text-white">
                  {currentUser?.profilePicture || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className={`font-medium ${
                  currentUser?.nameColor === "rainbow"
                    ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                    : "text-white"
                }`}
              >
                {currentUser?.username}
              </span>
              {/* Display user badges */}
              <div className="flex space-x-1">
                {(currentUser?.badges ?? []).map((badgeId) => {
                  const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                  return badge ? (
                    <span key={badgeId} className="text-sm" title={badge.name}>
                      {badge.emoji}
                    </span>
                  ) : null
                })}
              </div>
            </div>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white" size="sm">
              Logout
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Stats Page */}
            {currentPage === "stats" && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div
                  className={`backdrop-blur-md rounded-lg p-6 ${
                    currentUser?.bannerColor === "rainbow"
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
                        className={`text-2xl font-bold ${
                          currentUser?.nameColor === "rainbow"
                            ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                            : "text-white"
                        }`}
                      >
                        {currentUser?.username}
                      </h2>
                      <p className="text-white/70">{currentUser ? getUserRoleName(currentUser) : "Player"}</p>
                      {/* Display badges */}
                      <div className="flex space-x-1 mt-1">
                        {(currentUser?.badges ?? []).map((badgeId) => {
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
                      className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 border-yellow-500 flex items-center justify-center text-4xl ${
                        spinning ? "animate-spin" : ""
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
                <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-bold text-white">My Booms</h1>
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
                          return (
                            <div key={index} className="text-center">
                              <div
                                className={`w-12 h-12 rounded border-2 border-white mb-1 flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-110 relative ${
                                  hasBooom
                                    ? `${getRarityColor(boom.rarity)} text-white shadow-lg`
                                    : "bg-black text-gray-500"
                                }`}
                                onClick={() => hasBooom && handleBoomClick(boom.name)}
                              >
                                {hasBooom ? boom.avatar : "🔒"}
                                {hasBooom && quantity > 1 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {quantity}
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
                      <div className="text-6xl mb-2">🏪</div>
                      <div className="text-white font-bold">MARKET</div>
                    </div>
                  </div>
                </div>

                {/* Rarity Information */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <h3 className="text-white font-bold mb-3">📊 Drop Rates</h3>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs mb-1">Common</div>
                      <div className="text-white">25%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs mb-1">Uncommon</div>
                      <div className="text-white">20%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs mb-1">Rare</div>
                      <div className="text-white">10%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs mb-1">Epic</div>
                      <div className="text-white">3%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs mb-1">Legendary</div>
                      <div className="text-white">1%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 text-white px-2 py-1 rounded text-xs mb-1">
                        Chroma
                      </div>
                      <div className="text-white">0.1%</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900 text-white px-2 py-1 rounded text-xs mb-1">
                        Mystical
                      </div>
                      <div className="text-white">0.01%</div>
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

                        {/* Pack Image */}
                        <div className="pt-6 pb-4 px-4">
                          <img
                            src={pack.image || "/placeholder.svg"}
                            alt={pack.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
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
                          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                            pack.rarity === "common"
                              ? "bg-gray-500"
                              : pack.rarity === "uncommon"
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
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Global Chat</h1>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <ScrollArea className="h-96 w-full border border-white/20 rounded p-4 mb-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.role}
                          </Badge>
                          <span
                            className="text-white font-semibold cursor-pointer hover:underline"
                            onClick={() => handleUsernameClick(msg.username)}
                          >
                            {msg.username}:
                          </span>
                        </div>
                        <p className="text-white/90 ml-2">{msg.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={currentUser?.isMuted ? "You are muted" : "Type a message..."}
                      disabled={currentUser?.isMuted}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={currentUser?.isMuted}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Auction Page */}
            {currentPage === "auction" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Auction House</h1>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Active Auctions</h2>
                  {auctionItems.length === 0 ? (
                    <p className="text-white/70 text-center">No active auctions</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {auctionItems.map((item) => (
                        <div key={item.id} className="bg-white/10 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-3xl">{getBoomAvatar(item.boomName)}</span>
                            <div>
                              <h3 className="text-white font-bold">{item.boomName}</h3>
                              <Badge className={`${getRarityColor(getBoomRarity(item.boomName))} text-white text-xs`}>
                                {getBoomRarity(item.boomName)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-white/70">Seller: {item.seller}</p>
                          <p className="text-white">Current Bid: {item.currentBid} tokens</p>
                          <p className="text-white/70">Time Left: {item.timeLeft}h</p>
                          <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">Place Bid</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard Page */}
            {currentPage === "leaderboard" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Leaderboard</h1>

                {/* Token Leaderboard */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold flex items-center">
                      🪙 Token Leaders
                    </div>
                  </div>
                  <div className="space-y-3">
                    {users
                      .filter((user) => user.status === "approved" && !user.isBanned)
                      .sort((a, b) => b.tokens - a.tokens)
                      .slice(0, 10)
                      .map((user, index) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-600 to-yellow-800 shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-600"
                                : index === 2
                                  ? "bg-gradient-to-r from-orange-600 to-orange-800"
                                  : "bg-white/10"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
                                  index === 0
                                    ? "bg-yellow-400 text-yellow-900"
                                    : index === 1
                                      ? "bg-gray-300 text-gray-800"
                                      : index === 2
                                        ? "bg-orange-400 text-orange-900"
                                        : "bg-purple-600 text-white"
                                }`}
                              >
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-xl">
                              {user.profilePicture}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`font-bold text-lg ${
                                    user.nameColor === "rainbow"
                                      ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                                      : "text-white"
                                  }`}
                                >
                                  {user.username}
                                  {user.isOwner && " 👑"}
                                  {user.isPlusUser && " ✨"}
                                </div>
                                {/* Display badges */}
                                <div className="flex space-x-1">
                                  {(user.badges ?? []).map((badgeId) => {
                                    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                                    return badge ? (
                                      <span key={badgeId} className="text-sm" title={badge.name}>
                                        {badge.emoji}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              </div>
                              <div className="text-white/70 text-sm">
                                {Object.keys(user.booms).length} unique booms • Joined {user.joinDate.split(",")[0]}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 font-bold text-xl flex items-center">
                              <CoinsIcon className="h-5 w-5 mr-1" />
                              {user.tokens.toLocaleString()}
                            </div>
                            <div className="text-white/70 text-sm">tokens</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Boom Count Leaderboard */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center">
                      ⭐ Boom Collectors
                    </div>
                  </div>
                  <div className="space-y-3">
                    {users
                      .filter((user) => user.status === "approved" && !user.isBanned)
                      .sort((a, b) => Object.keys(b.booms).length - Object.keys(a.booms).length)
                      .slice(0, 10)
                      .map((user, index) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            index === 0
                              ? "bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-r from-blue-500 to-blue-700"
                                : index === 2
                                  ? "bg-gradient-to-r from-green-500 to-green-700"
                                  : "bg-white/10"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
                                  index === 0
                                    ? "bg-purple-400 text-purple-900"
                                    : index === 1
                                      ? "bg-blue-300 text-blue-800"
                                      : index === 2
                                        ? "bg-green-300 text-green-800"
                                        : "bg-gray-600 text-white"
                                }`}
                              >
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-xl">
                              {user.profilePicture}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`font-bold text-lg ${
                                    user.nameColor === "rainbow"
                                      ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                                      : "text-white"
                                  }`}
                                >
                                  {user.username}
                                  {user.isOwner && " 👑"}
                                  {user.isPlusUser && " ✨"}
                                </div>
                                {/* Display badges */}
                                <div className="flex space-x-1">
                                  {(user.badges ?? []).map((badgeId) => {
                                    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                                    return badge ? (
                                      <span key={badgeId} className="text-sm" title={badge.name}>
                                        {badge.emoji}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              </div>
                              <div className="text-white/70 text-sm">
                                {user.tokens.toLocaleString()} tokens • Score: {user.boomScore}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-purple-400 font-bold text-xl flex items-center">
                              <PackageIcon className="h-5 w-5 mr-1" />
                              {Object.keys(user.booms).length}
                            </div>
                            <div className="text-white/70 text-sm">unique booms</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Boom Score Leaderboard */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold flex items-center">
                      🏆 Top Performers
                    </div>
                  </div>
                  <div className="space-y-3">
                    {users
                      .filter((user) => user.status === "approved" && !user.isBanned)
                      .sort((a, b) => b.boomScore - a.boomScore)
                      .slice(0, 10)
                      .map((user, index) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            index === 0
                              ? "bg-gradient-to-r from-orange-600 to-red-600 shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-r from-pink-500 to-rose-600"
                                : index === 2
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                  : "bg-white/10"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
                                  index === 0
                                    ? "bg-orange-400 text-orange-900"
                                    : index === 1
                                      ? "bg-pink-300 text-pink-800"
                                      : index === 2
                                        ? "bg-indigo-300 text-indigo-800"
                                        : "bg-gray-600 text-white"
                                }`}
                              >
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-xl">
                              {user.profilePicture}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`font-bold text-lg ${
                                    user.nameColor === "rainbow"
                                      ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                                      : "text-white"
                                  }`}
                                >
                                  {user.username}
                                  {user.isOwner && " 👑"}
                                  {user.isPlusUser && " ✨"}
                                </div>
                                {/* Display badges */}
                                <div className="flex space-x-1">
                                  {(user.badges ?? []).map((badgeId) => {
                                    const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                                    return badge ? (
                                      <span key={badgeId} className="text-sm" title={badge.name}>
                                        {badge.emoji}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              </div>
                              <div className="text-white/70 text-sm">
                                {Object.keys(user.booms).length} unique booms • {user.tokens.toLocaleString()} tokens
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-400 font-bold text-xl flex items-center">
                              🏆 {user.boomScore}
                            </div>
                            <div className="text-white/70 text-sm">score</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Staff Page */}
            {(currentUser?.role === "moderator" ||
              currentUser?.role === "senior_moderator" ||
              currentUser?.role === "admin" ||
              isOwner()) &&
              currentPage === "staff" && (
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold text-white">Staff Panel</h1>

                  {/* Active Users Section */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Active Users (Last 5 Mins)</h2>
                    <div className="flex flex-wrap gap-4">
                      {users
                        .filter((u) => Date.now() - u.lastSeen < 300000 && !u.isOwner) // 5 minutes
                        .map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 bg-green-500/20 p-2 rounded-lg">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-white font-medium">{user.username}</span>
                          </div>
                        ))}
                      {users.filter((u) => Date.now() - u.lastSeen < 300000).length === 0 && (
                        <p className="text-white/70">No users active in the last 5 minutes.</p>
                      )}
                    </div>
                  </div>

                  {/* User Management */}
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white">All Users</h2>
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
                    <div className="space-y-3">
                      {users
                        .filter((u) => !u.isOwner)
                        .map((user) => {
                          const userRole =
                            DEFAULT_ROLES.find((r) => r.id === user.role) || customRoles.find((r) => r.id === user.role)
                          const isActive = Date.now() - user.lastSeen < 300000 // Active in last 5 mins
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
                                {/* Display user badges */}
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
                                {(currentUser?.role === "admin" || isOwner()) && (
                                  <>
                                    <select
                                      value={user.role}
                                      onChange={(e) => quickAssignRole(user.id, e.target.value)}
                                      className="bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
                                      disabled={!isOwner()}
                                    >
                                      {DEFAULT_ROLES.filter((role) => role.id !== "owner").map((role) => (
                                        <option key={role.id} value={role.id} className="bg-gray-800 text-white">
                                          {role.name}
                                        </option>
                                      ))}
                                      {customRoles.map((role) => (
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
                      <Button variant="link" onClick={() => setShowNameEdit(true)}>
                        Change Username
                      </Button>
                      <Button variant="link" onClick={() => setShowEmailEdit(true)}>
                        Change Email
                      </Button>
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
          </div>
        </div>
      </div>

      {/* Modals and Overlays */}
      {/* News Modal */}
      {showNews && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Boomkit News</CardTitle>
              <CardDescription>Stay up to date with the latest updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NEWS_ITEMS.map((news) => (
                <div key={news.id} className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-white">{news.title}</h3>
                  <p className="text-white/70">{news.content}</p>
                  <p className="text-white/50 text-sm">{news.date}</p>
                </div>
              ))}
              <Button onClick={() => setShowNews(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pack Opening Animation */}
      {packAnimation.show && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Opening {packAnimation.packName}!</CardTitle>
              <CardDescription>Revealing your new Boom...</CardDescription>
            </CardHeader>
            <CardContent>
              {packAnimation.boom && (
                <div className="space-y-4">
                  <div
                    className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl border-4 border-white shadow-lg ${getAnimationClass(packAnimation.boom.rarity)}`}
                  >
                    {packAnimation.boom.avatar}
                  </div>
                  <h3 className="text-2xl font-bold">{packAnimation.boom.name}</h3>
                  <p className="text-white/70">{packAnimation.boom.description}</p>
                  <Badge className={`${getRarityColor(packAnimation.boom.rarity)} text-white`}>
                    {packAnimation.boom.rarity}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Picture Picker */}
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

      {/* Name Edit Modal */}
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

      {/* Email Edit Modal */}
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

      {/* Password Edit Modal */}
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
                  // In a real application, you would hash the password before saving it
                  // For this example, we're just showing a placeholder
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

      {/* Delete Account Confirmation */}
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
                  // In a real application, you would handle the account deletion logic here
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

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
              <CardDescription>Our commitment to your privacy</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                This is a placeholder for the privacy policy. In a real application, you would include the actual
                privacy policy content here.
              </p>
              <Button onClick={() => setShowPrivacyPolicy(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Terms of Service</CardTitle>
              <CardDescription>The legal agreement for using our service</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                This is a placeholder for the terms of service. In a real application, you would include the actual
                terms of service content here.
              </p>
              <Button onClick={() => setShowTermsOfService(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Stats Modal */}
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

      {/* Mute Dialog */}
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

      {/* Ban Dialog */}
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

      {/* Custom Role Manager */}
      {showRoleManager && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create Custom Role</CardTitle>
              <CardDescription>Define a new role and assign it to a user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="Role Name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />

              <Label htmlFor="roleColor">Role Color</Label>
              <Input
                type="color"
                id="roleColor"
                value={newRoleColor}
                onChange={(e) => setNewRoleColor(e.target.value)}
              />

              <Label htmlFor="userForRole">Assign to User</Label>
              <select
                id="userForRole"
                value={selectedUserForRole}
                onChange={(e) => setSelectedUserForRole(e.target.value)}
                className="w-full bg-white/20 text-white text-sm rounded px-2 py-1 border border-white/30"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.username} className="bg-gray-800 text-white">
                    {user.username}
                  </option>
                ))}
              </select>

              <Button onClick={createCustomRole} className="w-full bg-green-600 hover:bg-green-700">
                Create Role
              </Button>
              <Button onClick={() => setShowRoleManager(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badge Manager */}
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

      {/* Boom Action Modal */}
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
