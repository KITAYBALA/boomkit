"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
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
  GavelIcon,
  NewspaperIcon,
  CameraIcon,
  XIcon,
  MenuIcon,
  CreditCardIcon,
  PencilIcon,
  UserIcon,
  LockIcon,
  TrashIcon,
  FileTextIcon,
  Star,
  BanIcon,
  CheckIcon,
  CompassIcon,
  SparklesIcon,
  Settings2Icon,
  Users2Icon,
  InfoIcon,
  TrophyIcon,
  BoxIcon,
  FlameIcon,
  StarIcon,
  CalendarIcon,
  CoinsIcon,
  ShoppingBagIcon,
  BeakerIcon,
  ClockIcon,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

import RealtimeChat from "@/components/realtime-chat"
import PrivateChat from "@/components/private-chat"
import RealtimeAuctions from "@/components/realtime-auctions"
import RealtimeLeaderboard from "@/components/realtime-leaderboard"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import StripeCheckout from "@/components/stripe-checkout"
import TradingPage from "@/components/trading-page" // Import TradingPage
import DiscoverPage from "@/components/discover-page"
import GameModeSelector, { GameMode } from "@/components/game-mode-selector"
import HostSettingsModal, { GameSettings } from "@/components/host-settings-modal"
import HostDashboard from "@/components/host-dashboard"
import MergingGame from "@/components/merging-game"
import FishingFrenzy from "@/components/fishing-frenzy"
import { getFallbackQuestions } from "@/lib/fallback-questions"
import GameLobby from "@/components/game-lobby"
import { createBrowserClient } from "@supabase/ssr"
import GameResults from "@/components/game-results"
import DailySpinWheel from "@/components/daily-spin-wheel"
import { toast } from "sonner"

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
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as any
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
    (navigator as any).hardwareConcurrency?.toString() || "unknown",
    (navigator as any).deviceMemory?.toString() || "unknown",
    navigator.platform,
    navigator.cookieEnabled.toString(),
    navigator.doNotTrack || "unknown",
    window.devicePixelRatio?.toString() || "1",
    navigator.maxTouchPoints?.toString() || "0",
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getAudioFingerprint(),
    // Additional browser-specific features
    typeof (window as any).chrome !== "undefined" ? "chrome" : "other",
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
  status: string
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
  lastIp?: string // Added for IP blacklisting
  xp: number // Added for leveling system
  level: number // Added for leveling system
  pinned_boom?: string // Selected boom to show off
  season_xp: number
  has_plus_pass: boolean
  games_played: number
  total_tokens_earned: number
  loginStreak: number
  lastStreakClaim: string | null
  // password?: string; // Removed password from interface to avoid unintended exposure
  clan_id?: string | null
  clan_role?: "leader" | "co_leader" | "member" | null
  clan_tag?: string | null
  clan_tag_color?: string | null
  fusion_cooldown_ends_at?: string | null
  consecutive_fusions?: number
  last_fusion_claim_time?: string | null
  active_fusion_boom1?: string | null
  active_fusion_boom2?: string | null
  active_fusion_ends_at?: string | null
  active_fusion_started_at?: string | null
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
  series?: number
  isNew?: boolean
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
  imageUrl?: string
  badge?: string
  badgeColor?: string
}

// ... existing code ...

const getBoomRarity = (boomName: string) => {
  for (const pack of PACKS) {
    const boom = pack.booms.find((b) => b.name === boomName)
    if (boom) return boom.rarity
  }
  return "uncommon"
}

const getBoomAvatar = (boomName: string) => {
  for (const pack of PACKS) {
    const boom = pack.booms.find((b) => b.name === boomName)
    if (boom) return boom.avatar
  }
  return "❓"
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "uncommon": return "bg-green-500"
    case "rare": return "bg-blue-500"
    case "epic": return "bg-purple-500"
    case "legendary": return "bg-orange-500"
    case "chroma": return "bg-pink-500"
    case "mystical": return "bg-cyan-500"
    default: return "bg-gray-500"
  }
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

const gradingGroups = [
  { grade: 1, label: "1st Grade" },
  { grade: 2, label: "2nd Grade" },
  { grade: 3, label: "3rd Grade" },
  { grade: 4, label: "4th Grade" },
  { grade: 5, label: "5th Grade" },
  { grade: 6, label: "6th Grade" },
  { grade: 7, label: "7th Grade" },
  { grade: 8, label: "8th Grade" },
  { grade: 9, label: "9th Grade" },
  { grade: 10, label: "10th Grade" },
  { grade: 11, label: "11th Grade" },
  { grade: 12, label: "12th Grade" },
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
    id: "ai",
    name: "AI Pack",
    price: 35,
    series: 2,
    isNew: true,
    booms: [
      { name: "DeepSeek", rarity: "uncommon", avatar: "/images/booms/deepseek.png", description: "Deep thinking AI" },
      { name: "Microsoft Copilot", rarity: "rare", avatar: "/images/booms/copilot.png", description: "Your daily AI companion" },
      { name: "Claude", rarity: "epic", avatar: "/images/booms/chatgpt.png", description: "Helpful and harmless AI" }, // Fixed mixed logos
      { name: "ChatGPT", rarity: "legendary", avatar: "/images/booms/claude.png", description: "The pioneer of conversational AI" }, // Fixed mixed logos
      { name: "Vercel", rarity: "chroma", avatar: "/images/booms/vercel.png", description: "The platform for frontend developers" },
      { name: "Google Gemini", rarity: "mystical", avatar: "/images/booms/gemini.png", description: "The most capable AI from Google" },
    ],
    color: "from-indigo-600 to-blue-900",
    image: "/images/ai-pack.png",
    rarity: "rare",
    emoji: "🧠",
  },
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
  // AI pack removed from here as it was moved to front
]

// Gamepass Booms - Unlocked at level milestones
const GAMEPASS_BOOMS = [
  { level: 10, rarity: "uncommon" as const, name: "Random Uncommon" },
  { level: 20, rarity: "rare" as const, name: "Random Rare" },
  { level: 30, rarity: "epic" as const, name: "Random Epic" },
  { level: 40, rarity: "legendary" as const, name: "Random Legendary" },
  { level: 50, rarity: "chroma" as const, name: "Random Chroma" },
  { level: 60, rarity: "mystical" as const, name: "Random Mystical" },
  { level: 70, rarity: "mystical" as const, name: "The Trophy", isLimited: true },
]

const LIMITED_BOOMS = [
  { name: "Void Dragon", rarity: "mystical", avatar: "🐲🌌", description: "Ruler of the dark matter", price: 5000 },
  { name: "Infinity Gauntlet", rarity: "mystical", avatar: "💎🥊", description: "Power to reshape reality", price: 7500 },
  { name: "Cosmic Phoenix", rarity: "mystical", avatar: "🔥🦅", description: "Eternal rebirth in starlight", price: 10000 },
  { name: "God Eye", rarity: "mystical", avatar: "👁️✨", description: "See all, know all", price: 15000 },
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

const DAILY_SPIN_REWARDS = [100, 150, 200, 250, 300, 350, 400, 500]

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
    id: "4",
    title: "BOOMKIT V2 IS HERE!",
    content: "Boomkit V2.0 is officially out! We have integrated a new virtual Boom Rental system, upgraded the Fusion Lab with full item mapping, secured trading against banned/rejected accounts, enabled staff to run custom Tournaments and Seasons, and upgraded quiz generation with Gemini 2.5 Flash Lite. Click around the dashboard to explore all V2 features!",
    date: "2026-05-28",
    image: "🚀",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
    badge: "V2 Release",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  {
    id: "3",
    title: "Introducing 30+ Game Modes!",
    content: "Take your learning to the next level with our massive new update. From 'Gold Quest' to 'Cyberpunk', discover 30 unique ways to play and earn rewards. Each mode features custom mechanics and premium 3D visuals.",
    date: "2026-02-01",
    image: "🎮",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
    badge: "Major Update",
    badgeColor: "bg-purple-500"
  },
  {
    id: "2",
    title: "Solo Play Revolution",
    content: "You can now play any game mode in Solo Mode! Earn tokens, gain XP, and master the curriculum at your own pace. Perfect for late-night study sessions or competitive practice.",
    date: "2026-01-31",
    image: "👤",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    badge: "New Feature",
    badgeColor: "bg-blue-500"
  },
  {
    id: "1",
    title: "Boomkit V1.0 is Out!",
    content: "We are thrilled to announce the official release of Boomkit V1.0! This major milestone brings real-time chat, live auctions, global leaderboards, and pack opening features. Thank you to our amazing community for your support.",
    date: "2024-12-19",
    image: "🎉",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80",
    badge: "Official Release",
    badgeColor: "bg-emerald-500"
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
    | "private-chat"
    | "auction"
    | "staff"
    | "news"
    | "upgrade"
    | "leaderboard"
    | "trading"
    | "shop"
    | "discover"
    | "friends"
    | "clans"
    | "tournaments"
    | "achievements"
    | "season"
    | "fusion"
  >("stats")
  const [activeDiscoverGame, setActiveDiscoverGame] = useState<{
    grade: number
    subject: string
    mode: "solo" | "host" | "join"
    gameMode: string
    questions: any[]
    series?: number
    isNew?: boolean
    duration?: number // Added duration
  } | null>(null)
  const [isMergingGameActive, setIsMergingGameActive] = useState(false)
  const [lobbyActive, setLobbyActive] = useState(false)
  const [activeGamePin, setActiveGamePin] = useState("")
  const [selectedDuration, setSelectedDuration] = useState(120)
  const [discoveredSets, setDiscoveredSets] = useState<any[]>([])
  const [isGeneratingSet, setIsGeneratingSet] = useState(false)
  const [showAiSetCreator, setShowAiSetCreator] = useState(false)
  const [gameStartOffset, setGameStartOffset] = useState(0) // Added for sync

  // Hosting Flow States
  const [hostingFlow, setHostingFlow] = useState<null | 'mode-select' | 'settings'>(null)
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null)
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [hostingSubject, setHostingSubject] = useState<{ grade: number, subject: string } | null>(null)
  const [showGameResults, setShowGameResults] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [soloFlow, setSoloFlow] = useState<null | 'mode-select'>(null)
  const [soloSubject, setSoloSubject] = useState<{ grade: number, subject: string } | null>(null)
  const [livePlayers, setLivePlayers] = useState<any[]>([])
  const [aiSetPrompt, setAiSetPrompt] = useState("")
  const [aiQuestionCount, setAiQuestionCount] = useState(25)
  const [aiIsPublic, setAiIsPublic] = useState(false)
  const [aiGrade, setAiGrade] = useState(3)
  const [aiSubject, setAiSubject] = useState("Math")
  const [currentUser, setCurrentUser] = useState<GameUser | null>(null)
  const [users, setUsers] = useState<GameUser[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
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
  const [staffTab, setStaffTab] = useState<"all" | "active" | "muted" | "banned" | "applications" | "tournaments" | "seasons">("all")
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false) // Fixed typo from setShowShowPrivacyPolicy
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [canSpin, setCanSpin] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)

  // Player Profiles
  const [showPlayerProfile, setShowPlayerProfile] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState<GameUser | null>(null)
  const [selectedProfileEvolution, setSelectedProfileEvolution] = useState<any | null>(null)
  const [fusionSlot1, setFusionSlot1] = useState<string | null>(null)
  const [fusionSlot2, setFusionSlot2] = useState<string | null>(null)
  const [isFusing, setIsFusing] = useState(false)
  const [timeNow, setTimeNow] = useState<number>(Date.now())
  const [showCrafting, setShowCrafting] = useState(false)
  const [craftRecipes, setCraftRecipes] = useState<any[]>([])
  const [friendsList, setFriendsList] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [rentalListings, setRentalListings] = useState<any[]>([])

  const getVirtualBooms = useCallback((user: GameUser | null) => {
    if (!user) return {}
    const virtual = { ...(user.booms || {}) }
    const myActiveRentals = rentalListings.filter(
      (r) => r.renter_username === user.username && r.status === "rented"
    )
    for (const rental of myActiveRentals) {
      virtual[rental.boom_name] = (virtual[rental.boom_name] || 0) + 1
    }
    return virtual
  }, [rentalListings])
  const [friendSearchQuery, setFriendSearchQuery] = useState("")
  const [activeTournaments, setActiveTournaments] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null)
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([])
  const [userActivity, setUserActivity] = useState<any[]>([])
  const [shopItems, setShopItems] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [userAchievements, setUserAchievements] = useState<any[]>([])
  const [activeSeason, setActiveSeason] = useState<any | null>(null)
  const [seasonRewards, setSeasonRewards] = useState<any[]>([])

  // Admin stats dialog (existing)
  const [showUserStats, setShowUserStats] = useState(false)
  const [selectedUserStats, setSelectedUserStats] = useState<GameUser | null>(null)
  const [systemSignature, setSystemSignature] = useState<string>("")
  const [isStorageLoaded, setIsStorageLoaded] = useState(false) // Added to prevent hydration race conditions

  // Theme State
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "custom">("dark")
  const [customThemeColor, setCustomThemeColor] = useState("#6d28d9")
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
  const [sellQuantity, setSellQuantity] = useState(1)

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

  // News Popup state for V2 release
  const [showV2NewsModal, setShowV2NewsModal] = useState(false)

  // Clans States
  const [clanDetails, setClanDetails] = useState<any | null>(null)
  const [clansList, setClansList] = useState<any[]>([])
  const [clanChat, setClanChat] = useState<any[]>([])
  const [newClanMessage, setNewClanMessage] = useState("")
  const [searchClanQuery, setSearchClanQuery] = useState("")
  const [showClanProfileModal, setShowClanProfileModal] = useState<any | null>(null)
  const [isCreatingClan, setIsCreatingClan] = useState(false)
  const [createClanForm, setCreateClanForm] = useState({
    name: "",
    tag: "",
    description: "",
    logo: "🛡️",
    tagColor: "text-purple-400",
    minTokens: 0,
    minRarity: "uncommon",
    minRarityCount: 0
  })

  // Secret owner access code


  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    reason: "",
  })

  // ToS State
  const [tosAccepted, setTosAccepted] = useState(false)
  const [showTosModal, setShowTosModal] = useState(false)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  })

  // --- DATA PERSISTENCE AND SYNC HOOKS ---

  const updateAndPersistUsers = useCallback(
    async (newUsers: GameUser[], targetUserId?: string) => {
      setUsers(newUsers)
      localStorage.setItem("boomkit_approved_users", JSON.stringify(newUsers))

      if (!targetUserId) return

      const user = newUsers.find((u) => u.id === targetUserId)
      if (!user) return

      try {
        const updates: any = {
          username: user.username,
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
          profile_picture: user.profilePicture || "🎮",
          is_owner: user.isOwner || false,
          is_plus_user: user.isPlusUser || false,
          last_daily_spin: user.lastDailySpin || "",
          name_color: user.nameColor || "text-white",
          last_seen: user.lastSeen || Date.now(),
          reason: user.reason || "",
        }

        // Only include sensitive/unique fields if they were successfully fetched / exist
        if (user.email && user.email.trim() !== "") {
          updates.email = user.email;
        }


        const response = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId, updates }),
        })

        const data = await response.json()
        if (!data.success) {
          console.error("[v0] API Update Error:", data.message)
        } else {
          console.log("[v0] Successfully synced user via API:", user.username)
        }
      } catch (err) {
        console.error("[v0] Failed to sync user to API:", err)
      }
    },
    [],
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

  // Handle logout
  const handleLogout = useCallback(() => {
    // 1. Clear State
    setCurrentUser(null)
    localStorage.removeItem("boomkit_current_user")

    // 2. Redirect to landing
    setCurrentView("owner-access")

    // 3. Clear Supabase session
    const sb = getSupabaseBrowserClient()
    if (sb) {
      sb.auth.signOut()
    }
  }, [])

  // Fetch Custom AI/User sets from Supabase
  const fetchCustomSets = useCallback(async () => {
    if (!supabase) return

    try {
      // Fetch both public sets and user's private sets
      const { data, error } = await supabase
        .from("custom_sets")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching custom sets:", error.message)
        return
      }

      if (data) {
        // Merge with local discovered sets to avoid duplicates, prioritize DB
        setDiscoveredSets(prev => {
          const dbIds = new Set(data.map(s => s.id))
          const localOnly = prev.filter(s => s.id && !dbIds.has(s.id))
          return [...data, ...localOnly]
        })
      }
    } catch (err) {
      console.error("Critical error fetching custom sets:", err)
    }
  }, [supabase])

  useEffect(() => {
    if (typeof window !== "undefined" && supabase) {
      fetchCustomSets()
    }
  }, [fetchCustomSets, currentUser?.id])

  const updateAndPersistCurrentUser = useCallback(
    async (updatedUser: GameUser | null) => {
      if (!updatedUser) {
        handleLogout()
        return
      }

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
        // Use the secure API - Omit strictly protected fields to avoid 403 errors for standard users
        const updates: any = {
          username: userWithActivity.username,
          age: userWithActivity.age || 18,
          tokens: userWithActivity.tokens || 0,
          daily_tokens: userWithActivity.dailyTokens || 0,
          packs: userWithActivity.packs || [],
          booms: userWithActivity.booms || {},
          reason: userWithActivity.reason || "",
          join_date: userWithActivity.joinDate,
          boom_score: userWithActivity.boomScore || 0,
          total_value: userWithActivity.totalValue || 0,
          profile_picture: userWithActivity.profilePicture || "🎯",
          name_color: userWithActivity.nameColor || "",
          banner_color: userWithActivity.bannerColor || "",
          last_daily_spin: userWithActivity.lastDailySpin || "",
          last_seen: userWithActivity.lastSeen,
          packs_opened: userWithActivity.packsOpened || 0,
          xp: userWithActivity.xp || 0,
          level: userWithActivity.level || 1,
        }

        if (userWithActivity.email && userWithActivity.email.trim() !== "") {
          updates.email = userWithActivity.email;
        }
        if (userWithActivity.lastIp && userWithActivity.lastIp.trim() !== "") {
          updates.last_ip = userWithActivity.lastIp;
        }

        const response = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: userWithActivity.id, updates }),
        })

        if (response.status === 401) {
          console.warn("[v0] Session unauthorized during sync, logging out")
          handleLogout()
          return
        }

        const data = await response.json()
        if (!data.success) {
          console.error("[v0] Error syncing via API:", data.message)
        }
      } catch (error) {
        console.error("[v0] Error calling update API:", error)
      }
    },
    [setUsers, handleLogout],
  )

  const lastScoreSyncRef = useRef<number>(0)
  const lastScoreValueRef = useRef<number>(0)

  const handleScoreUpdate = useCallback(async (newScore: number, force: boolean = false) => {
    if (!activeGamePin || !supabase || !currentUser?.id) return

    const sanitizedScore = Math.floor(newScore)
    setGameScore(sanitizedScore)

    // Update local livePlayers state immediately for the current player
    // to provide instant feedback in rankings overlay
    setLivePlayers(prev =>
      prev.map(p => String(p.id) === String(currentUser.id) ? { ...p, score: sanitizedScore } : p)
    )

    // Throttle RPC calls to max once every 2 seconds UNLESS forced
    const now = Date.now()
    if (!force && now - lastScoreSyncRef.current < 2000) {
      lastScoreValueRef.current = sanitizedScore
      return
    }

    lastScoreSyncRef.current = now
    lastScoreValueRef.current = sanitizedScore

    // For debugging, only on first few updates
    if (sanitizedScore > 0 && lastScoreValueRef.current === 0) {
      console.log("[v0] Score Update Triggered:", { sanitizedScore, activeGamePin, userId: currentUser.id, username: currentUser.username })
    }

    try {
      const { error } = await supabase.rpc("update_game_score", {
        p_pin: activeGamePin,
        p_player_id: String(currentUser.id),
        p_player_username: currentUser.username,
        p_score: sanitizedScore
      })
      if (error) {
        console.error("Score sync error:", error)
        // If it's a critical final sync and it fails, alert for debugging
        if (force) {
          console.warn("Final score sync failed. Check database permissions.")
        }
      }
    } catch (err) {
      console.error("Score sync exception:", err)
    }
  }, [activeGamePin, supabase, currentUser?.id])

  // Periodic fallback to ensure the throttled final score is sent
  useEffect(() => {
    if (!isMergingGameActive && !lobbyActive) return

    const interval = setInterval(() => {
      const now = Date.now()
      // If no sync in 4s and we have a pending value
      if (now - lastScoreSyncRef.current >= 4000 && lastScoreValueRef.current !== 0) {
        handleScoreUpdate(lastScoreValueRef.current, true)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isMergingGameActive, lobbyActive, showGameResults, activeGamePin, supabase, handleScoreUpdate])

  // Update timeNow dynamically for countdowns in the Fusion Lab
  useEffect(() => {
    if (currentPage !== "fusion") return
    const interval = setInterval(() => {
      setTimeNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [currentPage])

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
          router.push(`/banned?reason=${encodeURIComponent(parsedUser.banReason || "")}`)
          return
        }
        setCurrentUser(parsedUser)
        setCurrentView("game")
      }

      const storedAuctions = localStorage.getItem("boomkit_auctions")
      if (storedAuctions) setAuctionItems(JSON.parse(storedAuctions))

      const storedChat = localStorage.getItem("boomkit_chat_messages")
      if (storedChat) setChatMessages(JSON.parse(storedChat))

      const storedAiSets = localStorage.getItem("boomkit_ai_sets")
      if (storedAiSets) setDiscoveredSets(JSON.parse(storedAiSets))

      setIsStorageLoaded(true) // Signal that storage is loaded
    }
  }, [])

  // Reusable function to fetch users from Supabase
  const fetchUsersFromSupabase = useCallback(async (refreshCurrentUser = false) => {
    if (!supabase) return

    try {
      // 1. Fetch rentals first so we have them for virtual inventory
      const { data: rentalsData, error: rentalsErr } = await supabase
        .from("boom_rentals")
        .select("*")
        .in("status", ["available", "rented"])
        .order("created_at", { ascending: false })
      
      const currentRentals = rentalsData || []
      setRentalListings(currentRentals)

      if (rentalsErr) {
        console.error("[v0] Error fetching rentals:", rentalsErr.message)
      }

      // Only select safe fields; never expose password_hash, last_ip, or email to clients.
      const safeColumns = "id, username, age, tokens, daily_tokens, packs, booms, is_owner, is_banned, is_muted, status, reason, role, join_date, boom_score, total_value, profile_picture, is_plus_user, name_color, banner_color, last_daily_spin, badges, mute_expiry, ban_expiry, last_seen, packs_opened, xp, level, login_streak, last_streak_claim, pinned_boom, season_xp, has_plus_pass, games_played, total_tokens_earned, clan_id, clan_role, clan_tag, clan_tag_color, fusion_cooldown_ends_at, consecutive_fusions, last_fusion_claim_time, active_fusion_boom1, active_fusion_boom2, active_fusion_ends_at, active_fusion_started_at"
      const { data, error } = await supabase.from("users").select(safeColumns)

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
          muteExpiry: u.mute_expiry || null,
          banExpiry: u.ban_expiry || null,
          banReason: u.ban_reason || "",
          lastSeen: u.last_seen || Date.now(),
          packsOpened: u.packs_opened || 0,
          lastIp: u.last_ip || "",
          xp: u.xp || 0,
          level: u.level || 1,
          pinned_boom: u.pinned_boom || null,
          loginStreak: u.login_streak || 0,
          lastStreakClaim: u.last_streak_claim || null,
          season_xp: u.season_xp || 0,
          has_plus_pass: u.has_plus_pass || false,
          games_played: u.games_played || 0,
          total_tokens_earned: u.total_tokens_earned || 0,
          clan_id: u.clan_id || null,
          clan_role: u.clan_role || null,
          clan_tag: u.clan_tag || null,
          clan_tag_color: u.clan_tag_color || null,
          fusion_cooldown_ends_at: u.fusion_cooldown_ends_at || null,
          consecutive_fusions: u.consecutive_fusions || 0,
          last_fusion_claim_time: u.last_fusion_claim_time || null,
          active_fusion_boom1: u.active_fusion_boom1 || null,
          active_fusion_boom2: u.active_fusion_boom2 || null,
          active_fusion_ends_at: u.active_fusion_ends_at || null,
          active_fusion_started_at: u.active_fusion_started_at || null,
        }))

        setUsers(mappedUsers)
        localStorage.setItem("boomkit_approved_users", JSON.stringify(mappedUsers))
        console.log("[v0] Loaded", mappedUsers.length, "users from Supabase")

        if (refreshCurrentUser && currentUser) {
          const self = mappedUsers.find(u => u.id === currentUser.id)
          if (self) {
            // Clean up pinned_boom if no longer owned or rented
            if (self.pinned_boom) {
              const myActiveRentals = currentRentals.filter(
                (r: any) => r.renter_username === self.username && r.status === "rented"
              )
              const hasPinnedBoom = (self.booms[self.pinned_boom] || 0) > 0 || myActiveRentals.some((r: any) => r.boom_name === self.pinned_boom)
              
              if (!hasPinnedBoom) {
                console.log(`[v0] Pinned boom ${self.pinned_boom} is no longer owned or rented. Unpinning.`)
                self.pinned_boom = undefined
                await supabase.from("users").update({ pinned_boom: null }).eq("id", self.id)
              }
            }
            setCurrentUser(self)
            localStorage.setItem("boomkit_current_user", JSON.stringify(self))
          }
        }
      }
    } catch (err) {
      console.error("[v0] Failed to fetch users from Supabase:", err)
    }
  }, [supabase, currentUser?.id])

  // NEW: Session validation to handle sync issues and prevent LocalStorage spoofing
  useEffect(() => {
    const validateSession = async () => {
      // Don't validate if we haven't even tried to load storage yet
      if (!isStorageLoaded) return

      try {
        const res = await fetch('/api/auth/verify')
        const data = await res.json()

        if (!data.authenticated) {
          // If client thinks they are logged in but server has no session
          if (currentUser) {
            console.log("[v0] Session lost, expired, or manipulated. Logging out.")
            handleLogout()
          }
        } else if (data.authenticated && data.user) {
          // Compare crucial security fields stored locally with the server truth.
          // If they differ (User tampered with LocalStorage), aggressively overwrite.

          if (currentUser) {
            const needsOverride =
              data.user.id !== currentUser.id ||
              data.user.role !== currentUser.role ||
              data.user.is_owner !== currentUser.isOwner ||
              data.user.tokens !== currentUser.tokens ||
              data.user.is_banned !== currentUser.isBanned;

            if (needsOverride) {
              console.warn("[v0] LocalStorage tampering detected or severe desync. Overwriting with server truth.")

              const authoritativeUser: GameUser = {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                age: data.user.age || 18,
                tokens: data.user.tokens || 0,
                dailyTokens: data.user.daily_tokens || 0,
                packs: data.user.packs || [],
                booms: data.user.booms || {},
                isOwner: data.user.is_owner || false,
                isBanned: data.user.is_banned || false,
                isMuted: data.user.is_muted || false,
                status: data.user.status || "pending",
                reason: data.user.reason || "",
                role: data.user.role || "player",
                joinDate: data.user.join_date || new Date().toISOString(),
                boomScore: data.user.boom_score || 0,
                totalValue: data.user.total_value || 0,
                profilePicture: data.user.profile_picture || "🎯",
                isPlusUser: data.user.is_plus_user || false,
                nameColor: data.user.name_color || "",
                bannerColor: data.user.banner_color || "",
                lastDailySpin: data.user.last_daily_spin || null,
                badges: data.user.badges || [],
                muteExpiry: data.user.mute_expiry || null,
                banExpiry: data.user.ban_expiry || null,
                banReason: data.user.ban_reason || "",
                lastSeen: data.user.last_seen || Date.now(),
                packsOpened: data.user.packs_opened || 0,
                xp: data.user.xp || 0,
                level: data.user.level || 1,
                pinned_boom: data.user.pinned_boom || null,
                season_xp: data.user.season_xp || 0,
                has_plus_pass: data.user.has_plus_pass || false,
                games_played: data.user.games_played || 0,
                total_tokens_earned: data.user.total_tokens_earned || 0,
                loginStreak: data.user.login_streak || 0,
                lastStreakClaim: data.user.last_streak_claim || null,
                clan_id: data.user.clan_id || null,
                clan_role: data.user.clan_role || null,
                clan_tag: data.user.clan_tag || null,
                clan_tag_color: data.user.clan_tag_color || null,
                fusion_cooldown_ends_at: data.user.fusion_cooldown_ends_at || null,
                consecutive_fusions: data.user.consecutive_fusions || 0,
                last_fusion_claim_time: data.user.last_fusion_claim_time || null,
                active_fusion_boom1: data.user.active_fusion_boom1 || null,
                active_fusion_boom2: data.user.active_fusion_boom2 || null,
                active_fusion_ends_at: data.user.active_fusion_ends_at || null,
                active_fusion_started_at: data.user.active_fusion_started_at || null,
              }

              if (authoritativeUser.isBanned) {
                router.push(`/banned?reason=${encodeURIComponent(authoritativeUser.banReason || "")}`)
              } else {
                setCurrentUser(authoritativeUser)
                localStorage.setItem("boomkit_current_user", JSON.stringify(authoritativeUser))
              }
            }
          }
        }
      } catch (err) {
        console.error("[v0] Failed to validate session:", err)
      }
    }

    if (isStorageLoaded && !(window as any).sessionValidated) {
      validateSession()
        ; (window as any).sessionValidated = true

      // Also run validation periodically to ensure manipulation doesn't work long-term
      const interval = setInterval(validateSession, 30000)
      return () => clearInterval(interval)
    }
  }, [isStorageLoaded, currentUser, handleLogout, router])

  // Load users from Supabase on mount
  useEffect(() => {
    if (supabase) {
      fetchUsersFromSupabase(true)
      fetchCraftRecipes()
    }
  }, [supabase, fetchUsersFromSupabase])

  const fetchCraftRecipes = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("craft_recipes").select("*")
      if (error) throw error
      if (data) setCraftRecipes(data)
    } catch (e) {
      console.error("Failed to fetch craft recipes:", e)
    }
  }

  // Find the

  const syncCurrentUserRole = useCallback(async () => {
    if (!currentUser?.id || !supabase) return

    try {
      const { data, error } = await supabase
        .from("users")
        .select("role, badges, is_muted, is_banned, is_owner, mute_expiry, ban_expiry, status, ban_reason")
        .eq("id", currentUser.id)
        .single()

      if (error) {
        // If user not found (account deleted), log them out immediately
        if (error.code === 'PGRST116' || error.message.includes('0 rows') || error.message.includes('No rows')) {
          console.log("[v0] User account deleted (banned), logging out immediately")
          localStorage.removeItem("boomkit_current_user")
          setCurrentUser(null)
          router.push("/banned?reason=Your account has been removed")
          return
        }
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
          router.push(`/banned?reason=${encodeURIComponent(data.ban_reason || "")}`)
          return
        }
        updateAndPersistCurrentUser(updatedUser)
      }
    } catch (err) {
      console.log("[v0] Error in role sync:", err)
    }
  }, [currentUser, supabase, router, updateAndPersistCurrentUser])

  useEffect(() => {
    // Sync immediately on mount
    syncCurrentUserRole()

    // Real-time listener for current user's data (inventory, tokens, etc.)
    let channel: any = null
    if (currentUser?.id && supabase) {
      console.log("[v0] Subscribing to user profile updates:", currentUser.id)
      channel = supabase
        .channel(`user_profile_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${currentUser.id}`
          },
          (payload: any) => {
            console.log("[v0] Profile changed in DB, syncing state:", payload.new)
            const u = payload.new
            const updatedUser: GameUser = {
              ...currentUser,
              tokens: u.tokens ?? currentUser.tokens,
              dailyTokens: u.daily_tokens ?? currentUser.dailyTokens,
              booms: u.booms ?? currentUser.booms,
              role: u.role ?? currentUser.role,
              badges: u.badges ?? currentUser.badges,
              isMuted: u.is_muted ?? currentUser.isMuted,
              isBanned: u.is_banned ?? currentUser.isBanned,
              status: u.status ?? currentUser.status,
              xp: u.xp ?? currentUser.xp,
              level: u.level ?? currentUser.level,
              clan_id: u.clan_id ?? currentUser.clan_id,
              clan_role: u.clan_role ?? currentUser.clan_role,
              clan_tag: u.clan_tag ?? currentUser.clan_tag,
              clan_tag_color: u.clan_tag_color ?? currentUser.clan_tag_color,
            }
            setCurrentUser(updatedUser)
            localStorage.setItem("boomkit_current_user", JSON.stringify(updatedUser))
          }
        )
        .subscribe()
    }

    // The Realtime listener above already handles updates.
    // Removed the 15-second polling fallback to fix battery and DB drain.

    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [syncCurrentUserRole, currentUser?.id, supabase])

  // Real-time listener for clan chat messages & auto-details loading
  useEffect(() => {
    if (!supabase || !currentUser?.clan_id) {
      setClanChat([])
      setClanDetails(null)
      return
    }

    const clanId = currentUser.clan_id

    // Fetch initial chat and clan details
    fetchClanChat(clanId)
    fetchClanDetails(clanId)

    // Subscribe to new chat messages
    const channel = supabase
      .channel(`clan_chat_${clanId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clan_chat_messages',
          filter: `clan_id=eq.${clanId}`
        },
        (payload: any) => {
          setClanChat((prev) => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          // Auto-refresh clan details on new message to sync XP/balances/etc in real time
          fetchClanDetails(clanId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.clan_id, supabase])

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
  }, []) // Removed [currentUser] to avoid re-registering and potential loops

  // Initialize system signature on component mount
  useEffect(() => {
    const signature = generateSystemSignature()
    setSystemSignature(signature)
  }, [])

  // --- GAME SESSION REALTIME SUBSCRIPTION (Host & Joiners) ---
  useEffect(() => {
    if (!activeGamePin || !supabase || (!isMergingGameActive && !lobbyActive && !showGameResults)) return

    console.log("[v0] Subscribing to game session:", activeGamePin)

    const channel = supabase
      .channel(`game_session_${activeGamePin}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `pin=eq.${activeGamePin}`,
        },
        (payload) => {
          console.log("[v0] Session Update Received:", payload)
          const newSession = payload.new as any

          if (newSession.players) {
            console.log("[v0] Syncing livePlayers from DB:", newSession.players.length, "players")
            setLivePlayers(newSession.players)
          }

          if (newSession.status && newSession.status.startsWith("started")) {
            // Sync game clock
            if (newSession.status.includes(":")) {
              const ts = parseInt(newSession.status.split(":")[1])
              if (!isNaN(ts)) {
                const offset = Math.floor((Date.now() - ts) / 1000)
                setGameStartOffset(offset)
              }
            }

            // JOINER: Transition to game screen if not already there
            if (activeDiscoverGame?.mode === "join" && !isMergingGameActive && !showGameResults) {
              setLobbyActive(false)
              setIsMergingGameActive(true)
            }
          }

          if (newSession.status === "finished") {
            // Final fetch to ensure total sync
            supabase.from("game_sessions")
              .select("players")
              .eq("pin", activeGamePin)
              .single()
              .then(({ data }) => {
                if (data?.players) setLivePlayers(data.players)
              })

            if (activeDiscoverGame?.mode === "join") {
              setIsMergingGameActive(false)
              setShowGameResults(true)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGamePin, isMergingGameActive, lobbyActive, showGameResults, activeDiscoverGame, supabase])

  // Domain-specific behavior for boomkit.org
  useEffect(() => {
    if (typeof window !== "undefined" && isStorageLoaded) {
      const hostname = window.location.hostname
      // Check if we are on the owner domain
      if (hostname.includes("boomkit.org")) {
        // If user is logged in, we let the default flow handle it (it will go to 'game')
        if (!currentUser) {
          // If NOT logged in, check if system is authorized
          if (isAuthorizedSystem()) {
            // System is authorized, but user not logged in -> Go to Login
            // We only modify if we are currently defaulting to owner-access
            if (currentView === "owner-access") {
              setCurrentView("login")
            }
          } else {
            // Not authorized.
            // Allow 'login' and 'register' views so valid users can authenticate
            if (currentView !== "login" && currentView !== "register") {
              setCurrentView("owner-access")
            }
          }
        }
      }
    }
  }, [currentUser, currentView, isStorageLoaded])

  // Check if user is owner
  const isOwner = () => {
    return currentUser?.isOwner || false
  }



  // XP and Leveling System
  const awardXP = (amount: number) => {
    if (!currentUser) return

    let currentXP = currentUser.xp || 0
    let currentLevel = currentUser.level || 1
    let totalXP = currentXP + amount
    let newLevel = currentLevel
    let leveledUp = false
    const levelsGained: number[] = []

    // Calculate new level correctly with dynamic requirement: Level * 100
    while (totalXP >= newLevel * 100) {
      totalXP -= (newLevel * 100)
      newLevel++
      leveledUp = true
      levelsGained.push(newLevel)
    }

    let newXP = totalXP

    // Cap at level 100
    if (newLevel >= 100) {
      newLevel = 100
      newXP = 0
    }

    let updatedBooms = { ...currentUser.booms }

    if (leveledUp) {
      alert(`🎉 LEVEL UP! You are now Level ${newLevel}!`)

      for (const level of levelsGained) {
        const milestone = GAMEPASS_BOOMS.find(gb => gb.level === level)
        if (milestone) {
          let rewardName = ""
          if (milestone.isLimited) {
            rewardName = "The Trophy"
            alert(`🏆 CONGRATULATIONS! You reached Level 70 and unlocked THE TROPHY! 🏆\nYou have unlocked the Limited Section!`)
          } else {
            // Pick a random boom of that rarity
            const pool = PACKS.flatMap(p => p.booms).filter(b => b.rarity === milestone.rarity)
            if (pool.length > 0) {
              const randomBoom = pool[Math.floor(Math.random() * pool.length)]
              rewardName = randomBoom.name
              alert(`🎁 Level ${level} Milestone! You unlocked a random ${milestone.rarity} Boom: ${rewardName}!`)
            }
          }

          if (rewardName) {
            updatedBooms[rewardName] = (updatedBooms[rewardName] || 0) + 1
          }
        }
      }
    }

    const updatedUser = {
      ...currentUser,
      xp: newXP,
      level: newLevel,
      booms: updatedBooms,
      boomScore: (currentUser.boomScore || 0) + (amount * 10) // Small boost to score too
    }
    updateAndPersistCurrentUser(updatedUser)
  }

  // Grant HadiGidek Max XP (One-time check)
  useEffect(() => {
    if (currentUser && currentUser.username === "HadiGidek" && (currentUser.level || 1) < 100) {
      console.log("Maxing out XP for HadiGidek...")
      const updatedUser = {
        ...currentUser,
        xp: 100,
        level: 100
      }
      updateAndPersistCurrentUser(updatedUser)
    }
  }, [currentUser])

  // Check if user can spin today
  useEffect(() => {
    if (currentUser) {
      const today = new Date().toDateString()
      setCanSpin(currentUser.lastDailySpin !== today)
    }
  }, [currentUser])

  // NEW: Auto-grant Gamepass Booms based on level
  useEffect(() => {
    if (!currentUser) return

    let hasNewUnlocks = false
    const updatedBooms = { ...currentUser.booms }
    const newUnlocks: string[] = []

    GAMEPASS_BOOMS.forEach((boom) => {
      // Check if user has required level
      if ((currentUser.level || 1) >= boom.level) {
        // Check if user already has this boom
        if (!updatedBooms[boom.name]) {
          updatedBooms[boom.name] = 1
          hasNewUnlocks = true
          newUnlocks.push(boom.name)
        }
      }
    })

    if (hasNewUnlocks) {
      console.log("Granting missing Gamepass Booms:", newUnlocks)
      const updatedUser = {
        ...currentUser,
        booms: updatedBooms,
      }
      updateAndPersistCurrentUser(updatedUser)
      alert(`🎁 You've recovered missing Gamepass rewards: ${newUnlocks.join(", ")}`)
    }
  }, [currentUser?.level, currentUser?.booms]) // Re-run when level or inventory changes


  // Handle daily spin
  // handleDailySpin removed - logic moved to DailySpinWheel component and its onWin callback

  const parseApiResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      return response.json()
    }

    const text = await response.text()
    return {
      success: false,
      message: text || `Request failed with status ${response.status}`,
    }
  }

  // Handle registration - SERVER-SIDE AUTHENTICATION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerForm.username || !registerForm.password || !registerForm.age) {
      alert("Please fill in all required fields")
      return
    }

    if (registerForm.password.length < 8) {
      alert("Password must be at least 8 characters")
      return
    }

    if (Number.parseInt(registerForm.age) < 10) {
      alert("You must be at least 10 years old to register")
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

      const data = await parseApiResponse(response)

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
        xp: user.xp || 0,
        level: user.level || 1,
        pinned_boom: user.pinned_boom || null,
        season_xp: user.season_xp || 0,
        has_plus_pass: user.has_plus_pass || false,
        games_played: user.games_played || 0,
        total_tokens_earned: user.total_tokens_earned || 0,
        loginStreak: user.login_streak || 0,
        lastStreakClaim: user.last_streak_claim || null,
        clan_id: user.clan_id || null,
        clan_role: user.clan_role || null,
        clan_tag: user.clan_tag || null,
        clan_tag_color: user.clan_tag_color || null,
      }

      if (newUser.status === "pending") {
        alert("Registration successful! Your application is pending staff approval. Please wait for an admin to review your request.")
        setCurrentView("owner-access") // Return to start screen
        return
      }

      updateAndPersistCurrentUser(newUser)
      setCurrentView("game")
      setShowV2NewsModal(true)
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

      const data = await parseApiResponse(response)

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
        xp: user.xp || 0,
        level: user.level || 1,
        pinned_boom: user.pinned_boom || null,
        season_xp: user.season_xp || 0,
        has_plus_pass: user.has_plus_pass || false,
        games_played: user.games_played || 0,
        total_tokens_earned: user.total_tokens_earned || 0,
        loginStreak: user.login_streak || 0,
        lastStreakClaim: user.last_streak_claim || null,
        clan_id: user.clan_id || null,
        clan_role: user.clan_role || null,
        clan_tag: user.clan_tag || null,
        clan_tag_color: user.clan_tag_color || null,
      }

      // Check if user is banned (double-check from server response)
      if (foundUser.isBanned) {
        router.push(`/banned?reason=${encodeURIComponent(foundUser.banReason || "")}`)
        return
      }

      // Check if user is pending approval
      if (foundUser.status === "pending") {
        alert("Your application is still pending approval. Please check back later.")
        return
      }

      updateAndPersistCurrentUser(foundUser)
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
    setSellQuantity(1)
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

  // Handle selling booms
  const handleConfirmSell = () => {
    if (!currentUser || !selectedBoom) return



    const boomName = selectedBoom
    const quantityToSell = Math.min(sellQuantity, currentUser.booms[boomName] || 0)

    if (quantityToSell <= 0) {
      alert("Invalid quantity to sell!")
      return
    }

    const sellPrice = getBoomSellPrice(boomName)
    const totalTokens = sellPrice * quantityToSell
    const totalValueLost = getBoomValue(boomName) * quantityToSell
    const totalScoreLost = getBoomScoreValue(boomName) * quantityToSell

    const updatedBooms = { ...currentUser.booms }

    if (updatedBooms[boomName] > quantityToSell) {
      updatedBooms[boomName] -= quantityToSell
    } else {
      delete updatedBooms[boomName]
    }

    const updatedUser = {
      ...currentUser,
      booms: updatedBooms,
      tokens: currentUser.tokens + totalTokens,
      totalValue: currentUser.totalValue - totalValueLost,
      boomScore: currentUser.boomScore - totalScoreLost,
    }

    updateAndPersistCurrentUser(updatedUser)

    setShowBoomAction(false)
    setSelectedBoom(null)
    setSellQuantity(1)
    alert(`Sold ${quantityToSell} ${boomName}(s) for ${totalTokens} tokens!`)
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
          seller_username: currentUser.username,
          seller: currentUser.id,
          current_bid: startingBid,
          ends_at: endsAt,
          status: "active",
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
    updateAndPersistUsers(updatedUsers, userToModerate.id)
    setShowMuteDialog(false)
    setUserToModerate(null)
  }

  const handleGenerateAiSet = async () => {
    if (!aiSetPrompt || isGeneratingSet) return
    setIsGeneratingSet(true)
    try {
      const response = await fetch("/api/generate-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiSetPrompt,
          grade: aiGrade,
          subject: aiSubject,
          count: aiQuestionCount
        })
      })
      const data = await response.json()
      if (data.questions) {
        // Add more metadata for persistence
        const newSet = {
          ...data,
          id: data.id || Math.random().toString(36).substr(2, 9),
          creator_id: currentUser?.id,
          is_public: aiIsPublic,
          created_at: new Date().toISOString(),
          questions: data.questions
        }

        setDiscoveredSets(prev => [newSet, ...prev])

        // Persist to Supabase if possible
        if (supabase && currentUser) {
          supabase.from("custom_sets").insert({
            creator_id: currentUser.id,
            title: newSet.title,
            description: newSet.description || "",
            grade: aiGrade,
            subject: aiSubject,
            questions: data.questions,
            is_public: aiIsPublic
          }).then(({ error }) => {
            if (error) console.error("Error saving custom set to DB:", error)
            else console.log("Saved custom set to database successfully")
          })
        }

        // Cache this set in local storage
        const cachedSets = JSON.parse(localStorage.getItem("boomkit_ai_sets") || "[]")
        localStorage.setItem("boomkit_ai_sets", JSON.stringify([newSet, ...cachedSets]))
        setShowAiSetCreator(false)
        setAiSetPrompt("")

        if (data.isQuotaError) {
          alert(`Set "${data.title}" generated using relevant fallback questions because the AI is busy. Please wait about ${data.retryAfter || 60} seconds before trying to use the AI again.`)
        } else if (data.fallback) {
          alert(`Set "${data.title}" generated using fallback questions. Note: ${data.description}`)
        } else {
          alert(`Set "${data.title}" generated successfully with AI!`)
        }
      } else {
        alert("Failed to generate set. Please try a different prompt.")
      }
    } catch (err) {
      console.error(err)
      alert("Error generating set.")
    } finally {
      setIsGeneratingSet(false)
    }
  }

  const awardBoomXP = async (amount: number) => {
    if (!currentUser?.pinned_boom || !supabase) return

    try {
      const boomName = currentUser.pinned_boom
      // 1. Fetch or initialize the evolution record
      const { data: evolution, error: fetchError } = await supabase
        .from('user_boom_evolution')
        .select('id, username, boom_name, xp, level, is_fully_evolved, created_at')
        .eq('username', currentUser.username)
        .eq('boom_name', boomName)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'no rows found'
        console.error('Error fetching boom evolution:', fetchError)
        return
      }

      let newXP = amount
      let newLevel = 1
      let isFullyEvolved = false

      if (evolution) {
        newXP = evolution.xp + amount
        newLevel = evolution.level
        isFullyEvolved = evolution.is_fully_evolved

        // Level up logic (Example: 500 XP per level)
        const xpRequired = newLevel * 500
        if (newXP >= xpRequired && !isFullyEvolved) {
          newXP -= xpRequired
          newLevel += 1
          if (newLevel >= 10) isFullyEvolved = true // Max evolution at level 10
        }
      }

      // 2. Upsert the record
      const { error: upsertError } = await supabase
        .from('user_boom_evolution')
        .upsert({
          username: currentUser.username,
          boom_name: boomName,
          xp: newXP,
          level: newLevel,
          is_fully_evolved: isFullyEvolved
        }, { onConflict: 'username,boom_name' })

      if (upsertError) {
        console.error('Error updating boom evolution:', upsertError)
      } else {
        // Achievement check for Evolution
        if (newLevel > 1) {
          supabase.rpc('check_achievements', {
            p_username: currentUser.username,
            p_type: 'evolved_count',
            p_value: 1
          })
        }
      }
    } catch (err) {
      console.error('Failed to award boom XP:', err)
    }
  }

  const fetchQuestionsWithAi = async (grade: number, subjectStr: string, count: number = 30) => {
    let subject = subjectStr
    let topic = "General"

    try {
      // Split "Subject: Topic" if present
      if (subjectStr.includes(": ")) {
        const parts = subjectStr.split(": ")
        subject = parts[0]
        topic = parts[1]
      }

      // 1. Try to fetch from the global question_bank first
      if (supabase) {
        const { data: bankQuestions, error: bankError } = await supabase
          .from("question_bank")
          .select("*")
          .eq("grade", grade)
          .eq("subject", subject)
          .eq("topic", topic)
          .limit(500)

        if (!bankError && bankQuestions && bankQuestions.length >= 10) {
          console.log(`Pulled ${bankQuestions.length} questions from Global Bank for ${subject}: ${topic}`)
          // Shuffle and take requested count
          const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5).slice(0, count)

          return shuffled.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correct_index
          }))
        }
      }

      // 2. Fallback to AI if not enough in bank
      console.log(`Not enough questions in bank for ${subject}: ${topic}, calling AI...`)
      const response = await fetch("/api/generate-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: topic === "General" ? subject : topic,
          grade,
          subject,
          count
        })
      })

      if (response.status === 429) {
        console.warn("[AI API] Rate limit hit, using fallback questions")
        return getFallbackQuestions(grade, subject, count, topic === "General" ? subject : topic)
      }

      const data = await response.json()
      const questions = data.questions || []

      // 3. Cache AI results into the global bank (asynchronously)
      if (supabase && questions.length > 0) {
        const questionsToBank = questions.map((q: any) => ({
          grade,
          subject: (subject as any),
          topic: (topic as any),
          question: q.question,
          options: q.options,
          correct_index: q.correctIndex
        }))

        supabase.from("question_bank").insert(questionsToBank).then(({ error }) => {
          if (error) console.error("Error saving to global bank:", error)
          else console.log(`Cached ${questionsToBank.length} new questions to Global Bank for ${subject}: ${topic}`)
        })
      }

      return questions.length > 0 ? questions : getFallbackQuestions(grade, subject, count, topic === "General" ? subject : topic)
    } catch (err) {
      console.error("Error fetching AI questions:", err)
      return getFallbackQuestions(grade, subject, count, topic === "General" ? subject : topic)
    }
  }

  // Confirm ban action
  const handleConfirmBan = async () => {
    if (!userToModerate || !supabase) return

    try {
      // 2. Direct Supabase Update (Redundancy fix)
      // We try to update directly first. If RLS allows (owner/admin), this is faster and more reliable.
      const { error: directError } = await supabase
        .from("users")
        .update({
          is_banned: true,
          ban_reason: banReason || "Banned by staff",
          ban_expiry: null
        })
        .eq("id", userToModerate.id)

      if (directError) {
        console.warn("Direct Supabase ban update failed (likely RLS), falling back to API:", directError)
      } else {
        console.log("Direct Supabase ban update successful")
      }

      // 3. Update the user via Secure API (since RLS prevents direct updates to other users)
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userToModerate.id,
          updates: {
            is_banned: true,
            ban_reason: banReason || "Banned by staff",
            ban_expiry: null // Permanent ban
          }
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to ban user via API")
      }

      // 3. Update local state
      const updatedUsers = users.map((u) => {
        if (u.id === userToModerate.id) {
          return { ...u, isBanned: true, banReason: banReason || "Banned by staff" }
        }
        return u
      })
      setUsers(updatedUsers)
      localStorage.setItem("boomkit_approved_users", JSON.stringify(updatedUsers))

      // 4. If the banned user is the current user, log them out
      if (currentUser?.id === userToModerate.id) {
        handleLogout()
        return
      }

      // 5. Close dialog and show success
      setShowBanDialog(false)
      setUserToModerate(null)
      setBanReason("")
      alert(`User ${userToModerate.username} has been banned successfully.`)
    } catch (err) {
      console.error("Error banning user:", err)
      alert("An error occurred while banning the user. Please try again.")
    }
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
    updateAndPersistUsers(updatedUsers, userId)
  }

  // Handle Application Approval
  const handleApproveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to approve this user?")) return

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: "approved" }
      }
      return u
    })

    // Optimistic update
    setUsers(updatedUsers)

    // Secure update via API (or direct DB update if using client inside component which we are)
    // We reuse updateAndPersistUsers which calls the API
    await updateAndPersistUsers(updatedUsers, userId)
    alert("User application approved!")
  }

  // Handle Application Rejection
  const handleRejectUser = async (userId: string) => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    // Rejection essentially bans them or just deletes them? 
    // Plan said "status: rejected". Let's stick to that.

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: "rejected", banReason: reason, isBanned: true }
      }
      return u
    })

    // Optimistic update
    setUsers(updatedUsers)

    await updateAndPersistUsers(updatedUsers, userId)
    alert("User application rejected.")
  }

  // -- Transfer Actions --
  const handleGiftTokens = async (receiverUsername: string, amount: number) => {
    if (!currentUser || !supabase || amount <= 0) return

    // Optimistic UI checks but actual check on server
    if (currentUser.tokens < amount) {
      alert("Not enough tokens to gift.");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('transfer_tokens', {
        p_sender_username: currentUser.username,
        p_receiver_username: receiverUsername,
        p_amount: amount
      })
      if (error) throw error
      alert(`🎉 Successfully gifted ${amount.toLocaleString()} tokens to ${receiverUsername}!`)

      // Log activity
      await supabase.rpc('log_user_activity', {
        p_username: currentUser.username,
        p_type: 'gift_tokens',
        p_desc: `Gifted ${amount.toLocaleString()} tokens to ${receiverUsername}`,
        p_details: { amount, receiver: receiverUsername }
      })

      fetchUsersFromSupabase(true) // Refresh user data to see updated balances
    } catch (e: any) {
      alert(e.message || "Gift failed")
    }
  }

  const handleGiftBoom = async (receiverUsername: string, boomName: string, amount: number) => {
    if (!currentUser || !supabase || amount <= 0) return

    const qty = currentUser.booms[boomName] || 0
    if (qty < amount) {
      alert(`You do not have enough ${boomName} to gift.`);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('transfer_boom', {
        p_sender_username: currentUser.username,
        p_receiver_username: receiverUsername,
        p_boom_name: boomName,
        p_amount: amount
      })
      if (error) throw error
      alert(`🎁 Successfully gifted ${amount}x ${boomName} to ${receiverUsername}!`)

      // Log activity
      await supabase.rpc('log_user_activity', {
        p_username: currentUser.username,
        p_type: 'gift_boom',
        p_desc: `Gifted ${amount}x ${boomName} to ${receiverUsername}`,
        p_details: { boom: boomName, amount, receiver: receiverUsername }
      })

      fetchUsersFromSupabase(true)
    } catch (e: any) {
      alert(e.message || "Gift failed")
    }
  }

  const handleCraftBoom = async (recipe: any) => {
    if (!currentUser || !supabase) return

    if (!confirm(`Craft ${recipe.output_boom} for ${recipe.token_cost} tokens?`)) return

    try {
      const { data, error } = await supabase.rpc('craft_boom', {
        p_player_username: currentUser.username,
        p_recipe_id: recipe.id
      })
      if (error) throw error
      alert(`✨ Successfully crafted ${recipe.output_boom}!`)
      fetchUsersFromSupabase(true)
    } catch (e: any) {
      alert(e.message || "Crafting failed")
    }
  }

  const handleClaimStreak = async () => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc('claim_daily_streak', {
        p_username: currentUser.username
      })
      if (error) throw error
      const result = data as any
      alert(`🔥 ${result.message}`)
      fetchUsersFromSupabase(true)
    } catch (e: any) {
      alert(e.message || "Failed to claim streak reward")
    }
  }

  const fetchFriends = async () => {
    if (!currentUser || !supabase) return
    try {
      const { data } = await supabase.from("friends")
        .select("*")
        .or(`user_username.eq.${currentUser.username},friend_username.eq.${currentUser.username}`)

      const accepted = (data || []).filter(f => f.status === 'accepted')
      const pending = (data || []).filter(f => f.status === 'pending' && f.friend_username === currentUser.username)
      setFriendsList(accepted)
      setFriendRequests(pending)
    } catch (e) {
      console.error("Failed to fetch friends:", e)
    }
  }

  const fetchClanDetails = async (clanId: string) => {
    if (!supabase) return
    try {
      // 1. Fetch clan info
      const { data: clanInfo, error: clanError } = await supabase
        .from("clans")
        .select("*")
        .eq("id", clanId)
        .single()
      
      if (clanError) throw clanError

      // 2. Fetch clan members
      const { data: membersList, error: membersError } = await supabase
        .from("users")
        .select("id, username, tokens, role, join_date, boom_score, total_value, profile_picture, is_plus_user, name_color, banner_color, clan_role, xp, level")
        .eq("clan_id", clanId)
        .order("clan_role", { ascending: false })

      if (membersError) throw membersError

      setClanDetails({
        ...clanInfo,
        members: membersList || []
      })
    } catch (e) {
      console.error("Failed to fetch clan details:", e)
    }
  }

  const fetchClansList = async () => {
    if (!supabase) return
    try {
      // Fetch all clans, along with member counts
      const { data: clans, error: clansError } = await supabase
        .from("clans")
        .select("*")
        .order("xp", { ascending: false })

      if (clansError) throw clansError

      // Fetch user counts per clan
      const { data: memberCounts, error: countError } = await supabase
        .from("users")
        .select("clan_id")
        .not("clan_id", "is", null)

      const countsMap: { [key: string]: number } = {}
      memberCounts?.forEach((u: any) => {
        countsMap[u.clan_id] = (countsMap[u.clan_id] || 0) + 1
      })

      const formattedClans = (clans || []).map((c: any) => ({
        ...c,
        memberCount: countsMap[c.id] || 0
      }))

      setClansList(formattedClans)
    } catch (e) {
      console.error("Failed to fetch clans list:", e)
    }
  }

  const fetchClanChat = async (clanId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("clan_chat_messages")
        .select("*")
        .eq("clan_id", clanId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error
      setClanChat(data || [])
    } catch (e) {
      console.error("Failed to fetch clan chat:", e)
    }
  }

  const sendClanChatMessage = async () => {
    if (!newClanMessage.trim() || !currentUser?.clan_id || !supabase) return
    try {
      const { error } = await supabase
        .from("clan_chat_messages")
        .insert({
          clan_id: currentUser.clan_id,
          username: currentUser.username,
          message: newClanMessage.trim()
        })

      if (error) throw error
      setNewClanMessage("")
    } catch (e: any) {
      toast.error(e.message || "Failed to send chat message")
    }
  }

  const handleCreateClan = async () => {
    if (!currentUser || !supabase) return
    const name = createClanForm.name.trim()
    const tag = createClanForm.tag.trim().toUpperCase()
    const desc = createClanForm.description.trim()
    
    if (!name || !tag) {
      toast.error("Clan Name and Tag are required.")
      return
    }

    if (tag.length < 3 || tag.length > 6) {
      toast.error("Clan Tag must be between 3 and 6 characters.")
      return
    }

    if (currentUser.tokens < 5000) {
      toast.error("You need at least 5,000 tokens to create a clan.")
      return
    }

    setIsCreatingClan(true)
    try {
      const { data, error } = await supabase.rpc("create_clan", {
        p_username: currentUser.username,
        p_clan_name: name,
        p_tag: tag,
        p_description: desc,
        p_logo: createClanForm.logo,
        p_tag_color: createClanForm.tagColor
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        // Refresh local user stats
        fetchUsersFromSupabase(true)
        // Reset form
        setCreateClanForm({
          name: "",
          tag: "",
          description: "",
          logo: "🛡️",
          tagColor: "text-purple-400",
          minTokens: 0,
          minRarity: "uncommon",
          minRarityCount: 0
        })
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to create clan")
    } finally {
      setIsCreatingClan(false)
    }
  }

  const handleJoinClan = async (clanId: string) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc("join_clan", {
        p_username: currentUser.username,
        p_clan_id: clanId
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        fetchUsersFromSupabase(true)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to join clan")
    }
  }

  const handleBuyClanUpgrade = async (type: string, color?: string) => {
    if (!currentUser || !supabase || !currentUser.clan_id) return
    try {
      const { data, error } = await supabase.rpc("buy_clan_upgrade", {
        p_username: currentUser.username,
        p_upgrade_type: type,
        p_color_value: color
      })

      if (error) throw error
      if (data.success) {
        toast.success(data.message)
        fetchClanDetails(currentUser.clan_id)
        fetchUsersFromSupabase(true)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Upgrade purchase failed")
    }
  }

  const handleLeaveClan = async () => {
    if (!currentUser || !supabase) return
    if (!confirm("Are you sure you want to leave your clan?")) return
    try {
      const { data, error } = await supabase.rpc("leave_clan", {
        p_username: currentUser.username
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        setClanDetails(null)
        setClanChat([])
        fetchUsersFromSupabase(true)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to leave clan")
    }
  }

  const handleDonateToClan = async (amount: number) => {
    if (!currentUser || !supabase || amount <= 0) return
    try {
      const { data, error } = await supabase.rpc("donate_to_clan", {
        p_username: currentUser.username,
        p_amount: amount
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        fetchUsersFromSupabase(true)
        if (currentUser.clan_id) fetchClanDetails(currentUser.clan_id)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to donate")
    }
  }

  const handleKickMember = async (targetUsername: string) => {
    if (!currentUser || !supabase) return
    if (!confirm(`Are you sure you want to kick ${targetUsername} from the clan?`)) return
    try {
      const { data, error } = await supabase.rpc("kick_from_clan", {
        p_username: currentUser.username,
        p_target_username: targetUsername
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        if (currentUser.clan_id) fetchClanDetails(currentUser.clan_id)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to kick member")
    }
  }

  const handleUpdateClanInfo = async (description: string, logo: string, tagColor: string, minTokens: number, minRarity: string, minRarityCount: number) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc("update_clan_info", {
        p_username: currentUser.username,
        p_description: description,
        p_logo: logo,
        p_tag_color: tagColor,
        p_min_tokens: minTokens,
        p_min_rarity: minRarity,
        p_min_rarity_count: minRarityCount
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        if (currentUser.clan_id) fetchClanDetails(currentUser.clan_id)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update clan settings")
    }
  }

  const handlePromoteMember = async (targetUsername: string, newRole: "co_leader" | "member") => {
    if (!currentUser || !supabase) return
    const roleText = newRole === "co_leader" ? "Promote" : "Demote"
    if (!confirm(`Are you sure you want to ${roleText.toLowerCase()} ${targetUsername}?`)) return
    try {
      const { data, error } = await supabase.rpc("update_clan_member_role", {
        p_username: currentUser.username,
        p_target_username: targetUsername,
        p_new_role: newRole
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        if (currentUser.clan_id) fetchClanDetails(currentUser.clan_id)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update role")
    }
  }

  const handleTransferLeadership = async (targetUsername: string) => {
    if (!currentUser || !supabase) return
    if (!confirm(`⚠️ WARNING: Are you sure you want to transfer clan leadership to ${targetUsername}? You will be demoted to a regular member.`)) return
    try {
      const { data, error } = await supabase.rpc("transfer_clan_leadership", {
        p_username: currentUser.username,
        p_target_username: targetUsername
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        if (currentUser.clan_id) fetchClanDetails(currentUser.clan_id)
      } else {
        toast.error(data.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to transfer leadership")
    }
  }

  const fetchSingleClanProfile = async (clanId: string) => {
    if (!supabase) return
    try {
      const { data: clanInfo, error: clanError } = await supabase
        .from("clans")
        .select("*")
        .eq("id", clanId)
        .single()
      
      if (clanError) throw clanError

      const { data: membersList, error: membersError } = await supabase
        .from("users")
        .select("username, clan_role, xp, level, profile_picture")
        .eq("clan_id", clanId)
        .order("clan_role", { ascending: false })

      if (membersError) throw membersError

      setShowClanProfileModal({
        ...clanInfo,
        members: membersList || []
      })
    } catch (e: any) {
      toast.error("Failed to load clan profile")
    }
  }

  const handleSendFriendRequest = async (toUsername: string) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_from: currentUser.username, p_to: toUsername
      })
      if (error) throw error
      alert(`✅ Friend request sent to ${toUsername}!`)
      fetchFriends()
    } catch (e: any) { alert(e.message || "Failed to send request") }
  }

  const handleAcceptFriend = async (fromUsername: string) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_username: currentUser.username, p_from: fromUsername
      })
      if (error) throw error
      alert(`🤝 You are now friends with ${fromUsername}!`)
      fetchFriends()
    } catch (e: any) { alert(e.message || "Failed to accept") }
  }

  const handleRemoveFriend = async (friendUsername: string) => {
    if (!currentUser || !supabase) return
    if (!confirm(`Remove ${friendUsername} from friends?`)) return
    try {
      const { data, error } = await supabase.rpc('remove_friend', {
        p_username: currentUser.username, p_friend: friendUsername
      })
      if (error) throw error
      alert(`Removed ${friendUsername}.`)
      fetchFriends()
    } catch (e: any) { alert(e.message || "Failed") }
  }



  const [tourneyTitle, setTourneyTitle] = useState("")
  const [tourneyDesc, setTourneyDesc] = useState("")
  const [tourneyEndTime, setTourneyEndTime] = useState("")
  const [tourneyPrizeTokens, setTourneyPrizeTokens] = useState(0)
  const [tourneyPrizeBoom, setTourneyPrizeBoom] = useState("")
  const [newSeasonName, setNewSeasonName] = useState("")

  const handleCreateTournament = async () => {
    if (!tourneyTitle || !tourneyEndTime || !supabase) {
      alert("Title and End Time are required!")
      return
    }

    try {
      const { error } = await supabase.rpc("create_tournament", {
        p_creator_id: currentUser!.id,
        p_title: tourneyTitle,
        p_description: tourneyDesc || null,
        p_end_time: new Date(tourneyEndTime).toISOString(),
        p_prize_tokens: tourneyPrizeTokens || 0,
        p_prize_boom_name: tourneyPrizeBoom || null
      })

      if (error) throw error

      alert("🏆 Tournament created successfully!")
      setTourneyTitle("")
      setTourneyDesc("")
      setTourneyEndTime("")
      setTourneyPrizeTokens(0)
      setTourneyPrizeBoom("")
      fetchTournaments()
    } catch (e: any) {
      alert(e.message || "Failed to create tournament")
    }
  }

  const handleFinalizeTournament = async (id: string) => {
    if (!supabase || !confirm("Are you sure you want to finalize this tournament and award prizes?")) return
    try {
      const { data, error } = await supabase.rpc("finalize_tournament", { p_tournament_id: id })
      if (error) throw error
      alert(`🎉 Tournament finalized! Result: ${data.message}`)
      fetchTournaments()
      fetchUsersFromSupabase(true)
    } catch (e: any) {
      alert(e.message || "Failed to finalize tournament")
    }
  }

  const handleStartNewSeason = async () => {
    if (!newSeasonName || !supabase) {
      alert("Season Name is required!")
      return
    }

    try {
      const { error } = await supabase.rpc("start_new_season", {
        p_creator_id: currentUser!.id,
        p_season_name: newSeasonName
      })

      if (error) throw error

      alert(`🔥 Season "${newSeasonName}" started successfully with standard rewards!`)
      setNewSeasonName("")
      fetchActiveSeason()
    } catch (e: any) {
      alert(e.message || "Failed to start new season")
    }
  }

  const fetchTournaments = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from("tournaments")
        .select("*")
        .order("start_time", { ascending: false })
      setActiveTournaments(data || [])
    } catch (e) { console.error(e) }
  }

  const fetchTournamentParticipants = async (tournamentId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("tournament_clans")
        .select(`
          id,
          tournament_id,
          clan_id,
          score,
          games_played,
          last_played,
          clans (
            name,
            tag,
            tag_color,
            logo,
            level
          )
        `)
        .eq("tournament_id", tournamentId)
        .order("score", { ascending: false })

      if (error) throw error
      setTournamentParticipants(data || [])
    } catch (e) { 
      console.error("Failed to fetch tournament participants:", e) 
    }
  }

  const handleJoinTournament = async (tournamentId: string) => {
    if (!currentUser || !supabase) return
    if (!currentUser.clan_id) {
      toast.error("You must join or create a Clan first to participate in tournaments!")
      return
    }
    try {
      const { data, error } = await supabase.rpc('join_tournament_clan', {
        p_tournament_id: tournamentId, p_username: currentUser.username
      })
      if (error) throw error
      if (data.success) {
        toast.success(data.message)
        fetchTournaments()
        if (selectedTournament) {
          fetchTournamentParticipants(selectedTournament.id)
        }
      } else {
        toast.error(data.message)
      }
    } catch (e: any) { 
      toast.error(e.message || "Failed to join tournament") 
    }
  }

  const fetchUserActivity = async (username: string) => {
    if (!supabase) return
    try {
      const { data } = await supabase.from("user_activity")
        .select("*")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(20)
      setUserActivity(data || [])
    } catch (e) { console.error(e) }
  }

  const fetchShopItems = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from("shop_items").select("*").eq("is_active", true)
      setShopItems(data || [])
    } catch (e) { console.error(e) }
  }

  const fetchAchievements = async () => {
    if (!supabase) return
    try {
      const { data: allAch } = await supabase.from("achievements").select("*")
      setAchievements(allAch || [])
      if (currentUser) {
        const { data: userAch } = await supabase.from("user_achievements")
          .select("achievement_id")
          .eq("username", currentUser.username)
        setUserAchievements(userAch?.map(a => a.achievement_id) || [])
      }
    } catch (e) { console.error(e) }
  }

  const fetchActiveSeason = async () => {
    if (!supabase) return
    try {
      const { data: season } = await supabase.from("seasons").select("*").eq("is_active", true).single()
      if (season) {
        setActiveSeason(season)
        const { data: rewards } = await supabase.from("season_rewards")
          .select("*")
          .eq("season_id", season.id)
          .order("tier", { ascending: true })
        setSeasonRewards(rewards || [])
      }
    } catch (e) { console.error(e) }
  }

  const handleBuyShopItem = async (itemId: string) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc('buy_shop_item', {
        p_username: currentUser.username, p_item_id: itemId
      })
      if (error) throw error
      alert(data.message || "Purchase successful!")
      fetchShopItems()
      fetchUsersFromSupabase(true)
      // Check for 'Vault Master' achievement (20 unique booms)
      const uniqueCount = Object.keys(currentUser.booms).length
      if (uniqueCount >= 20) {
        await supabase.rpc('check_achievements', { p_username: currentUser.username, p_type: 'booms_collected', p_value: uniqueCount })
      }
    } catch (e: any) { alert(e.message || "Purchase failed") }
  }

  const handleClaimReward = async (rewardId: string) => {
    if (!currentUser || !supabase) return
    try {
      const { data, error } = await supabase.rpc('claim_season_reward', {
        p_username: currentUser.username, p_reward_id: rewardId
      })
      if (error) throw error
      alert(data.message || "Reward claimed!")
      fetchUsersFromSupabase(true)
    } catch (e: any) { alert(e.message || "Claim failed") }
  }

  const handleAddSeasonXp = async (amount: number) => {
    if (!currentUser || !supabase) return
    try {
      const newXp = (currentUser.season_xp || 0) + amount
      const { error } = await supabase.from("users").update({ season_xp: newXp }).eq("username", currentUser.username)
      if (error) throw error
      fetchUsersFromSupabase(true)
    } catch (e) { console.error(e) }
  }

  // --- Profile Features ---

  // Open Public Player Profile
  const openPlayerProfile = (userOrId: GameUser | string) => {
    let userObj: GameUser | undefined

    if (typeof userOrId === "string") {
      userObj = users.find(u => u.id === userOrId || u.username === userOrId)
    } else {
      userObj = userOrId
    }

    if (userObj) {
      setSelectedProfileUser(userObj)
      setShowPlayerProfile(true)

      // Fetch evolution data for pinned boom if it exists
      if (userObj.pinned_boom) {
        supabase
          ?.from('user_boom_evolution')
          .select('id, username, boom_name, xp, level, is_fully_evolved, created_at')
          .eq('username', userObj.username)
          .eq('boom_name', userObj.pinned_boom)
          .single()
          .then(({ data }) => setSelectedProfileEvolution(data))
      } else {
        setSelectedProfileEvolution(null)
      }
      fetchUserActivity(userObj.username)
    }
  }

  const handleFusion = async () => {
    if (!fusionSlot1 || !fusionSlot2 || !currentUser || !supabase) return

    setIsFusing(true)
    try {
      const { data, error } = await supabase.rpc('fuse_booms', {
        p_username: currentUser.username,
        p_boom1: fusionSlot1,
        p_boom2: fusionSlot2
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
        setFusionSlot1(null)
        setFusionSlot2(null)
      } else {
        toast.error(data.message)
      }

      await fetchUsersFromSupabase(true) // Refresh inventory
    } catch (err: any) {
      toast.error(err.message || 'Fusion failed')
    } finally {
      setIsFusing(false)
    }
  }

  const handleClaimFusion = async () => {
    if (!currentUser || !supabase) return

    setIsFusing(true)
    try {
      const { data, error } = await supabase.rpc('claim_fusion_result', {
        p_username: currentUser.username
      })

      if (error) throw error

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }

      await fetchUsersFromSupabase(true) // Refresh inventory
    } catch (err: any) {
      toast.error(err.message || 'Claim failed')
    } finally {
      setIsFusing(false)
    }
  }

  // Pin Boom to Profile
  const pinBoomToProfile = async (boomName: string) => {
    if (!currentUser) return

    if (!confirm(`Do you want to pin ${boomName} to your showcase? It will be visible to everyone on your profile.`)) return

    const updatedUser = { ...currentUser, pinned_boom: boomName }

    // Optimistic update
    setCurrentUser(updatedUser)

    try {
      const { error } = await supabase!.from("users").update({ pinned_boom: boomName }).eq("id", currentUser.id)
      if (error) throw error
      alert(`Successfully pinned ${boomName}!`)
    } catch (err) {
      console.error("Error pinning boom:", err)
      alert("Failed to pin boom. Try again.")
      // Revert optimism
      setCurrentUser(currentUser)
    }
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
    updateAndPersistUsers(updatedUsers, userToEdit.id)

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

    // Call secure sync flow
    updateAndPersistUsers(updatedUsers, userId)
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
    updateAndPersistUsers(updatedUsers, targetUser.id)

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
    updateAndPersistUsers(updatedUsers, userId)

    if (currentUser?.id === userId) {
      updateAndPersistCurrentUser({ ...currentUser, badges: (currentUser.badges ?? []).filter((b) => b !== badgeId) })
    }
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
      case "admin":
        return "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
      case "senior_moderator":
        return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      case "moderator":
        return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
      case "tester":
        return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      case "player":
        return "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]"
      default:
        return "bg-gray-500"
    }
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
              The Ultimate Emoji Trading Arena
            </p>
            <p className="text-slate-400 text-lg md:text-xl max-w-md mx-auto md:mx-0">
              Collect rare emojis, dominate the market, and climb the ranks in the world's premier emoji-based trading experience.
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
              <div key={idx} className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-4xl shadow-lg border border-slate-700 hover:scale-110 transition-transform cursor-default select-none overflow-hidden" title={boom.name}>
                {boom.avatar.startsWith('/') ? (
                  <img src={boom.avatar || "/placeholder.svg"} alt={boom.name} className="w-full h-full object-cover" />
                ) : (
                  boom.avatar
                )}
              </div>
            ))}
          </div>

        </main>

        {/* Footer / Secret Access */}
        <footer className="p-4 text-center text-slate-600 text-sm">
          <p>&copy; 2026 Boomkit. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  if (currentView === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
          <CardHeader className="text-center relative overflow-hidden pb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 to-transparent" />
            <CardTitle className="text-4xl font-black text-white relative z-10 drop-shadow-md">
              Join Boomkit!
            </CardTitle>
            <CardDescription className="text-white/80 font-medium relative z-10">Start your adventure today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-0 relative z-10">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-bold tracking-wide ml-1">Username</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    id="username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative h-12"
                    placeholder="Choose a cool name..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-bold tracking-wide ml-1">Password</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    id="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative h-12"
                    placeholder="At least 8 characters..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="text-white font-bold tracking-wide ml-1">Age (Minimum 10)</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    id="age"
                    type="number"
                    min="10"
                    value={registerForm.age}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, age: e.target.value }))}
                    required
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative h-12"
                    placeholder="Enter your age"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-white font-bold tracking-wide ml-1">Application Reason</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <textarea
                    id="reason"
                    value={registerForm.reason}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative p-3 min-h-[80px] focus:outline-none focus:ring-0"
                    placeholder="Tell us why you want to join Boomkit..."
                    required
                  />
                </div>
              </div>

              {/* ToS Checkbox */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="tos"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-black/40 checked:bg-green-500 checked:border-green-500 transition-all"
                  />
                  <CheckIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <label htmlFor="tos" className="text-sm font-medium text-white/90 cursor-pointer select-none">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTosModal(true)}
                    className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 font-bold transition-colors"
                  >
                    Terms of Service
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                disabled={!tosAccepted}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                Let's Go! 🚀
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Button variant="link" className="text-white/60 hover:text-white" onClick={() => setCurrentView("login")}>
                Already have an account? Login
              </Button>
              <div className="w-full h-px bg-white/10" />
              <Button variant="link" className="text-white/40 hover:text-white/80 text-xs" onClick={() => setCurrentView("owner-access")}>
                Back to Main Menu
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ToS Modal */}
        {showTosModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-[#0a0a0c] border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileTextIcon className="w-6 h-6 text-purple-400" />
                  Terms of Service
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 text-white/80 leading-relaxed text-sm">
                <p><strong className="text-white">1. Respect Required:</strong> Treat all players with kindness. No bullying, hate speech, or harassment.</p>
                <p><strong className="text-white">2. No Cheating:</strong> Using bots, scripts, or unfair advantages will result in an immediate ban.</p>
                <p><strong className="text-white">3. Safety First:</strong> Do not share personal information (real name, address, phone number) in public chats.</p>
                <p><strong className="text-white">4. Appropriate Content:</strong> No inappropriate language or themes. This is a game for everyone.</p>
                <p><strong className="text-white">5. Account Responsibility:</strong> You are responsible for your account security. Do not share your password.</p>
                <p className="pt-4 text-xs text-white/40 italic">Last updated: January 2026</p>
              </CardContent>
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <Button
                  onClick={() => {
                    setShowTosModal(false)
                    setTosAccepted(true)
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 font-bold"
                >
                  I Understand & Accept
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
          <CardHeader className="text-center relative overflow-hidden pb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 to-transparent" />
            <CardTitle className="text-4xl font-black text-white relative z-10 drop-shadow-md">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-white/80 font-medium relative z-10">Continue your quiz journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-0 relative z-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="loginUsername" className="text-white font-bold tracking-wide ml-1">Username</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    id="loginUsername"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative h-12"
                    placeholder="Your username..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginPassword" className="text-white font-bold tracking-wide ml-1">Password</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl relative h-12"
                    placeholder="Your password..."
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-900/40 transition-all transform active:scale-95">
                Login
              </Button>
            </form>
            <div className="mt-6 text-center space-y-3">
              <Button variant="link" className="text-white/60 hover:text-white" onClick={() => setCurrentView("register")}>
                Need an account? Register
              </Button>
              <div className="w-full h-px bg-white/10" />
              <Button variant="link" className="text-white/40 hover:text-white/80 text-xs" onClick={() => setCurrentView("owner-access")}>
                Back to Main Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${themeMode === "dark"
        ? "bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500" // Original dark theme
        : themeMode === "light"
          ? "bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400" // Mid-tone light theme
          : "" // Custom theme handled via style prop
        }`}
      style={themeMode === "custom" ? { background: customThemeColor } : {}}
    >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Hidden on mobile, toggleable */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-48 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${themeMode === "dark" ? "bg-gradient-to-b from-purple-600 to-purple-800" : ""}
        ${themeMode === "light" ? "bg-gradient-to-b from-indigo-500 to-indigo-700" : ""}
      `}
        style={themeMode === "custom" ? { background: customThemeColor, filter: "brightness(0.8)" } : {}}
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
              setCurrentPage("private-chat")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "private-chat" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <Users2Icon className="h-5 w-5 mr-3" />
            Private Chat
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

          <button
            onClick={() => {
              setCurrentPage("discover")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "discover" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <CompassIcon className="h-5 w-5 mr-3" />
            Discover
          </button>

          <button
            onClick={() => {
              setCurrentPage("friends")
              setSidebarOpen(false)
              fetchFriends()
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "friends" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <Users2Icon className="h-5 w-5 mr-3" />
            Friends
          </button>

          <button
            onClick={() => {
              setCurrentPage("clans")
              setSidebarOpen(false)
              if (currentUser?.clan_id) {
                fetchClanDetails(currentUser.clan_id)
              } else {
                fetchClansList()
              }
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "clans" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <ShieldIcon className="h-5 w-5 mr-3" />
            Clans
          </button>

          <button
            onClick={() => {
              setCurrentPage("fusion")
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "fusion" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <BeakerIcon className="h-5 w-5 mr-3" />
            Fusion Lab
          </button>

          <button
            onClick={() => {
              setCurrentPage("tournaments")
              setSidebarOpen(false)
              fetchTournaments()
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "tournaments" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <TrophyIcon className="h-5 w-5 mr-3" />
            Tournaments
          </button>

          <button
            onClick={() => {
              setCurrentPage("shop")
              setSidebarOpen(false)
              fetchShopItems()
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "shop" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <ShoppingBagIcon className="h-5 w-5 mr-3" />
            Shop
          </button>

          <button
            onClick={() => {
              setCurrentPage("season")
              setSidebarOpen(false)
              fetchActiveSeason()
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "season" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <FlameIcon className="h-5 w-5 mr-3" />
            Season Pass
          </button>

          <button
            onClick={() => {
              setCurrentPage("achievements")
              setSidebarOpen(false)
              fetchAchievements()
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${currentPage === "achievements" ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
              }`}
          >
            <StarIcon className="h-5 w-5 mr-3" />
            Achievements
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
            <div className="flex items-center space-x-2 bg-purple-500/30 rounded-lg px-3 py-1 text-xs text-white">
              <span className="font-semibold">Credentials:</span>
              <span>Oktay Abdullazada (Owner)</span>
              <span className="text-white/50">|</span>
              <span>Ughur Akparli (Co-Owner - Developer)</span>
              <span className="text-white/50">|</span>
              <span>Turan Mecidov (Tester)</span>
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
                  className={`backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-orange-500/10 ${currentUser?.bannerColor === "rainbow"
                    ? "bg-gradient-to-br from-red-500/10 via-yellow-500/10 via-green-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"
                    : "bg-white/5"
                    }`}
                >
                  {/* Decorative background element */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 relative z-10">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg transform transition-transform group-hover:scale-105 group-hover:rotate-3">
                        {currentUser?.profilePicture || "🎯"}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowProfilePicker(true)}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 p-0 shadow-lg border-2 border-slate-900"
                      >
                        <CameraIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-center md:text-left flex-1">
                      <h2
                        className={`text-4xl font-black tracking-tight mb-2 ${currentUser?.nameColor === "rainbow"
                          ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                          : "text-white"
                          }`}
                      >
                        {currentUser?.username}
                      </h2>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Badge
                          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${currentUser?.role === "owner"
                            ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                            : currentUser?.role === "admin"
                              ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                              : currentUser?.role === "senior_moderator"
                                ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                : currentUser?.role === "moderator"
                                  ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                  : currentUser?.role === "tester"
                                    ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                    : "bg-slate-600"
                            } text-white border-none`}
                        >
                          {currentUser ? getUserRoleName(currentUser) : "Player"}
                        </Badge>

                        {(currentUser?.role === "moderator" ||
                          currentUser?.role === "senior_moderator" ||
                          currentUser?.role === "admin" ||
                          currentUser?.role === "tester" ||
                          currentUser?.isOwner) && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                              Staff Member
                            </Badge>
                          )}

                        <div className="flex space-x-2">
                          {(currentUser?.badges ?? []).slice(0, 3).map((badgeId) => {
                            const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                            return badge ? (
                              <div key={badgeId} className="group relative">
                                <Badge className={`${badge.color} text-white text-[10px] px-2 py-0.5 shadow-sm hover:scale-110 transition-transform cursor-help`}>
                                  {badge.emoji}
                                </Badge>
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                  {badge.name}
                                </div>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
                        Level {currentUser?.level || 1}
                      </span>
                      <span className="text-orange-500 font-black text-sm">
                        {(currentUser?.level || 1) >= 100 ? "MAX LEVEL" : `${currentUser?.xp || 0} / 100 XP`}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-4 p-1 border border-white/5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-600 to-yellow-500 h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-500"
                        style={{ width: `${Math.min(((currentUser?.xp || 0) / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 relative z-10">
                    <Button
                      onClick={() => setCurrentPage("market")}
                      className="group bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl border border-orange-400/20 shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                    >
                      <span className="mr-2 group-hover:animate-bounce">🔓</span> Unlock Booms
                    </Button>
                    <Button
                      onClick={() => setCurrentPage("booms")}
                      className="group bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl border border-blue-400/20 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                    >
                      <span className="mr-2 group-hover:rotate-12 transition-transform">⚙️</span> Manage Booms
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUserStats(currentUser)
                        setShowUserStats(true)
                      }}
                      className="group bg-white/10 hover:bg-white/15 text-white font-bold h-12 rounded-xl border border-white/10 backdrop-blur-md transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                    >
                      <span className="mr-2 group-hover:scale-125 transition-transform">📊</span> Full Profile
                    </Button>
                  </div>
                </div>

                {/* Daily Spin Wheel */}
                <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <SparklesIcon className="w-20 h-20 text-indigo-400" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <DailySpinWheel
                      onWin={(amount) => {
                        setSpinResult(amount)
                        const updatedUser = {
                          ...currentUser!,
                          tokens: (currentUser?.tokens || 0) + amount,
                          lastDailySpin: new Date().toDateString(),
                        }
                        updateAndPersistCurrentUser(updatedUser)
                        setCanSpin(false)

                        setTimeout(() => setSpinResult(null), 5000)
                      }}
                      isSpinning={spinning}
                      setIsSpinning={setSpinning}
                      canSpin={canSpin}
                    />

                    {!canSpin && !spinning && (
                      <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-4 animate-pulse">
                        Come back tomorrow for another spin!
                      </p>
                    )}
                  </div>
                </div>

                {/* Daily Login Streak */}
                <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-xl border-2 border-orange-500/20 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FlameIcon className="w-20 h-20 text-orange-400" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                      <FlameIcon className="h-7 w-7 text-orange-500" />
                      Daily Streak
                    </h3>
                    <p className="text-white/50 text-sm mb-6">Log in every day to build your streak and earn bonus rewards!</p>

                    <div className="flex items-center gap-6 mb-6">
                      <div className="bg-black/40 rounded-2xl p-6 flex flex-col items-center border border-orange-500/20">
                        <span className="text-5xl font-black text-orange-400">{currentUser?.loginStreak || 0}</span>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Day Streak</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const streakDay = (currentUser?.loginStreak || 0) % 7;
                            const isClaimed = day <= streakDay || (streakDay === 0 && (currentUser?.loginStreak || 0) > 0);
                            const isBonus = day === 7;
                            return (
                              <div key={day} className={`flex-1 h-3 rounded-full transition-all ${isClaimed ? (isBonus ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "bg-orange-500") : "bg-white/10"}`} />
                            )
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase">
                          <span>Day 1</span>
                          <span className="text-yellow-500">Day 7 Bonus</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleClaimStreak}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black py-6 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02]"
                    >
                      <FlameIcon className="w-5 h-5 mr-2" />
                      Claim Daily Streak Reward
                    </Button>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-orange-400 font-black text-sm">+50</div>
                        <div className="text-[9px] text-white/30 font-bold">DAILY</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-yellow-400 font-black text-sm">+500</div>
                        <div className="text-[9px] text-white/30 font-bold">7-DAY</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-pink-400 font-black text-sm">+5,000</div>
                        <div className="text-[9px] text-white/30 font-bold">30-DAY</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-50" />
                  <div className="flex items-center justify-between mb-8">
                    <div className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-900/20">
                      Live Statistics
                    </div>
                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Updated Realtime</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group relative bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-default pointer-events-auto">
                      <div className="absolute -top-4 -right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity select-none group-hover:scale-110 duration-500">🪙</div>
                      <div className="flex flex-col">
                        <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Available Tokens</span>
                        <div className="text-white text-3xl font-black drop-shadow-md flex items-baseline gap-2">
                          {currentUser?.tokens?.toLocaleString() || 0}
                          <span className="text-yellow-500 text-lg">🪙</span>
                        </div>
                        <div className="mt-4 h-1 w-12 bg-purple-500 rounded-full" />
                      </div>
                    </div>

                    <div className="group relative bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/20 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-default pointer-events-auto">
                      <div className="absolute -top-4 -right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity select-none group-hover:scale-110 duration-500">🌌</div>
                      <div className="flex flex-col">
                        <span className="text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Collection Size</span>
                        <div className="text-white text-3xl font-black drop-shadow-md flex items-baseline gap-2">
                          {Object.keys(getVirtualBooms(currentUser)).length || 0}
                          <span className="text-pink-500 text-lg">✨</span>
                        </div>
                        <div className="mt-4 h-1 w-12 bg-pink-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booms Page */}
            {currentPage === "booms" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end flex-wrap gap-6 border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50 mb-2">
                      My Collection
                    </h1>
                    <p className="text-white/60 text-lg">Manage and view your discovered Booms</p>
                  </div>
                </div>

                {showCrafting ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 border border-pink-500/20 rounded-2xl p-6">
                      <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-pink-400" />
                        Mystic Forge
                      </h2>
                      <p className="text-white/60">Combine duplicate Booms and tokens to craft legendary rewards.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {craftRecipes.map((recipe) => (
                        <div key={recipe.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/0 to-pink-500/5 group-hover:to-pink-500/10 transition-colors" />

                          {/* Output Preview */}
                          <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5 w-32 h-32 relative">
                            <div className="text-5xl drop-shadow-2xl z-10">{getBoomAvatar(recipe.output_boom)}</div>
                            <span className="text-xs font-bold text-white mt-2 text-center z-10">{recipe.output_boom}</span>
                            <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full" />
                          </div>

                          <div className="flex-grow flex flex-col justify-center min-w-0">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Required Materials</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {Object.entries(recipe.inputs).map(([name, qty]: [string, any]) => {
                                const playerHas = currentUser?.booms[name] || 0;
                                const hasEnough = playerHas >= qty;
                                return (
                                  <Badge key={name} className={`px-3 py-1.5 flex items-center gap-2 ${hasEnough ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"} border`}>
                                    <span className="text-lg">{getBoomAvatar(name)}</span>
                                    {name} <span className="font-black bg-black/40 px-1.5 rounded">{playerHas}/{qty}</span>
                                  </Badge>
                                )
                              })}
                            </div>

                            <Button
                              onClick={() => handleCraftBoom(recipe)}
                              disabled={(currentUser?.tokens || 0) < recipe.token_cost}
                              className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-6 rounded-xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all hover:scale-[1.02]"
                            >
                              <CoinsIcon className="w-5 h-5 mr-2" />
                              Craft ({recipe.token_cost.toLocaleString()})
                            </Button>
                          </div>
                        </div>
                      ))}
                      {craftRecipes.length === 0 && (
                        <div className="col-span-full p-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                          No recipes discovered yet. Check back later!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Level Rewards Banner */}
                    <div className="w-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-3xl">
                          🏆
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Level Rewards</h3>
                          <p className="text-white/60 text-sm">Unlock special Booms every 10 levels!</p>
                          <div className="text-orange-400 font-black text-xs uppercase tracking-widest mt-1">
                            Next Reward: Level {Math.ceil((currentUser?.level || 1) / 10) * 10}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((lvl) => {
                          const isUnlocked = (currentUser?.level || 1) >= lvl;
                          return (
                            <div key={lvl} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${isUnlocked ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-black/40 border-white/10 text-white/20"}`} title={`Level ${lvl} Reward`}>
                              {isUnlocked ? "✓" : lvl}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                        <div className="bg-yellow-500/20 p-3 rounded-xl">
                          <Star className="h-8 w-8 text-yellow-500 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-white/50 text-xs uppercase tracking-wider font-bold">Boom Score</div>
                          <div className="text-white text-2xl font-black">{currentUser?.boomScore || 0}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                        <div className="bg-purple-500/20 p-3 rounded-xl">
                          <PackageIcon className="h-8 w-8 text-purple-500" />
                        </div>
                        <div>
                          <div className="text-white/50 text-xs uppercase tracking-wider font-bold">Packs</div>
                          <div className="text-white text-2xl font-black">{currentUser?.packs.length || 0}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                        <div className="bg-emerald-500/20 p-3 rounded-xl">
                          <CoinsIcon className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-white/50 text-xs uppercase tracking-wider font-bold">Value</div>
                          <div className="text-emerald-400 text-2xl font-black">🪙 {currentUser?.totalValue || 0}</div>
                        </div>
                      </div>
                    </div>

{/* Pack Sections */}
                    <div className="grid grid-cols-1 gap-8">
                      {PACKS.map((pack) => (
                        <div
                          key={pack.id}
                          className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-2xl"
                        >
                          <div className={`h-2 w-full bg-gradient-to-r ${pack.color}`} />
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                                  {pack.emoji}
                                </span>
                                {pack.name}
                              </h2>
                              <Badge className="bg-white/10 text-white/70 border-none px-3 py-1">
                                {pack.booms.filter(b => (getVirtualBooms(currentUser)[b.name] || 0) > 0).length} / {pack.booms.length} Found
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {pack.booms.map((boom, index) => {
                                const quantity = getVirtualBooms(currentUser)[boom.name] || 0
                                const hasBoom = quantity > 0
                                const activeRental = rentalListings.find(
                                  (r) =>
                                    r.renter_username === currentUser?.username &&
                                    r.boom_name === boom.name &&
                                    r.status === "rented"
                                )
                                const isRented = !!activeRental
                                const rarityColor = getRarityColor(boom.rarity)

                                return (
                                  <div
                                    key={index}
                                    className="group/item flex flex-col items-center gap-2"
                                  >
                                    <div
                                      className={`
                                    w-full aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl 
                                    transition-all duration-300 relative overflow-hidden
                                    ${hasBoom
                                          ? `${rarityColor} border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`
                                          : "bg-black/40 text-white/10 border-white/5 cursor-not-allowed filter grayscale"
                                        }
                                  `}
                                      onClick={() => hasBoom && handleBoomClick(boom.name)}
                                    >
                                      {/* Rarity Glow Effect */}
                                      {hasBoom && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                      )}

                                      {hasBoom ? (
                                        <>
                                          {/* Quantity Badge */}
                                          {hasBoom && quantity > 1 && (
                                            <div className="absolute top-2 right-2 bg-white text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg border border-black/10 z-20">
                                              {quantity}x
                                            </div>
                                          )}

                                          {/* Rented Session Badge */}
                                          {isRented && activeRental && (
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] font-black rounded-xl px-1.5 py-0.5 flex items-center justify-center shadow-lg border border-blue-500/30 z-20 uppercase tracking-widest animate-pulse">
                                              Rent ({activeRental.sessions_remaining})
                                            </div>
                                          )}

                                          {boom.avatar.startsWith('/') ? (
                                            <img src={boom.avatar || "/placeholder.svg"} alt={boom.name} className="z-10 relative w-12 h-12 object-contain drop-shadow-lg" />
                                          ) : (
                                            <span className="z-10 relative drop-shadow-lg">{boom.avatar}</span>
                                          )}
                                        </>
                                      ) : (
                                        <LockIcon className="h-8 w-8 opacity-20" />
                                      )}

                                      {/* Highlight for rare items */}
                                      {hasBoom && (boom.rarity === 'legendary' || boom.rarity === 'chroma' || boom.rarity === 'mystical') && (
                                        <div className="absolute inset-0 animate-pulse bg-white/5" />
                                      )}
                                    </div>

                                    <div className="w-full text-center">
                                      <div className={`text-[10px] uppercase tracking-tighter font-bold mb-0.5 ${hasBoom ? 'text-white/60' : 'text-white/20'}`}>
                                        {boom.rarity}
                                      </div>
                                      <div className={`text-xs font-semibold truncate w-full ${hasBoom ? 'text-white' : 'text-white/30'}`}>
                                        {boom.name}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gamepass Booms Section */}
                    {(currentUser?.level || 1) >= 10 && (
                      <div className="mt-16">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-2 h-12 bg-gradient-to-b from-purple-500 via-pink-500 to-yellow-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                          <div>
                            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 tracking-tighter">
                              GAMEPASS BOOMS
                            </h2>
                            <p className="text-white/60 text-sm font-medium mt-1">
                              Exclusive rewards for reaching milestone levels
                            </p>
                          </div>
                          {(currentUser?.level || 1) >= 100 && (
                            <div className="ml-auto">
                              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-2 border border-white/20">
                                <span className="text-white font-black text-sm uppercase tracking-wider">⚡ MAX LEVEL ⚡</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {GAMEPASS_BOOMS.map((boom) => {
                              const quantity = currentUser?.booms[boom.name] || 0
                              const hasUnlocked = quantity > 0
                              const rarityColor = getRarityColor(boom.rarity)

                              return (
                                <div key={boom.level} className="group flex flex-col items-center gap-3">
                                  <div
                                    className={`
                                  w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center text-4xl 
                                  transition-all duration-300 relative overflow-hidden cursor-pointer
                                  ${hasUnlocked
                                        ? `${rarityColor} border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`
                                        : "bg-black/60 text-white/10 border-white/10 grayscale"
                                      }
                                `}
                                    onClick={() => hasUnlocked && handleBoomClick(boom.name)}
                                  >
                                    {/* Glow Effect */}
                                    {hasUnlocked && (
                                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                    )}

                                    {/* Avatar/Image */}
                                    {hasUnlocked ? (
                                      <div className="z-10 flex flex-col items-center gap-1">
                                        {getBoomAvatar(boom.name).startsWith('/') ? (
                                          <img src={getBoomAvatar(boom.name) || "/placeholder.svg"} alt={boom.name} className="w-16 h-16 object-contain drop-shadow-lg" />
                                        ) : (
                                          <span className="drop-shadow-lg">{getBoomAvatar(boom.name)}</span>
                                        )}
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">LVL {boom.level}</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1">
                                        <LockIcon className="h-8 w-8 opacity-20" />
                                        <span className="text-xs font-bold text-white/20 uppercase tracking-wider">LVL {boom.level}</span>
                                      </div>
                                    )}

                                    {/* Quantity Badge */}
                                    {hasUnlocked && quantity > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                                        ×{quantity}
                                      </div>
                                    )}
                                  </div>

                                  {/* Boom Name */}
                                  <div className="text-center">
                                    <p className={`text-sm font-bold ${hasUnlocked ? "text-white" : "text-white/30"} line-clamp-2`}>
                                      {boom.name}
                                    </p>
                                    {hasUnlocked && (
                                      <p className="text-xs text-white/50 mt-1 line-clamp-1">
                                        {String((boom as { description?: string }).description ?? "")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Limited Section - Unlocked at Level 70 */}
                    {((currentUser?.level || 1) >= 70 || (currentUser?.booms["The Trophy"] || 0) > 0) && (
                      <div className="mt-16 animate-in zoom-in duration-1000">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-2 h-12 bg-gradient-to-b from-red-600 via-pink-600 to-purple-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse" />
                          <div>
                            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-indigo-600 tracking-tighter">
                              LIMITED SECTION
                            </h2>
                            <p className="text-red-400/80 text-sm font-black mt-1 uppercase tracking-widest">
                              The Vault of the Ancients has opened
                            </p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-950/40 to-purple-950/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-red-500/30 p-10 shadow-[0_0_50px_rgba(220,38,38,0.2)] ring-1 ring-white/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {LIMITED_BOOMS.map((boom) => {
                              const hasIt = (currentUser?.booms[boom.name] || 0) > 0
                              const canAfford = (currentUser?.tokens || 0) >= boom.price

                              return (
                                <div key={boom.name} className="group flex flex-col items-center gap-4 relative">
                                  <div className="absolute -top-4 -right-2 z-20">
                                    <Badge className="bg-red-600 text-white font-black border-none px-3 py-1 animate-bounce">LIMITED</Badge>
                                  </div>

                                  <div
                                    className={`
                                  w-full aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center text-6xl 
                                  transition-all duration-500 relative overflow-hidden cursor-pointer
                                  ${hasIt
                                        ? "text-cyan-400 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] bg-cyan-950/40"
                                        : "bg-black/80 text-white/5 border-white/5 hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                                      }
                                `}
                                    onClick={() => {
                                      if (hasIt) {
                                        handleBoomClick(boom.name)
                                      } else if (canAfford) {
                                        if (confirm(`Purchase ${boom.name} for ${boom.price} tokens?`)) {
                                          const updatedUser = {
                                            ...currentUser!,
                                            tokens: currentUser!.tokens - boom.price,
                                            booms: {
                                              ...currentUser!.booms,
                                              [boom.name]: (currentUser!.booms[boom.name] || 0) + 1
                                            }
                                          }
                                          updateAndPersistCurrentUser(updatedUser)
                                        }
                                      } else {
                                        alert("You need more tokens for this ancient treasure.")
                                      }
                                    }}
                                  >
                                    {/* Particle Effect Background */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                                    <span className={`z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transform group-hover:scale-110 transition-transform duration-500 ${!hasIt && 'filter grayscale brightness-50'}`}>
                                      {boom.avatar}
                                    </span>

                                    {!hasIt && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 group-hover:bg-black/20 transition-all">
                                        <div className="flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full font-black text-sm shadow-xl">
                                          <CoinsIcon className="w-4 h-4" />
                                          {boom.price}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-center space-y-1">
                                    <p className={`text-lg font-black tracking-tight ${hasIt ? "text-cyan-400" : "text-white/40"}`}>
                                      {boom.name}
                                    </p>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{boom.description}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Market Page */}
            {currentPage === "market" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Market Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 p-8 md:p-12 shadow-2xl">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />

                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 text-center md:text-left">
                      <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                        BOOM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">MARKET</span>
                      </h1>
                      <p className="text-white/60 text-lg md:text-xl max-w-md font-medium">
                        Unleash the power of the arena. Discover legendary Booms and dominate the collection.
                      </p>
                    </div>

                    <div className="shrink-0 animate-float">
                      <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)] flex flex-col items-center gap-2">
                        <div className="text-white/40 text-xs uppercase tracking-[0.3em] font-black">Your Balance</div>
                        <div className="flex items-center gap-3">
                          <span className="text-5xl drop-shadow-lg">🪙</span>
                          <span className="text-5xl font-black text-yellow-400 tabular-nums">
                            {currentUser?.tokens.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Ready to spend</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Rarity Banner */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Global Drop Rates</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: "Uncommon", rate: "60%", color: "bg-green-500", glow: "glow-uncommon" },
                      { label: "Rare", rate: "25%", color: "bg-blue-500", glow: "glow-rare" },
                      { label: "Epic", rate: "10%", color: "bg-purple-500", glow: "glow-epic" },
                      { label: "Legendary", rate: "4%", color: "bg-orange-500", glow: "glow-legendary" },
                      { label: "Chroma", rate: "0.9%", color: "bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500", glow: "glow-chroma" },
                      { label: "Mystical", rate: "0.1%", color: "bg-gradient-to-r from-purple-900 via-pink-500 to-indigo-900", glow: "glow-mystical" },
                    ].map((rarity, i) => (
                      <div key={i} className={`relative group overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20 ${rarity.glow}`}>
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${rarity.color}`}>
                            {rarity.label}
                          </div>
                          <div className="text-2xl font-black text-white">{rarity.rate}</div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
                          <div className={`h-full ${rarity.color} group-hover:animate-pulse`} style={{ width: rarity.rate }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {PACKS.map((pack) => (
                    <div key={pack.id} className="relative group perspective-1000">
                      {/* NEW! Label and Series */}
                      {pack.isNew && (
                        <div className="absolute -top-3 -right-3 z-30 animate-bounce">
                          <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-900/40 border-2 border-white/20 uppercase tracking-widest">
                            NEW!
                          </div>
                        </div>
                      )}
                      {pack.series && (
                        <div className="absolute top-4 left-4 z-30">
                          <Badge className="bg-black/40 backdrop-blur-md border-white/20 text-[10px] font-black uppercase text-white/80 px-2 py-0.5 rounded-lg">
                            Series {pack.series}
                          </Badge>
                        </div>
                      )}
                      <div
                        className={`
                          bg-gradient-to-br ${pack.color} rounded-[2rem] overflow-hidden relative shadow-2xl
                          transition-all duration-500 ease-out transform-gpu
                          group-hover:scale-105 group-hover:-rotate-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                          border border-white/20
                        `}
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute h-[200%] w-[100px] bg-white/30 skew-x-[-30deg] animate-shine blur-xl" />
                        </div>

                        {/* Zigzag Header */}
                        <div
                          className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-sm z-10"
                          style={{
                            clipPath: "polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0, 100% 100%, 0 100%)",
                          }}
                        />

                        {/* Content */}
                        <div className="h-64 flex flex-col items-center justify-center relative p-8">
                          {/* Inner card glow */}
                          <div className="absolute inset-x-8 inset-y-8 bg-white/10 rounded-2xl blur-2xl" />

                          <div className="text-9xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 select-none z-10">
                            {pack.emoji}
                          </div>
                          <div className="mt-6 z-10 text-center">
                            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                              {pack.name}
                            </h2>
                            <div className="mt-1 px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold text-white/50 uppercase tracking-widest inline-block backdrop-blur-md">
                              Series 1
                            </div>
                          </div>
                        </div>

                        {/* Footer / Price Area */}
                        <div className="bg-black/40 backdrop-blur-xl p-6 flex items-center justify-between border-t border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price tag</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🪙</span>
                              <span className="text-2xl font-black text-yellow-400">{pack.price}</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handlePackAction(pack.id)}
                            disabled={(currentUser?.tokens || 0) < pack.price}
                            className={`
                              h-12 px-8 rounded-xl font-black uppercase tracking-wider text-sm
                              transition-all duration-300 transform active:scale-95
                              ${(currentUser?.tokens || 0) < pack.price
                                ? "bg-white/10 text-white/30 cursor-not-allowed"
                                : "bg-white text-black hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-xl"
                              }
                            `}
                          >
                            Open Pack
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Chat Page */}
            {currentPage === "chat" && (
              <div className="space-y-12">
                <RealtimeChat
                  currentUser={currentUser}
                  roleName={currentUser ? getUserRoleName(currentUser) : "Player"}
                  onUsernameClick={handleUsernameClick}
                  onClanTagClick={fetchSingleClanProfile}
                />
              </div>
            )}

            {/* Private Chat Page */}
            {currentPage === "private-chat" && currentUser && (
              <div className="space-y-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_purple]" />
                  <h2 className="text-4xl font-black text-white tracking-tighter">Private Quarters</h2>
                </div>
                <PrivateChat currentUser={currentUser} onPlayerClick={openPlayerProfile} />
              </div>
            )}

            {/* Auction Page */}
            {currentPage === "auction" && (
              <RealtimeAuctions
                currentUser={currentUser}
                getBoomAvatar={getBoomAvatar}
                getBoomRarity={getBoomRarity}
                getRarityColor={getRarityColor}
                onAuctionCreated={() => fetchUsersFromSupabase(true)}
                onClaimComplete={() => fetchUsersFromSupabase(true)}
                onPlayerClick={openPlayerProfile}
                users={users}
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
                onPlayerClick={openPlayerProfile}
              />
            )}

            {/* Trading Page */}
            {currentPage === "trading" && (
              <TradingPage
                currentUser={currentUser!}
                users={users}
                onTradeComplete={() => {
                  // Refresh all users data after trade AND update current user state
                  fetchUsersFromSupabase(true)
                }}
              />
            )}

            {/* Staff Page */}
            {isOwner() || currentUser?.role === "moderator" || currentUser?.role === "senior_moderator" || currentUser?.role === "admin" || currentUser?.role === "tester" ? (
              currentPage === "staff" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h1 className="text-5xl font-black text-white tracking-tighter">Staff Panel</h1>
                      <p className="text-purple-300/60 font-medium">Manage the arena and its players.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner() && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowBadgeManager(true)}
                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl font-bold transition-all"
                          >
                            Badges
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-fit">
                    <button
                      onClick={() => setStaffTab("all")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      All Users
                    </button>
                    <button
                      onClick={() => setStaffTab("active")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "active" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <ShieldIcon className="w-4 h-4" />
                      Active
                      <Badge className="ml-1 bg-white/10 text-white border-none px-1.5 py-0 min-w-[20px] justify-center">
                        {(users || []).filter(u => u && !u.isBanned).length}
                      </Badge>
                    </button>
                    <button
                      onClick={() => setStaffTab("muted")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "muted" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <MessageCircleIcon className="w-4 h-4" />
                      Muted
                      <Badge className="ml-1 bg-white/10 text-white border-none px-1.5 py-0 min-w-[20px] justify-center">
                        {(users || []).filter(u => u && u.isMuted).length}
                      </Badge>
                    </button>
                    <button
                      onClick={() => setStaffTab("banned")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "banned" ? "bg-red-600 text-white shadow-lg shadow-red-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <BanIcon className="w-4 h-4" />
                      Banned
                      <Badge className="ml-1 bg-white/10 text-white border-none px-1.5 py-0 min-w-[20px] justify-center">
                        {(users || []).filter(u => u && u.isBanned).length}
                      </Badge>
                    </button>
                    <button
                      onClick={() => setStaffTab("applications")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "applications" ? "bg-orange-600 text-white shadow-lg shadow-orange-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <FileTextIcon className="w-4 h-4" />
                      Applications
                      <Badge className="ml-1 bg-white/10 text-white border-none px-1.5 py-0 min-w-[20px] justify-center text-orange-400">
                        {(users || []).filter(u => u && u.status === "pending").length}
                      </Badge>
                    </button>
                    <button
                      onClick={() => setStaffTab("tournaments")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "tournaments" ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <TrophyIcon className="w-4 h-4" />
                      Tournaments
                    </button>
                    <button
                      onClick={() => setStaffTab("seasons")}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${staffTab === "seasons" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <FlameIcon className="w-4 h-4" />
                      Seasons
                    </button>
                  </div>

                  {/* Search and Filters Strip */}
                  {staffTab !== "tournaments" && staffTab !== "seasons" && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 gap-4">
                    <div className="relative w-full md:w-80">
                      <Input
                        placeholder="Search players..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500/50 transition-all h-10 px-4"
                      />
                    </div>
                  </div>
                  )}

                  {staffTab !== "tournaments" && staffTab !== "seasons" && (
                    <div className="space-y-3">
                      {(users || [])
                        .filter((u) => {
                        if (!u) return false
                        const matchesSearch = u.username.toLowerCase().includes(staffSearchQuery.toLowerCase())
                        const matchesTab =
                          (staffTab === "all" && u.status !== "pending") ||
                          (staffTab === "active" && !u.isBanned && u.status !== "pending") ||
                          (staffTab === "muted" && u.isMuted) ||
                          (staffTab === "banned" && u.isBanned) ||
                          (staffTab === "applications" && u.status === "pending")
                        return matchesSearch && matchesTab
                      })
                      .map((user) => {
                        const userRole = DEFAULT_ROLES.find((r) => r.id === user.role)
                        const isActive = Date.now() - user.lastSeen < 300000
                        return (
                          <div key={user.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : user.status === "pending" ? "bg-orange-500 animate-pulse" : "bg-zinc-600"}`} />
                                {isActive && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-black tracking-tight">{user.username}</span>
                                  {user.status === "pending" ? (
                                    <Badge className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-orange-500/30 shadow-sm">
                                      Pending Approval
                                    </Badge>
                                  ) : (
                                    <Badge className={`${userRole?.color || "bg-zinc-600"} text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none shadow-sm`}>
                                      {userRole?.name || "Player"}
                                    </Badge>
                                  )}
                                </div>

                                {user.status === "pending" ? (
                                  <div className="mt-2 text-xs text-white/80 bg-black/20 p-2 rounded-lg border border-white/5">
                                    <p className="flex items-center gap-2 mb-1">
                                      <span className="text-orange-400 font-bold uppercase text-[10px] tracking-wider w-12">Age:</span>
                                      <span className="font-mono">{user.age || "N/A"}</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                      <span className="text-orange-400 font-bold uppercase text-[10px] tracking-wider w-12 mt-0.5">Reason:</span>
                                      <span className="italic text-white/90">{user.reason || "No reason provided"}</span>
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    {user.isMuted && <span className="text-yellow-500/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">🔇 Muted</span>}
                                    {user.isBanned && <span className="text-red-500/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">🚫 Banned</span>}
                                  </div>
                                )}

                                {staffTab === "banned" && user.banReason && (
                                  <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-xs text-red-100/70 italic">
                                    "{user.banReason}"
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {(currentUser?.role === "admin" ||
                                currentUser?.role === "senior_moderator" ||
                                currentUser?.role === "moderator" ||
                                currentUser?.role === "tester" ||
                                isOwner()) && (
                                  <>
                                    {user.status === "pending" ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApproveUser(user.id)}
                                          className="bg-green-600 hover:bg-green-500 text-white border border-green-500/30 rounded-xl font-bold h-9 px-4 transition-all shadow-lg shadow-green-900/20"
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleRejectUser(user.id)}
                                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl font-bold h-9 px-4 transition-all"
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        {isOwner() && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditUserDialog(user)}
                                            className="h-9 w-9 p-0 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
                                          >
                                            <PencilIcon className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <select
                                          value={user.role}
                                          onChange={(e) => quickAssignRole(user.id, e.target.value)}
                                          className="bg-zinc-900 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:border-purple-500/50 outline-none h-9"
                                        >
                                          {DEFAULT_ROLES.filter(
                                            (role) => role.id !== "owner" || (isOwner() && user.id === currentUser?.id),
                                          ).map((role) => (
                                            <option key={role.id} value={role.id}>
                                              {role.name}
                                            </option>
                                          ))}
                                        </select>

                                        <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

                                        {user.isMuted ? (
                                          <Button
                                            size="sm"
                                            onClick={() => handleUnbanUnmute(user.id, "unmute")}
                                            className="bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white border border-yellow-500/20 rounded-xl font-bold h-9 px-4 transition-all"
                                          >
                                            Unmute
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openMuteDialog(user)}
                                            className="text-white/40 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl font-bold h-9 px-4 transition-all"
                                          >
                                            Mute
                                          </Button>
                                        )}

                                        {user.isBanned ? (
                                          <Button
                                            size="sm"
                                            onClick={() => handleUnbanUnmute(user.id, "unban")}
                                            className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 rounded-xl font-bold h-9 px-4 transition-all"
                                          >
                                            Unban
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openBanDialog(user)}
                                            className="text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-bold h-9 px-4 transition-all"
                                          >
                                            Ban
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                            </div>
                          </div>
                        )
                      })}

                    {(users || []).filter((u) => {
                      if (!u) return false
                      const matchesSearch = u.username.toLowerCase().includes(staffSearchQuery.toLowerCase())
                      const matchesTab =
                        staffTab === "all" ||
                        (staffTab === "active" && !u.isBanned) ||
                        (staffTab === "muted" && u.isMuted) ||
                        (staffTab === "banned" && u.isBanned)
                      return matchesSearch && matchesTab
                    }).length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <CheckIcon className="w-8 h-8 text-white/20" />
                          </div>
                          <p className="text-white/40 font-bold">No users found.</p>
                          <p className="text-white/10 text-xs">The arena is clear.</p>
                        </div>
                      )}
                  </div>
                  )}

                  {/* Tournaments Management Tab */}
                  {staffTab === "tournaments" && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Create Tournament Form */}
                      <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-3xl">
                        <CardHeader>
                          <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <TrophyIcon className="h-6 w-6 text-yellow-500" />
                            Create New Tournament
                          </CardTitle>
                          <CardDescription className="text-slate-400">Host an arena competition with custom rewards.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white font-bold text-sm">Tournament Title</Label>
                              <Input
                                placeholder="e.g. Weekly Trivia Clash #1"
                                value={tourneyTitle}
                                onChange={(e) => setTourneyTitle(e.target.value)}
                                className="bg-black/20 border-white/10 text-white rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white font-bold text-sm">End Date & Time</Label>
                              <Input
                                type="datetime-local"
                                value={tourneyEndTime}
                                onChange={(e) => setTourneyEndTime(e.target.value)}
                                className="bg-black/20 border-white/10 text-white rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white font-bold text-sm">Description</Label>
                            <Input
                              placeholder="e.g. Compete for the top score in history trivia!"
                              value={tourneyDesc}
                              onChange={(e) => setTourneyDesc(e.target.value)}
                              className="bg-black/20 border-white/10 text-white rounded-xl"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white font-bold text-sm">Prize Tokens</Label>
                              <Input
                                type="number"
                                placeholder="10000"
                                value={tourneyPrizeTokens || ""}
                                onChange={(e) => setTourneyPrizeTokens(parseInt(e.target.value) || 0)}
                                className="bg-black/20 border-white/10 text-white rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white font-bold text-sm">Prize Boom Name (Optional)</Label>
                              <select
                                value={tourneyPrizeBoom}
                                onChange={(e) => setTourneyPrizeBoom(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 text-white rounded-xl h-10 px-3 outline-none"
                              >
                                <option value="">No Boom Reward</option>
                                <option value="Basic Box">Basic Box 📦</option>
                                <option value="Rare Box">Rare Box 📦</option>
                                <option value="Epic Box">Epic Box 📦</option>
                                <option value="King Box">King Box 📦</option>
                              </select>
                            </div>
                          </div>

                          <Button
                            onClick={handleCreateTournament}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-black w-full py-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.01]"
                          >
                            Launch Tournament
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Tournament List */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5 text-yellow-500" />
                          Tournaments Arena
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {activeTournaments.map((t) => (
                            <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-xl font-bold text-white">{t.title}</h4>
                                  <Badge className={`${t.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white font-black uppercase text-[8px]`}>
                                    {t.status}
                                  </Badge>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">{t.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                  <span className="flex items-center gap-1 font-bold text-white"><CoinsIcon className="w-3 h-3 text-yellow-400" /> {t.prize_tokens?.toLocaleString() || 0}</span>
                                  {t.prize_boom_name && <span className="font-bold text-white">🎁 {t.prize_boom_name}</span>}
                                  <span>Ends: {new Date(t.end_time).toLocaleString()}</span>
                                </div>
                              </div>
                              {t.status === 'active' && (
                                <Button
                                  onClick={() => handleFinalizeTournament(t.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white font-black px-6 rounded-xl transition-all"
                                >
                                  Finalize & Award Prizes
                                </Button>
                              )}
                            </div>
                          ))}
                          {activeTournaments.length === 0 && (
                            <div className="p-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                              No tournaments have been hosted yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seasons Management Tab */}
                  {staffTab === "seasons" && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Active Season Info */}
                      <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-3xl">
                        <CardHeader>
                          <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <FlameIcon className="h-6 w-6 text-orange-500 animate-pulse" />
                            Season Management
                          </CardTitle>
                          <CardDescription className="text-slate-400">Start new seasons and manage active passes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {activeSeason ? (
                            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-2xl p-6">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Currently Active Season</span>
                              <h4 className="text-2xl font-black text-white mb-2">{activeSeason.name}</h4>
                              <p className="text-xs text-slate-400">
                                Started: {new Date(activeSeason.start_date).toLocaleDateString()} | Ends: {new Date(activeSeason.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 text-center">
                              <p className="text-red-300 font-bold">No active season pass currently running.</p>
                            </div>
                          )}

                          <div className="space-y-3">
                            <Label className="text-white font-bold text-sm">Start Next Season</Label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Input
                                placeholder="e.g. Season 2: Legends Ascend"
                                value={newSeasonName}
                                onChange={(e) => setNewSeasonName(e.target.value)}
                                className="bg-black/20 border-white/10 text-white rounded-xl flex-grow h-12"
                              />
                              <Button
                                onClick={handleStartNewSeason}
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-black px-8 h-12 rounded-xl"
                              >
                                Activate Season
                              </Button>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Activating a new season deactivates the current one and creates standard reward tiers (100 XP, 250 XP, 500 XP).
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )) : null}

            {/* Settings Page */}
            {currentPage === "settings" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-white">Settings</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Section */}
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-purple-500/10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <UserIcon className="text-white w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Profile</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-purple-200/50 text-xs font-bold uppercase tracking-wider">Username</span>
                        <p className="text-white text-lg font-medium">{currentUser?.username}</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-purple-200/50 text-xs font-bold uppercase tracking-wider">Role</span>
                        <p className="text-white font-medium">{currentUser ? getUserRoleName(currentUser) : "Player"}</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-purple-200/50 text-xs font-bold uppercase tracking-wider">Joined</span>
                        <p className="text-white font-medium">{currentUser?.joinDate}</p>
                      </div>
                      {/* Display badges */}
                      {currentUser?.badges && currentUser.badges.length > 0 && (
                        <div className="pt-2">
                          <span className="text-purple-200/50 text-xs font-bold uppercase tracking-wider">Badges</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {currentUser.badges.map((badgeId) => {
                              const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                              return badge ? (
                                <Badge key={badgeId} className={`${badge.color} text-white px-3 py-1 rounded-lg border-none shadow-md hover:scale-105 transition-transform cursor-default`}>
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
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-green-500/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-green-500/10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <PencilIcon className="text-white w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Edit Info</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        variant="secondary"
                        onClick={() => setShowPasswordEdit(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 flex items-center justify-center gap-2 h-12 rounded-xl transition-all"
                      >
                        <LockIcon className="w-4 h-4" />
                        Change Password
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-100 border-red-500/20 flex items-center justify-center gap-2 h-12 rounded-xl transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>

                  {/* Theme Changing Section */}
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-purple-500/10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <SparklesIcon className="text-white w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Theme Changing</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          variant={themeMode === "dark" ? "default" : "secondary"}
                          onClick={() => setThemeMode("dark")}
                          className={`flex items-center justify-center gap-2 h-12 rounded-xl transition-all ${themeMode === "dark"
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                            }`}
                        >
                          <span className="text-lg">🌑</span>
                          Dark Theme
                        </Button>
                        <Button
                          variant={themeMode === "light" ? "default" : "secondary"}
                          onClick={() => setThemeMode("light")}
                          className={`flex items-center justify-center gap-2 h-12 rounded-xl transition-all ${themeMode === "light"
                            ? "bg-white text-purple-900 hover:bg-white/90"
                            : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                            }`}
                        >
                          <span className="text-lg">☀️</span>
                          Light Theme
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Custom Theme Color</Label>
                        <div className="flex gap-4">
                          <div className="relative h-12 flex-1 rounded-xl overflow-hidden border border-white/10">
                            <input
                              type="color"
                              value={customThemeColor}
                              onChange={(e) => {
                                setCustomThemeColor(e.target.value)
                                setThemeMode("custom")
                              }}
                              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-none"
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-white/50 bg-black/20 font-mono">
                              {customThemeColor}
                            </div>
                          </div>
                          <Button
                            onClick={() => setThemeMode("custom")}
                            className={`h-12 px-6 rounded-xl transition-all ${themeMode === "custom"
                              ? "bg-white/20 border-white/20"
                              : "bg-white/5 border-white/10"
                              }`}
                            style={{ backgroundColor: customThemeColor }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Section */}
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-blue-500/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-blue-500/10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FileTextIcon className="text-white w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Legal</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        variant="secondary"
                        onClick={() => setShowPrivacyPolicy(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 flex items-center justify-center gap-2 h-12 rounded-xl transition-all"
                      >
                        <ShieldIcon className="w-4 h-4" />
                        Privacy Policy
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowTermsOfService(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 flex items-center justify-center gap-2 h-12 rounded-xl transition-all"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        Terms of Service
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Friends Page */}
            {currentPage === "friends" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50 mb-2">
                      Friends
                    </h1>
                    <p className="text-white/60 text-lg">Manage your friends list and requests</p>
                  </div>
                </div>

                {/* Add Friend */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                    <Users2Icon className="h-5 w-5 text-purple-400" />
                    Add a Friend
                  </h3>
                  <div className="flex gap-3">
                    <Input
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      placeholder="Enter username..."
                      className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && friendSearchQuery.trim()) {
                          handleSendFriendRequest(friendSearchQuery.trim())
                          setFriendSearchQuery("")
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (friendSearchQuery.trim()) {
                          handleSendFriendRequest(friendSearchQuery.trim())
                          setFriendSearchQuery("")
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl px-6"
                    >
                      Send Request
                    </Button>
                  </div>
                </div>

                {/* Pending Requests */}
                {friendRequests.length > 0 && (
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-orange-400 mb-4">
                      📬 Pending Requests ({friendRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {friendRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between bg-black/30 rounded-xl p-4 border border-white/5">
                          <span className="text-white font-bold">{req.user_username}</span>
                          <div className="flex gap-2">
                            <Button onClick={() => handleAcceptFriend(req.user_username)} className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg px-4 h-9">
                              <CheckIcon className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button onClick={() => handleRemoveFriend(req.user_username)} variant="ghost" className="text-red-400 hover:bg-red-500/20 rounded-lg h-9">
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-white mb-4">
                    Your Friends ({friendsList.length})
                  </h3>
                  {friendsList.length === 0 ? (
                    <div className="text-center p-12 text-white/30 border-2 border-dashed border-white/5 rounded-xl">
                      <Users2Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-bold">No friends yet</p>
                      <p className="text-sm">Send a friend request above to get started!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {friendsList.map((f) => {
                        const friendName = f.user_username === currentUser?.username ? f.friend_username : f.user_username
                        const friendUser = users.find(u => u.username === friendName)
                        return (
                          <div key={f.id} className="flex items-center justify-between bg-black/30 rounded-xl p-4 border border-white/5 group hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => friendUser && openPlayerProfile(friendUser)}>
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg border border-purple-500/30">
                                {friendUser?.profilePicture || friendName[0]?.toUpperCase()}
                              </div>
                              <div>
                                <span className="text-white font-bold">{friendName}</span>
                                <div className="text-[10px] text-white/30 font-bold uppercase">Level {friendUser?.level || 1}</div>
                              </div>
                            </div>
                            <Button onClick={() => handleRemoveFriend(friendName)} variant="ghost" className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/20 rounded-lg h-8 text-xs">
                              Remove
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clans Page */}
            {currentPage === "clans" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentUser?.clan_id ? (
                  // IN A CLAN VIEW
                  !clanDetails ? (
                    <div className="flex flex-col items-center justify-center p-20 min-h-[400px] bg-white/5 border border-white/10 rounded-[2.5rem]">
                      <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                      <p className="mt-4 text-purple-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Clan Details...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Clan Banner Card */}
                      <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-black/40 backdrop-blur-xl border border-purple-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center text-6xl border border-purple-500/30 shadow-inner">
                              {clanDetails.logo}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-white tracking-tight">{clanDetails.name}</h1>
                                <span className={`inline-block text-xl font-black px-3 py-1 rounded-xl bg-black/40 border border-white/5 ${clanDetails.tag_color}`}>
                                  [{clanDetails.tag}]
                                </span>
                              </div>
                              <p className="text-white/60 font-medium text-sm md:text-base max-w-xl">
                                {clanDetails.description || "This clan has no description yet."}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/50 pt-1">
                                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                  <CrownIcon className="w-3.5 h-3.5 text-yellow-500" />
                                  Leader: <span className="text-yellow-400 font-bold">{clanDetails.leader}</span>
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                  <CoinsIcon className="w-3.5 h-3.5 text-yellow-500" />
                                  Clan Bank: <span className="text-white font-bold">{clanDetails.bank_tokens.toLocaleString()} tokens</span>
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                  <Users2Icon className="w-3.5 h-3.5 text-purple-400" />
                                  Members: <span className="text-white font-bold">{clanDetails.members?.length || 0}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0">
                            {/* Clan Level & XP */}
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 w-full md:w-56 space-y-2">
                              <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-purple-400 tracking-wider">Level {clanDetails.level}</span>
                                <span className="text-[10px] text-white/40 tabular-nums">
                                  {clanDetails.xp % 10000} / 10000 XP
                                </span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                                  style={{ width: `${(clanDetails.xp % 10000) / 100}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-white/30 italic text-right">
                                {10000 - (clanDetails.xp % 10000)} XP to Next Level
                              </div>
                            </div>

                            <Button 
                              onClick={handleLeaveClan}
                              variant="ghost" 
                              className="text-red-400 hover:bg-red-500/10 rounded-2xl w-full text-xs font-bold"
                            >
                              Leave Clan
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Main Dashboard Content */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Member Roster & Settings (Col Span 2) */}
                        <div className="lg:col-span-2 space-y-8">
                          {/* Member Roster Card */}
                          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                              <Users2Icon className="w-5 h-5 text-purple-400" />
                              <h2 className="text-xl font-black text-white">Clan Roster</h2>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-white/5 text-xs text-white/30 font-black uppercase tracking-wider">
                                    <th className="pb-3 pl-2">Member</th>
                                    <th className="pb-3">Clan Role</th>
                                    <th className="pb-3 text-right">Balance</th>
                                    {(currentUser.clan_role === 'leader' || currentUser.clan_role === 'co_leader') && (
                                      <th className="pb-3 text-right pr-2">Actions</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                  {clanDetails.members?.map((member: any) => {
                                    const isSelf = member.username === currentUser.username;
                                    const canManage = !isSelf && (
                                      currentUser.clan_role === 'leader' ||
                                      (currentUser.clan_role === 'co_leader' && member.clan_role === 'member')
                                    );
                                    
                                    return (
                                      <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="py-4 pl-2 flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xl border border-white/5">
                                            {member.profile_picture || "🎮"}
                                          </div>
                                          <div>
                                            <span 
                                              className={`font-bold cursor-pointer hover:underline ${member.name_color || 'text-white'}`}
                                              onClick={() => openPlayerProfile(member.id)}
                                            >
                                              {member.username}
                                            </span>
                                            {isSelf && <span className="text-[10px] text-purple-400 font-bold ml-2 bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20">YOU</span>}
                                          </div>
                                        </td>
                                        <td className="py-4">
                                          <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${
                                            member.clan_role === 'leader' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                            member.clan_role === 'co_leader' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                            'bg-white/5 border-white/5 text-white/50'
                                          }`}>
                                            {member.clan_role === 'leader' ? 'Leader' :
                                             member.clan_role === 'co_leader' ? 'Co-Leader' : 'Member'}
                                          </span>
                                        </td>
                                        <td className="py-4 text-right font-semibold tabular-nums text-white/80">
                                          🪙 {member.tokens?.toLocaleString()}
                                        </td>
                                        {(currentUser.clan_role === 'leader' || currentUser.clan_role === 'co_leader') && (
                                          <td className="py-4 text-right pr-2">
                                            {canManage ? (
                                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {currentUser.clan_role === 'leader' && (
                                                  <>
                                                    {member.clan_role === 'member' ? (
                                                      <button 
                                                        onClick={() => handlePromoteMember(member.username, 'co_leader')}
                                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg font-bold"
                                                        title="Promote to Co-Leader"
                                                      >
                                                        Promote
                                                      </button>
                                                    ) : (
                                                      <button 
                                                        onClick={() => handlePromoteMember(member.username, 'member')}
                                                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-lg font-bold"
                                                        title="Demote to Member"
                                                      >
                                                        Demote
                                                      </button>
                                                    )}
                                                    <button 
                                                      onClick={() => handleTransferLeadership(member.username)}
                                                      className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1 rounded-lg font-bold"
                                                      title="Transfer Clan Leadership"
                                                    >
                                                      Leader
                                                    </button>
                                                  </>
                                                )}
                                                <button 
                                                  onClick={() => handleKickMember(member.username)}
                                                  className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1 rounded-lg font-bold border border-red-500/20 hover:border-transparent transition-colors"
                                                  title="Kick from Clan"
                                                >
                                                  Kick
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-white/20">-</span>
                                            )}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Clan Requirements & Settings */}
                          {(currentUser.clan_role === 'leader' || currentUser.clan_role === 'co_leader') && (
                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-6">
                              <div className="flex items-center gap-3">
                                <Settings2Icon className="w-5 h-5 text-purple-400" />
                                <h2 className="text-xl font-black text-white">Clan Settings</h2>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Logo Emblem</label>
                                  <select 
                                    id="clanEditLogo"
                                    defaultValue={clanDetails.logo}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                                  >
                                    {["🛡️", "⚔️", "👑", "🔥", "🌀", "☠️", "🦊", "🐉", "🦄", "🐼", "🌟"].map(emoji => (
                                      <option key={emoji} value={emoji}>{emoji} Emblem</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Tag Color</label>
                                  <select 
                                    id="clanEditTagColor"
                                    defaultValue={clanDetails.tag_color}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                                  >
                                    {Array.from(new Set([
                                      'text-purple-400', 'text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400',
                                      ...(clanDetails.unlocked_colors || [])
                                    ])).map(color => {
                                      let label = "Color Option";
                                      if (color === 'text-purple-400') label = "Purple";
                                      else if (color === 'text-red-400') label = "Red";
                                      else if (color === 'text-blue-400') label = "Blue";
                                      else if (color === 'text-green-400') label = "Green";
                                      else if (color === 'text-yellow-400') label = "Yellow";
                                      else if (color === 'text-pink-500') label = "Neon Pink";
                                      else if (color === 'text-emerald-400') label = "Neon Emerald";
                                      else if (color === 'text-cyan-400') label = "Neon Cyan";
                                      else if (color.includes('yellow-400')) label = "✨ Gold Gradient";
                                      else if (color.includes('pink-500')) label = "🌈 Chroma Gradient";
                                      else if (color === 'text-pink-400') label = "Pink";
                                      else if (color === 'text-orange-400') label = "Orange";
                                      return (
                                        <option key={color} value={color}>{label}</option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Clan Description</label>
                                <textarea
                                  id="clanEditDescription"
                                  defaultValue={clanDetails.description || ""}
                                  rows={2}
                                  placeholder="Recruiting active players..."
                                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50 resize-none"
                                />
                              </div>

                              <div className="border-t border-white/5 pt-4 space-y-4">
                                <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider">Recruitment Requirements</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Min Tokens</label>
                                    <input 
                                      type="number"
                                      id="clanEditMinTokens"
                                      defaultValue={clanDetails.min_tokens || 0}
                                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Min Boom Rarity</label>
                                    <select 
                                      id="clanEditMinRarity"
                                      defaultValue={clanDetails.min_rarity || "uncommon"}
                                      className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                                    >
                                      {["uncommon", "rare", "epic", "legendary", "chroma", "mystical"].map(rarity => (
                                        <option key={rarity} value={rarity}>{rarity.toUpperCase()}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Required Count</label>
                                    <input 
                                      type="number"
                                      id="clanEditMinRarityCount"
                                      defaultValue={clanDetails.min_rarity_count || 0}
                                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                                    />
                                  </div>
                                </div>
                              </div>

                              <Button 
                                onClick={() => {
                                  const logo = (document.getElementById('clanEditLogo') as HTMLSelectElement).value;
                                  const tagColor = (document.getElementById('clanEditTagColor') as HTMLSelectElement).value;
                                  const desc = (document.getElementById('clanEditDescription') as HTMLTextAreaElement).value;
                                  const minTokens = parseInt((document.getElementById('clanEditMinTokens') as HTMLInputElement).value || '0');
                                  const minRarity = (document.getElementById('clanEditMinRarity') as HTMLSelectElement).value;
                                  const minRarityCount = parseInt((document.getElementById('clanEditMinRarityCount') as HTMLInputElement).value || '0');
                                  
                                  handleUpdateClanInfo(desc, logo, tagColor, minTokens, minRarity, minRarityCount);
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl h-11 border-none text-xs"
                              >
                                Save Clan Settings
                              </Button>
                            </div>
                          )}

                          {/* Clan Upgrades Shop Card */}
                          <div className="bg-gradient-to-br from-indigo-950/20 via-purple-950/20 to-black/30 border border-purple-500/20 rounded-[2rem] p-6 shadow-xl space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                                <h2 className="text-xl font-black text-white">Clan Perks & Upgrades</h2>
                              </div>
                              <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                                <CoinsIcon className="w-3.5 h-3.5" />
                                {clanDetails.bank_tokens.toLocaleString()} Bank Tokens
                              </span>
                            </div>
                            
                            <p className="text-white/50 text-xs">
                              Spend tokens from the Clan Bank to unlock passive capacity bonuses and cosmetics. Only Leaders and Co-Leaders can purchase upgrades.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Member Limit Upgrade */}
                              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-white text-sm">Clan Capacity</h4>
                                  <p className="text-xs text-white/40 font-medium">Increase max member limit. Current: <span className="text-white font-bold">{clanDetails.member_limit || 15}</span></p>
                                </div>
                                <div>
                                  {clanDetails.member_limit >= 30 ? (
                                    <Badge className="bg-green-500/10 border-green-500/20 text-green-400 font-bold w-full justify-center">MAX LEVEL REACHED</Badge>
                                  ) : (
                                    <Button
                                      onClick={() => handleBuyClanUpgrade('member_limit')}
                                      disabled={currentUser.clan_role !== 'leader' && currentUser.clan_role !== 'co_leader'}
                                      className="w-full bg-purple-600 hover:bg-purple-500 text-white border-none text-xs font-bold rounded-xl h-10 transition-all disabled:opacity-50"
                                    >
                                      Upgrade to {clanDetails.member_limit === 20 ? 25 : clanDetails.member_limit === 25 ? 30 : 20} (🪙 {clanDetails.member_limit === 20 ? "25,000" : clanDetails.member_limit === 25 ? "50,000" : "10,000"})
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* XP Multiplier Upgrade */}
                              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-white text-sm">Discover XP Boost</h4>
                                  <p className="text-xs text-white/40 font-medium">Passive multiplier to Clan XP. Current: <span className="text-yellow-400 font-bold">{clanDetails.xp_multiplier || "1.0"}x</span></p>
                                </div>
                                <div>
                                  {clanDetails.xp_multiplier >= 2.0 ? (
                                    <Badge className="bg-green-500/10 border-green-500/20 text-green-400 font-bold w-full justify-center">MAX LEVEL REACHED</Badge>
                                  ) : (
                                    <Button
                                      onClick={() => handleBuyClanUpgrade('xp_multiplier')}
                                      disabled={currentUser.clan_role !== 'leader' && currentUser.clan_role !== 'co_leader'}
                                      className="w-full bg-purple-600 hover:bg-purple-500 text-white border-none text-xs font-bold rounded-xl h-10 transition-all disabled:opacity-50"
                                    >
                                      Upgrade to {clanDetails.xp_multiplier >= 1.5 ? "2.0" : clanDetails.xp_multiplier >= 1.2 ? "1.5" : "1.2"}x (🪙 {clanDetails.xp_multiplier >= 1.5 ? "75,000" : clanDetails.xp_multiplier >= 1.2 ? "35,000" : "15,000"})
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Premium Colors Shop Section */}
                            <div className="border-t border-white/5 pt-4 space-y-3">
                              <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider">Unlock Custom Tag Colors</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                  { code: 'text-pink-500', name: 'Neon Pink', cost: 5000 },
                                  { code: 'text-emerald-400', name: 'Neon Emerald', cost: 5000 },
                                  { code: 'text-cyan-400', name: 'Neon Cyan', cost: 5000 },
                                  { code: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text font-black', name: 'Gold Gradient', cost: 20000 },
                                  { code: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text font-black animate-pulse', name: 'Chroma Gradient', cost: 35000 },
                                ].map(color => {
                                  const isUnlocked = (clanDetails.unlocked_colors || []).includes(color.code);
                                  return (
                                    <div key={color.code} className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between items-center text-center gap-3">
                                      <span className={`text-xs font-black px-2 py-0.5 rounded bg-black/40 border border-white/5 ${color.code}`}>
                                        [{clanDetails.tag}]
                                      </span>
                                      <div className="text-[10px] text-white/50">{color.name}</div>
                                      
                                      {isUnlocked ? (
                                        <Badge className="bg-green-500/10 border-green-500/20 text-green-400 text-[10px] font-bold py-0.5">Unlocked</Badge>
                                      ) : (
                                        <Button
                                          onClick={() => handleBuyClanUpgrade('unlock_color', color.code)}
                                          disabled={currentUser.clan_role !== 'leader' && currentUser.clan_role !== 'co_leader'}
                                          className="w-full bg-yellow-600 hover:bg-yellow-500 text-white border-none text-[9px] font-bold rounded-lg h-7 disabled:opacity-50"
                                        >
                                          🪙 {color.cost.toLocaleString()}
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Clan Bank & Chat (Col Span 1) */}
                        <div className="space-y-8">
                          {/* Donate Box */}
                          <div className="bg-gradient-to-r from-yellow-950/20 to-amber-950/15 border border-yellow-500/20 rounded-[2rem] p-6 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                              <CoinsIcon className="w-5 h-5 text-yellow-500" />
                              <h2 className="text-xl font-black text-white">Clan Bank Donation</h2>
                            </div>
                            <p className="text-white/50 text-xs leading-relaxed">
                              Donate tokens to the clan treasury. 1 token = 1 Clan XP. Helping the clan level up unlocks prestige and future bonuses.
                            </p>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                id="clanDonateAmount"
                                placeholder="Amount..."
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-bold w-full focus:outline-none focus:border-yellow-500/50"
                                min={1}
                              />
                              <Button 
                                onClick={() => {
                                  const input = document.getElementById('clanDonateAmount') as HTMLInputElement;
                                  const val = parseInt(input?.value || '0');
                                  if (val > 0) {
                                    handleDonateToClan(val);
                                    if (input) input.value = '';
                                  } else {
                                    toast.error("Please enter a valid donation amount.");
                                  }
                                }}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl px-4 h-10 border-none animate-pulse"
                              >
                                Donate
                              </Button>
                            </div>
                          </div>

                          {/* Real-time Clan Chat Box */}
                          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col h-[450px]">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_green]" />
                              <h2 className="text-xl font-black text-white">Clan Chat</h2>
                            </div>
                            
                            {/* Messages area */}
                            <ScrollArea className="flex-1 pr-2 mb-4 scrollbar-hide">
                              <div className="space-y-3">
                                {clanChat.map((msg, idx) => (
                                  <div key={msg.id || idx} className="text-xs bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-purple-400">{msg.username}</span>
                                      <span className="text-[9px] text-white/30">
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                      </span>
                                    </div>
                                    <p className="text-white/80 leading-relaxed break-words">{msg.message}</p>
                                  </div>
                                ))}
                                {clanChat.length === 0 && (
                                  <div className="text-center py-12 text-white/20 italic">
                                    No chat activity. Send a message to get started!
                                  </div>
                                )}
                              </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={newClanMessage}
                                onChange={(e) => setNewClanMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') sendClanChatMessage();
                                }}
                                placeholder="Message clan..."
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                              />
                              <Button 
                                onClick={sendClanChatMessage}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-4 h-9 text-xs border-none"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // BROWSE & JOIN / CREATE VIEW
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Browse Clans Column (Col Span 2) */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                        <div>
                          <h2 className="text-3xl font-black text-white tracking-tight">Active Clans</h2>
                          <p className="text-white/40 text-xs">Join an existing squad and play together.</p>
                        </div>
                        <input 
                          type="text"
                          value={searchClanQuery}
                          onChange={(e) => setSearchClanQuery(e.target.value)}
                          placeholder="Search name or tag..."
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs w-full sm:w-64 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      <ScrollArea className="h-[600px] pr-2 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clansList
                            .filter(c => 
                              c.name.toLowerCase().includes(searchClanQuery.toLowerCase()) ||
                              c.tag.toLowerCase().includes(searchClanQuery.toLowerCase())
                            )
                            .map((clan) => (
                              <div key={clan.id} className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl border border-white/5">
                                      {clan.logo}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white leading-tight">{clan.name}</h3>
                                        <span className={`inline-block text-[10px] font-black tracking-tight ${clan.tag_color}`}>
                                          [{clan.tag}]
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-white/40 font-semibold mt-0.5">
                                        Level {clan.level} • {clan.memberCount} members
                                      </p>
                                    </div>
                                  </div>

                                  <p className="text-xs text-white/60 line-clamp-2 min-h-[2rem]">
                                    {clan.description || "No description provided."}
                                  </p>

                                  {/* Requirements badges */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {clan.min_tokens > 0 && (
                                      <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] font-bold">
                                        🪙 {clan.min_tokens.toLocaleString()}
                                      </Badge>
                                    )}
                                    {clan.min_rarity_count > 0 && (
                                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold">
                                        📦 {clan.min_rarity_count}x {clan.min_rarity.toUpperCase()}+
                                      </Badge>
                                    )}
                                    {clan.min_tokens === 0 && clan.min_rarity_count === 0 && (
                                      <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                                        Open Join
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <Button 
                                  onClick={() => handleJoinClan(clan.id)}
                                  className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl h-10 border-none text-xs"
                                >
                                  Request to Join
                                </Button>
                              </div>
                            ))}
                          {clansList.filter(c => 
                            c.name.toLowerCase().includes(searchClanQuery.toLowerCase()) ||
                            c.tag.toLowerCase().includes(searchClanQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="col-span-full text-center py-20 text-white/20 italic">
                              No clans matching your search.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Create Clan Column */}
                    <div className="bg-[#0a0a0c]/60 border border-white/10 rounded-[2.5rem] p-8 shadow-xl space-y-6 h-fit">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Create a Clan</h2>
                        <p className="text-white/40 text-xs">Establish your dynasty and gather followers.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Clan Name</label>
                          <input 
                            type="text"
                            value={createClanForm.name}
                            onChange={(e) => setCreateClanForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Legendary Squad..."
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Clan Tag (3-6 chars)</label>
                          <input 
                            type="text"
                            value={createClanForm.tag}
                            onChange={(e) => setCreateClanForm(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                            placeholder="LEGEND"
                            maxLength={6}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Description</label>
                          <textarea
                            value={createClanForm.description}
                            onChange={(e) => setCreateClanForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your clan mission..."
                            rows={3}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Clan Emblem</label>
                            <select 
                              value={createClanForm.logo}
                              onChange={(e) => setCreateClanForm(prev => ({ ...prev, logo: e.target.value }))}
                              className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                            >
                              {["🛡️", "⚔️", "👑", "🔥", "🌀", "☠️", "🦊", "🐉", "🦄", "🐼", "🌟"].map(emoji => (
                                <option key={emoji} value={emoji}>{emoji} Emblem</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-wider">Tag Color</label>
                            <select 
                              value={createClanForm.tagColor}
                              onChange={(e) => setCreateClanForm(prev => ({ ...prev, tagColor: e.target.value }))}
                              className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs w-full focus:outline-none focus:border-purple-500/50"
                            >
                              <option value="text-purple-400">Purple</option>
                              <option value="text-red-400">Red</option>
                              <option value="text-blue-400">Blue</option>
                              <option value="text-green-400">Green</option>
                              <option value="text-yellow-400">Yellow</option>
                              <option value="text-pink-400">Pink</option>
                              <option value="text-cyan-400">Cyan</option>
                              <option value="text-orange-400">Orange</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between text-xs pt-3">
                          <span className="font-semibold text-white/60">Creation Price:</span>
                          <span className="font-bold text-yellow-400 flex items-center gap-1">🪙 5,000 tokens</span>
                        </div>

                        <Button 
                          onClick={handleCreateClan}
                          disabled={isCreatingClan}
                          className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl border-none text-xs flex items-center justify-center gap-2"
                        >
                          {isCreatingClan ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Clan...
                            </span>
                          ) : 'Create Clan'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Tournaments Page */}
            {currentPage === "tournaments" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50 mb-2 font-black">
                      Tournaments
                    </h1>
                    <p className="text-white/60 text-lg">Compete with others for massive prizes! 🏆</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Active Tournaments */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <TrophyIcon className="h-6 w-6 text-yellow-400" />
                      Ongoing & Upcoming
                    </h3>
                    {activeTournaments.length === 0 ? (
                      <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center text-white/30">
                        <TrophyIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No tournaments right now</p>
                        <p className="text-xs">Check back later for seasonal events!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {activeTournaments.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTournament(t)
                              fetchTournamentParticipants(t.id)
                            }}
                            className={`bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-yellow-500/50 transition-all group ${selectedTournament?.id === t.id ? 'border-yellow-500 ring-2 ring-yellow-500/20 shadow-lg shadow-yellow-500/10' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">{t.title}</h4>
                                <div className="text-sm text-white/50">{t.description}</div>
                              </div>
                              <Badge className={`${t.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white font-black uppercase text-[10px]`}>
                                {t.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4">
                              <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-white/5">
                                <CoinsIcon className="w-4 h-4 text-yellow-400" />
                                <span className="text-white font-black">{t.prize_tokens?.toLocaleString() || 0}</span>
                              </div>
                              {t.prize_boom_name && (
                                <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-white/5">
                                  <span className="text-lg">{getBoomAvatar(t.prize_boom_name)}</span>
                                  <span className="text-white font-black uppercase text-xs">{t.prize_boom_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-white/5 ml-auto">
                                <CalendarIcon className="w-4 h-4 text-white/40" />
                                <span className="text-white/40 text-xs font-bold">Ends: {new Date(t.end_time).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {t.status === 'active' && (
                              !currentUser?.clan_id ? (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toast.error("You must join or create a Clan first to participate in tournaments!")
                                    setCurrentPage("clans")
                                  }}
                                  className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl h-12 border border-white/10"
                                >
                                  Join a Clan to Participate
                                </Button>
                              ) : (
                                (() => {
                                  const isRegistered = tournamentParticipants.some(p => p.clan_id === currentUser.clan_id && p.tournament_id === t.id);
                                  if (!isRegistered) {
                                    return (
                                      <Button
                                        onClick={(e) => { e.stopPropagation(); handleJoinTournament(t.id) }}
                                        className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-black rounded-xl h-12 shadow-lg shadow-yellow-600/20"
                                      >
                                        Register Clan for Tournament
                                      </Button>
                                    );
                                  }

                                  // Find stats
                                  const myClanPart = tournamentParticipants.find(p => p.clan_id === currentUser.clan_id && p.tournament_id === t.id);
                                  const myClanIdx = tournamentParticipants.findIndex(p => p.clan_id === currentUser.clan_id && p.tournament_id === t.id);
                                  const myClanRank = myClanIdx !== -1 ? myClanIdx + 1 : "Unranked";
                                  const gamesPlayed = myClanPart?.games_played || 0;
                                  const totalScore = myClanPart?.score || 0;
                                  const avgScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
                                  
                                  // Motivational status based on rank
                                  let motivation = "Keep pushing to climb the ranks! ⚡";
                                  if (myClanRank === 1) motivation = "Defending the Crown! 👑 You are leading the pack!";
                                  else if (myClanRank === 2 || myClanRank === 3) motivation = "Podium spot secured! Push for #1! 🚀";
                                  else if (myClanRank !== "Unranked" && myClanRank <= 5) motivation = "Top 5! You are close to the podium! 🔥";

                                  return (
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-3 relative overflow-hidden group cursor-default"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                                      
                                      <div className="flex justify-between items-center relative z-10">
                                        <div>
                                          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Tournament Entry Status</span>
                                          <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Your Clan is Registered! 🛡️
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[9px] font-black uppercase text-white/30 tracking-wider">Clan Rank</span>
                                          <div className="text-lg font-black text-yellow-400">
                                            {myClanRank !== "Unranked" ? `#${myClanRank}` : myClanRank}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-white/5 relative z-10">
                                        <div className="text-center">
                                          <div className="text-[9px] font-black text-white/30 uppercase">Score</div>
                                          <div className="text-sm font-black text-white tabular-nums">{totalScore.toLocaleString()}</div>
                                        </div>
                                        <div className="text-center border-l border-r border-white/5">
                                          <div className="text-[9px] font-black text-white/30 uppercase">Games</div>
                                          <div className="text-sm font-black text-white tabular-nums">{gamesPlayed}</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-[9px] font-black text-white/30 uppercase">Avg Score</div>
                                          <div className="text-sm font-black text-white tabular-nums">{avgScore}</div>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-white/50 italic font-medium relative z-10">
                                        {motivation}
                                      </p>

                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toast.success("Entering Tournament Arena! Play discover quizzes to earn points for your clan.");
                                          setCurrentPage("discover");
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-lg h-9 text-xs shadow-md shadow-purple-600/20 relative z-10 transition-all hover:scale-102"
                                      >
                                        ⚡ Launch Tournament Arena
                                      </Button>
                                    </div>
                                  );
                                })()
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leaderboard for selected tournament */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <StarIcon className="h-6 w-6 text-purple-400" />
                      Leaderboard
                    </h3>
                    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
                      {!selectedTournament ? (
                        <div className="flex-1 flex items-center justify-center p-8 text-center text-white/20 italic text-sm">
                          Select a tournament to view its legends
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2 mb-2 flex justify-between">
                            <span>Clan / Games</span>
                            <span>Total Score</span>
                          </div>
                          {tournamentParticipants.map((p, idx) => {
                            const isMyClan = p.clan_id === currentUser?.clan_id;
                            const clan = p.clans;
                            return (
                              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMyClan ? 'bg-purple-500/20 border-purple-500/30' : 'bg-white/5 border-transparent'} hover:bg-white/10 transition-colors`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-orange-500 text-white' : 'bg-white/20 text-white'}`}>
                                  {idx + 1}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm border border-white/10">
                                  {clan?.logo || "🛡️"}
                                </div>
                                <div className="flex-grow flex flex-col font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-sm truncate max-w-[120px]">{clan?.name || "Unknown Clan"}</span>
                                    <span className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded bg-black/40 border border-white/5 ${clan?.tag_color || "text-purple-400"}`}>
                                      [{clan?.tag || "???"}]
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-white/40 uppercase font-black">{p.games_played} Games Played</div>
                                </div>
                                <div className="text-white font-black text-lg">{p.score}</div>
                              </div>
                            );
                          })}
                          {tournamentParticipants.length === 0 && (
                            <div className="text-center py-12 text-white/20 text-sm">No clans have scored yet. Go for it!</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Fusion Lab Page */}
            {currentPage === "fusion" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-2 font-black">
                      Fusion Lab
                    </h1>
                    <p className="text-white/60 text-lg">Combine two Booms to create something legendary. High risk, high reward. 🧪</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Fusion Slots */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      {currentUser?.active_fusion_boom1 ? (
                        /* Active Fusion Ongoing / Claim View */
                        (() => {
                          const boom1 = currentUser.active_fusion_boom1;
                          const boom2 = currentUser.active_fusion_boom2 || boom1;
                          
                          const activeFusionEndsAt = currentUser.active_fusion_ends_at ? new Date(currentUser.active_fusion_ends_at).getTime() : 0;
                          const activeFusionStartedAt = currentUser.active_fusion_started_at ? new Date(currentUser.active_fusion_started_at).getTime() : 0;
                          const activeFusionRemaining = Math.max(0, Math.ceil((activeFusionEndsAt - timeNow) / 1000));
                          
                          const totalDuration = Math.max(1, Math.round((activeFusionEndsAt - activeFusionStartedAt) / 1000));
                          const percentDone = Math.min(100, Math.max(0, Math.round(((totalDuration - activeFusionRemaining) / totalDuration) * 100)));
                          
                          const formatTime = (secs: number) => {
                            const m = Math.floor(secs / 60);
                            const s = secs % 60;
                            return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
                          };

                          return (
                            <div className="w-full flex flex-col items-center justify-center relative z-10 space-y-6">
                              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest animate-pulse">
                                {activeFusionRemaining > 0 ? "FUSION IN PROGRESS" : "FUSION COMPLETE"}
                              </h3>

                              <div className="flex items-center gap-8 py-6">
                                {/* Boom 1 */}
                                <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 w-28 h-28 justify-center shadow-lg">
                                  <span className="text-4xl">{getBoomAvatar(boom1)}</span>
                                  <span className="text-[9px] font-black text-white/60 mt-2 uppercase truncate w-full text-center">{boom1}</span>
                                </div>

                                {/* Animation / Status Icon */}
                                <div className="flex flex-col items-center">
                                  {activeFusionRemaining > 0 ? (
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/30 animate-spin" style={{ animationDuration: '6s' }} />
                                      <div className="absolute w-12 h-12 rounded-full border-4 border-double border-purple-500/50 animate-pulse" />
                                      <BeakerIcon className="w-6 h-6 text-blue-400 animate-bounce" />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center animate-bounce">
                                      <span className="text-2xl">✨</span>
                                    </div>
                                  )}
                                </div>

                                {/* Boom 2 */}
                                <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 w-28 h-28 justify-center shadow-lg">
                                  <span className="text-4xl">{getBoomAvatar(boom2)}</span>
                                  <span className="text-[9px] font-black text-white/60 mt-2 uppercase truncate w-full text-center">{boom2}</span>
                                </div>
                              </div>

                              {activeFusionRemaining > 0 ? (
                                /* Counting Down */
                                <div className="w-full max-w-md flex flex-col items-center space-y-4">
                                  <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/10 p-0.5">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 shadow-md shadow-blue-500/50" 
                                      style={{ width: `${percentDone}%` }} 
                                    />
                                  </div>
                                  <div className="flex justify-between w-full text-xs font-black text-white/40 uppercase tracking-wider">
                                    <span>Time Left: {formatTime(activeFusionRemaining)}</span>
                                    <span>{percentDone}% Complete</span>
                                  </div>
                                  <p className="text-white/40 text-xs italic text-center">
                                    Molecular restructuring in progress. Do not refresh. ⏳
                                  </p>
                                </div>
                              ) : (
                                /* Ready to Claim */
                                <div className="w-full flex flex-col items-center space-y-4">
                                  <Button
                                    onClick={handleClaimFusion}
                                    disabled={isFusing}
                                    className="px-12 py-8 rounded-2xl font-black text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-2xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-all"
                                  >
                                    {isFusing ? (
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        CLAIMING...
                                      </div>
                                    ) : (
                                      '🧪 CLAIM FUSION RESULT'
                                    )}
                                  </Button>
                                  <p className="text-green-400/80 text-xs font-black uppercase tracking-wider">
                                    Ready to retrieve! Click to view your new Boom. 🎉
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        /* Normal Slots / Setup View */
                        (() => {
                          const cooldownEndsAt = currentUser?.fusion_cooldown_ends_at ? new Date(currentUser.fusion_cooldown_ends_at).getTime() : 0;
                          const cooldownRemaining = Math.max(0, Math.ceil((cooldownEndsAt - timeNow) / 1000));
                          
                          const formatTime = (secs: number) => {
                            const m = Math.floor(secs / 60);
                            const s = secs % 60;
                            return `${m}m ${s.toString().padStart(2, '0')}s`;
                          };

                          return (
                            <div className="w-full flex flex-col items-center justify-center relative z-10">
                              <div className="flex items-center gap-12 relative z-10">
                                {/* Slot 1 */}
                                <div
                                  onClick={() => !cooldownRemaining && setFusionSlot1(null)}
                                  className={`w-32 h-32 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${cooldownRemaining ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed' : fusionSlot1 ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 cursor-pointer' : 'border-white/10 bg-white/5 hover:border-white/20 cursor-pointer'}`}
                                >
                                  {fusionSlot1 ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-5xl">{getBoomAvatar(fusionSlot1)}</span>
                                      <span className="text-[10px] font-black text-white mt-1 uppercase">{fusionSlot1}</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center text-white/20">
                                      <BeakerIcon className="w-8 h-8 mb-2" />
                                      <span className="text-[10px] font-black uppercase">Slot 1</span>
                                    </div>
                                  )}
                                </div>

                                {/* Plus Icon */}
                                <div className="text-white/20 text-4xl font-black">+</div>

                                {/* Slot 2 */}
                                <div
                                  onClick={() => !cooldownRemaining && setFusionSlot2(null)}
                                  className={`w-32 h-32 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${cooldownRemaining ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed' : fusionSlot2 ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 cursor-pointer' : 'border-white/10 bg-white/5 hover:border-white/20 cursor-pointer'}`}
                                >
                                  {fusionSlot2 ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-5xl">{getBoomAvatar(fusionSlot2)}</span>
                                      <span className="text-[10px] font-black text-white mt-1 uppercase">{fusionSlot2}</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center text-white/20">
                                      <BeakerIcon className="w-8 h-8 mb-2" />
                                      <span className="text-[10px] font-black uppercase">Slot 2</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {cooldownRemaining > 0 ? (
                                /* Cooldown Active Block */
                                <div className="mt-8 flex flex-col items-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 max-w-sm w-full">
                                  <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider">
                                    <ClockIcon className="w-4 h-4 animate-pulse" />
                                    Reactor Overheated
                                  </div>
                                  <div className="text-2xl font-black text-white tabular-nums">
                                    {formatTime(cooldownRemaining)}
                                  </div>
                                  <p className="text-[10px] text-white/40 text-center font-medium uppercase tracking-wide">
                                    Next fusion cooldown: {5 * Math.pow(2, currentUser?.consecutive_fusions || 0)}m (Consecutive: {currentUser?.consecutive_fusions || 0})
                                  </p>
                                </div>
                              ) : (
                                /* Start Fusion Button */
                                <Button
                                  onClick={handleFusion}
                                  disabled={!fusionSlot1 || !fusionSlot2 || isFusing}
                                  className={`mt-12 px-12 py-8 rounded-2xl font-black text-xl transition-all relative z-10 ${!fusionSlot1 || !fusionSlot2 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95'}`}
                                >
                                  {isFusing ? (
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                      FUSING...
                                    </div>
                                  ) : (
                                    'START FUSION'
                                  )}
                                </Button>
                              )}

                              {/* Warning */}
                              <p className="mt-6 text-white/20 text-[10px] font-black uppercase tracking-widest text-center">
                                Warning: Fusion carries a 30% chance of total loss.<br />Results are random within the tier.
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Inventory Helper for Fusion */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Select Materials</h3>
                      
                      {(() => {
                        const boomsByRarity: Record<string, { name: string; count: number }[]> = {
                          uncommon: [],
                          rare: [],
                          epic: [],
                          legendary: [],
                          chroma: [],
                          mystical: [],
                        };

                        Object.entries(currentUser?.booms || {}).forEach(([name, count]) => {
                          if ((count as number) > 0) {
                            const rarity = getBoomRarity(name);
                            if (boomsByRarity[rarity]) {
                              boomsByRarity[rarity].push({ name, count: count as number });
                            } else {
                              boomsByRarity["uncommon"].push({ name, count: count as number });
                            }
                          }
                        });

                        const rarityTiers = [
                          { key: "uncommon", label: "Uncommon", color: "text-green-400 border-green-500/20 bg-green-500/5" },
                          { key: "rare", label: "Rare", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
                          { key: "epic", label: "Epic", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
                          { key: "legendary", label: "Legendary", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
                          { key: "chroma", label: "Chroma", color: "text-pink-400 border-pink-500/20 bg-pink-500/5" },
                          { key: "mystical", label: "Mystical", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
                        ];

                        const hasAnyBooms = Object.values(boomsByRarity).some(arr => arr.length > 0);

                        if (!hasAnyBooms) {
                          return (
                            <div className="text-center py-12 text-white/20 italic">
                              You do not own any Booms to fuse.
                            </div>
                          );
                        }

                        return rarityTiers.map(tier => {
                          const booms = boomsByRarity[tier.key];
                          if (booms.length === 0) return null;
                          
                          return (
                            <div key={tier.key} className="space-y-3">
                              <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border w-fit ${tier.color}`}>
                                {tier.label}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {booms.map(({ name, count }) => (
                                  <div
                                    key={name}
                                    onClick={() => {
                                      if (fusionSlot1 === name) {
                                        setFusionSlot1(null)
                                      } else if (fusionSlot2 === name) {
                                        setFusionSlot2(null)
                                      } else if (!fusionSlot1) {
                                        setFusionSlot1(name)
                                      } else if (!fusionSlot2) {
                                        const currentCount = count || 0
                                        if (fusionSlot1 === name && currentCount < 2) {
                                          toast.error(`You only have 1 copy of ${name}. Fusing requires 2 copies of the same Boom or two different Booms.`)
                                          return
                                        }
                                        setFusionSlot2(name)
                                      }
                                    }}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center ${fusionSlot1 === name || fusionSlot2 === name ? 'bg-blue-600/20 border-blue-500' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                                  >
                                    <div className="text-3xl mb-2">{getBoomAvatar(name)}</div>
                                    <div className="text-[10px] font-black text-white text-center uppercase truncate w-full">{name}</div>
                                    <div className="text-[10px] font-black text-white/40 mt-1">x{count}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Fusion History / Info Case */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-lg font-black text-blue-400 mb-4 uppercase">Lab Records</h3>
                      <div className="space-y-4">
                        {userActivity.filter(a => a.activity_type === 'fusion').slice(0, 5).map(a => (
                          <div key={a.id} className="flex gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                            <div>
                              <p className="text-white/80 font-bold">{a.description}</p>
                              <p className="text-white/20 font-black uppercase text-[10px]">{new Date(a.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                        {userActivity.filter(a => a.activity_type === 'fusion').length === 0 && (
                          <p className="text-white/20 italic text-sm">No recent fusion attempts.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h4 className="text-xs font-black text-white/60 mb-2 uppercase">Probability Matrix</h4>
                      <ul className="space-y-3">
                        <li className="flex justify-between text-xs">
                          <span className="text-white/40">Item Upgrade</span>
                          <span className="text-green-400 font-black">30%</span>
                        </li>
                        <li className="flex justify-between text-xs">
                          <span className="text-white/40">Random Same Tier</span>
                          <span className="text-blue-400 font-black">40%</span>
                        </li>
                        <li className="flex justify-between text-xs">
                          <span className="text-white/40">Fusion Failure</span>
                          <span className="text-red-400 font-black">30%</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Shop Page */}
            {currentPage === "shop" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 mb-2 font-black">
                      The Marketplace
                    </h1>
                    <p className="text-white/60 text-lg">Direct access to Booms & Packs. The economy starts here. 💎</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl px-6 py-3 border border-white/10 flex items-center gap-3">
                    <CoinsIcon className="w-6 h-6 text-yellow-500" />
                    <span className="text-2xl font-black text-white">{currentUser?.tokens.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {shopItems.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-white/20 italic">
                      The shop is empty today. Check back soon!
                    </div>
                  ) : (
                    shopItems.map((item) => (
                      <div key={item.id} className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-3xl p-6 flex flex-col items-center group hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                        <div className="text-7xl mb-4 group-hover:scale-110 transition-transform drop-shadow-2xl">
                          {getBoomAvatar(item.boom_name)}
                        </div>
                        <Badge className={`${getRarityColor(getBoomRarity(item.boom_name))} mb-2 px-3 uppercase text-[10px] font-black`}>
                          {getBoomRarity(item.boom_name)}
                        </Badge>
                        <h4 className="text-xl font-black text-white mb-1">{item.boom_name}</h4>
                        <div className="text-sm text-white/40 mb-4 font-bold">
                          {item.stock === -1 ? 'Unlimited Stock' : `${item.stock} Remaining`}
                        </div>

                        {/* Market Trend */}
                        {item.base_price && item.current_price && (
                          <div className="flex items-center gap-1 mb-4">
                            <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.current_price >= item.base_price ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {item.current_price >= item.base_price ? '▲' : '▼'}
                              {Math.abs(Math.round(((item.current_price - item.base_price) / item.base_price) * 100))}%
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase">Trend</span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleBuyShopItem(item.id)}
                          disabled={item.stock === 0 || (currentUser?.tokens || 0) < item.token_cost}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl h-12 shadow-lg shadow-blue-600/20 disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                          <CoinsIcon className="w-4 h-4" />
                          {item.token_cost.toLocaleString()}
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Token Store Section */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mt-12">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                        💳 Get More Tokens
                      </h3>
                      <p className="text-purple-200/60 font-bold max-w-md">
                        Need a boost? Purchase tokens instantly with secure Stripe checkout to unlock the rarest Booms.
                      </p>
                    </div>
                    <div className="w-full md:w-auto">
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
                </div>
              </div>
            )}
            {/* Season Pass Page */}
            {currentPage === "season" && (
              activeSeason ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-200 to-orange-600 mb-2 font-black">
                      {activeSeason.name}
                    </h1>
                    <p className="text-white/60 text-lg">Level up your pass to unlock exclusive rewards! 🔥</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Ends In</div>
                    <div className="text-white font-bold">{new Date(activeSeason.end_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                      style={{ width: `${Math.min(100, ((currentUser?.season_xp || 0) / (seasonRewards[seasonRewards.length - 1]?.xp_required || 1000)) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                        {Math.floor((currentUser?.season_xp || 0) / 100)}
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">Season Level</div>
                        <div className="text-white/40 font-bold">{currentUser?.season_xp || 0} XP Total</div>
                      </div>
                    </div>
                    {!currentUser?.has_plus_pass && (
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black px-8 py-6 rounded-2xl shadow-xl shadow-purple-600/20">
                        Upgrade to Plus Pass
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {seasonRewards.map((r) => {
                      const isUnlocked = (currentUser?.season_xp || 0) >= r.xp_required;
                      const isClaimed = userActivity.some(act => act.activity_type === 'season_claim' && act.details?.reward_id === r.id);

                      return (
                        <div key={r.id} className={`flex items-center gap-6 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${isUnlocked ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'}`}>
                            T{r.tier}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              {r.reward_type === 'boom' ? (
                                <span className="text-2xl">{getBoomAvatar(r.reward_value)}</span>
                              ) : (
                                <CoinsIcon className="w-5 h-5 text-yellow-500" />
                              )}
                              <span className="text-white font-black">{r.reward_value} {r.reward_type}</span>
                              {r.is_premium && <Badge className="bg-purple-600 text-white text-[8px] font-black uppercase">Plus</Badge>}
                            </div>
                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{r.xp_required} XP Required</div>
                          </div>
                          <Button
                            disabled={!isUnlocked || isClaimed || (r.is_premium && !currentUser?.has_plus_pass)}
                            onClick={() => handleClaimReward(r.id)}
                            className={`rounded-xl font-black px-6 ${isClaimed ? 'bg-green-600/20 text-green-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                          >
                            {isClaimed ? 'Claimed' : isUnlocked ? 'Claim' : 'Locked'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 max-w-xl mx-auto text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <FlameIcon className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">No Active Season Pass</h3>
                <p className="text-slate-400 font-medium max-w-md mb-6">
                  Keep earning XP in the arena and look out for the next season starting soon! 🔥
                </p>
              </div>
            )
          )}

            {/* Achievements Page */}
            {currentPage === "achievements" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-white to-yellow-600 mb-2 font-black">
                      Hall of Legends
                    </h1>
                    <p className="text-white/60 text-lg">Your legacy is written in the stars. 🌟</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{userAchievements.length} / {achievements.length}</div>
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Completed</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((ach) => {
                    const isCompleted = userAchievements.includes(ach.id);
                    return (
                      <div key={ach.id} className={`relative p-6 rounded-3xl border group transition-all ${isCompleted ? 'bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/50 shadow-xl shadow-yellow-500/10' : 'bg-white/5 border-white/10 grayscale opacity-60'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{ach.icon}</div>
                          {isCompleted && <div className="bg-yellow-500 text-black rounded-full p-1"><CheckIcon className="w-4 h-4" /></div>}
                        </div>
                        <h4 className="text-xl font-black text-white mb-2">{ach.name}</h4>
                        <p className="text-sm text-white/60 mb-6 font-medium leading-relaxed">{ach.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <CoinsIcon className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-black text-sm">{ach.reward_tokens.toLocaleString()}</span>
                          </div>
                          <Badge className="bg-white/10 text-white/40 text-[8px] font-black uppercase">{ach.requirement_type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discover Page */}
            {currentPage === "discover" && !isMergingGameActive && !lobbyActive && (
              <DiscoverPage
                currentUser={currentUser}
                discoveredSets={discoveredSets}
                onStartGame={async (grade, subject, mode, questions) => {
                  if (mode === "host") {
                    setHostingSubject({ grade, subject })
                    // Pass questions in a way that the hosting flow can use them
                    if (questions) (setHostingSubject as any)((prev: any) => ({ ...prev, questions }))
                    setHostingFlow("mode-select")
                    return
                  }

                  // Solo game flow - Switch to mode selection first
                  setSoloSubject({ grade, subject })
                  if (questions) (setSoloSubject as any)((prev: any) => ({ ...prev, questions }))
                  setSoloFlow("mode-select")
                }}
                onJoinGame={async (pin) => {
                  if (!pin) return

                  const cleanPin = pin.trim()

                  if (supabase) {
                    const { data: session, error } = await supabase
                      .from("game_sessions")
                      .select("*")
                      .eq("pin", cleanPin)
                      .single()

                    if (error) {
                      console.error("Join Error:", error)
                      alert(`Join Error: ${error.message || "Session not found"}. Ensure the host has already created the game and you have a stable connection.`)
                      return
                    }

                    if (!session) {
                      alert("Room not found. Please double check the 6-digit PIN.")
                      return
                    }

                    console.log("Joined session from Supabase:", cleanPin)

                    // Join game flow: Just set PIN and state, let GameLobby handle the DB registration
                    setActiveGamePin(cleanPin)
                    setActiveDiscoverGame({
                      grade: session.grade,
                      subject: session.subject,
                      mode: "join",
                      gameMode: session.mode || "classic",
                      questions: session.questions,
                      duration: session.duration
                    })
                    setLobbyActive(true)
                  } else {
                    alert("Connecting to server...")
                  }
                }}
                onCreateWithAI={() => setShowAiSetCreator(true)}
              />
            )}

            {currentPage === "discover" && lobbyActive && activeDiscoverGame && (
              <GameLobby
                supabase={supabase}
                pin={activeGamePin}
                mode={activeDiscoverGame.mode as "host" | "join"}
                subject={activeDiscoverGame.subject}
                grade={activeDiscoverGame.grade}
                currentUser={currentUser}
                onStart={(duration, questions) => {
                  setSelectedDuration(duration)
                  if (activeDiscoverGame) {
                    setActiveDiscoverGame({
                      ...activeDiscoverGame,
                      duration: duration,
                      questions: questions || activeDiscoverGame.questions
                    })
                  }
                  setIsMergingGameActive(true)
                  setLobbyActive(false)
                }}
                onCancel={() => {
                  setLobbyActive(false)
                  setActiveGamePin("")
                }}
              />
            )}

            {currentPage === "discover" && isMergingGameActive && activeDiscoverGame && (
              activeDiscoverGame.gameMode === "fishing-frenzy" ? (
                <div className={`w-full h-full transition-transform duration-500 origin-center ${activeDiscoverGame.mode === "host" ? "scale-[0.85]" : ""}`}>
                  <FishingFrenzy
                    grade={activeDiscoverGame.grade}
                    subject={activeDiscoverGame.subject}
                    mode={activeDiscoverGame.mode as "solo" | "host" | "join"}
                    gameMode={activeDiscoverGame.gameMode}
                    questions={activeDiscoverGame.questions}
                    durationSeconds={activeDiscoverGame.duration || 600}
                    startTimeOffset={gameStartOffset}
                    onEnd={(score) => {
                      // Final unthrottled sync
                      handleScoreUpdate(score, true)
                      setGameScore(score)
                      setIsMergingGameActive(false)
                      setShowGameResults(true)

                      // Award Rewards
                      const tokenReward = Math.floor(score / 5)
                      const xpReward = Math.floor(score / 2)

                      if (currentUser) {
                        const updatedUser = {
                          ...currentUser,
                          tokens: (currentUser.tokens || 0) + tokenReward,
                          xp: (currentUser.xp || 0) + xpReward
                        }
                        // Leveling is handled inside awardXP but we can just update state here and let the next sync handle it
                        // Or better yet, use awardXP logic
                        awardXP(xpReward)
                        awardBoomXP(Math.floor(score / 4)) // Bonus XP for the pinned boom
                        updateAndPersistCurrentUser({
                          ...updatedUser,
                          // awardXP might have incremented level, let's just make sure we are consistent
                          tokens: updatedUser.tokens
                        })
                      }
                    }}
                    onScoreUpdate={handleScoreUpdate}
                    onAwardTokens={(amount) => {
                      if (currentUser) {
                        updateAndPersistCurrentUser({
                          ...currentUser,
                          tokens: (currentUser.tokens || 0) + amount
                        })
                      }
                    }}
                  />
                </div>
              ) : (
                <MergingGame
                  grade={activeDiscoverGame.grade}
                  subject={activeDiscoverGame.subject}
                  mode={activeDiscoverGame.mode as "solo" | "host" | "join"}
                  gameMode={activeDiscoverGame.gameMode}
                  questions={activeDiscoverGame.questions}
                  durationSeconds={activeDiscoverGame.duration || 600}
                  startTimeOffset={gameStartOffset}
                  onEnd={(score, correctAnswers) => {
                    // Final unthrottled sync
                    handleScoreUpdate(score, true)
                    setGameScore(score)
                    setIsMergingGameActive(false)
                    setShowGameResults(true)

                    // Grade-based Reward Logic
                    // Grade 1: 1 * correctAnswers
                    // Grade 2: 2 * correctAnswers
                    // ... etc
                    const xpReward = activeDiscoverGame.grade * (correctAnswers || 0)
                    const tokenReward = Math.floor(score / 5)

                    if (currentUser) {
                      awardXP(xpReward)
                      awardBoomXP(Math.floor(score / 4)) // Bonus XP for the pinned boom
                      updateAndPersistCurrentUser({
                        ...currentUser,
                        tokens: (currentUser.tokens || 0) + tokenReward
                      })
                    }
                  }}
                  onScoreUpdate={handleScoreUpdate}
                  onAwardTokens={(amount) => {
                    if (currentUser) {
                      updateAndPersistCurrentUser({
                        ...currentUser,
                        tokens: (currentUser.tokens || 0) + amount
                      })
                    }
                  }}
                />
              )
            )}

            {/* Live Leaderboard Overlay during game */}
            {isMergingGameActive && activeGamePin && livePlayers.length > 0 && (
              <div className="fixed top-24 right-8 z-[60] w-64 animate-in slide-in-from-right-10 duration-500 hidden lg:block">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600/50 to-blue-600/50 p-3 border-b border-white/10">
                    <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                      <TrophyIcon className="w-3 h-3 text-yellow-400" />
                      Live Rankings
                    </h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto">
                      {[...livePlayers].filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((player, idx) => (
                        <div key={player.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black ${idx === 0 ? "text-yellow-400" : "text-white/40"}`}>#{idx + 1}</span>
                            <span className="text-white font-bold text-sm truncate w-24">{player.username}</span>
                          </div>
                          <Badge variant="outline" className="bg-white/5 text-cyan-400 border-cyan-500/20 font-black text-[10px]">
                            {player.score || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div >

      {/* MODALS */}
      {
        showV2NewsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Backdrop with blur and dark tint */}
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowV2NewsModal(false)}
            />

            <Card className="w-full max-w-2xl bg-slate-900 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] relative z-10 overflow-hidden flex flex-col max-h-[85vh] rounded-3xl">
              <CardHeader className="border-b border-white/5 pb-4 bg-gradient-to-r from-purple-900/50 via-slate-900 to-indigo-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                      Major Release
                    </Badge>
                    <CardTitle className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                      🚀 BOOMKIT V2 IS OUT!
                    </CardTitle>
                    <CardDescription className="text-purple-300/80 font-semibold tracking-wide text-xs">
                      The Ultimate Gamified Learning Adventure Upgrade
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowV2NewsModal(false)}
                    className="rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide text-slate-200">
                <div className="space-y-3">
                  <p className="text-sm md:text-base font-medium leading-relaxed">
                    Welcome to **Boomkit V2**! We have completely overhauled the platform to bring you a premium, secure, and feature-rich educational arena. Here are the major additions and changes you can explore starting today:
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-purple-400">
                    🛠️ v2.0.0 Patch Notes & Features
                  </h4>
                  
                  <div className="grid gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🛡️</span>
                        <h5 className="font-bold text-white text-sm md:text-base">Clans & Teams</h5>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-7">
                        Create or join a Clan, set custom tag colors, manage recruitment requirements, chat in real-time with clan mates, and donate tokens to the shared bank to level up your clan!
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🧪</span>
                        <h5 className="font-bold text-white text-sm md:text-base">High-Tier Fusion Lab</h5>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-7">
                        Combine duplicate Booms (like *DeepSeek*, *Parrot*, or *Kraken*) in the upgraded Fusion Lab to roll for higher rarity tiers and clone rare items.
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🤝</span>
                        <h5 className="font-bold text-white text-sm md:text-base">Secure Peer-to-Peer Trading</h5>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-7">
                        Trade Booms safely with friends. Secure database RPC functions and UI blocks prevent trades with banned or rejected users.
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🏆</span>
                        <h5 className="font-bold text-white text-sm md:text-base">Staff Live Tournaments & Seasons</h5>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-7">
                        Staff members can now host live competitions and start new seasons complete with a custom Season Pass, powered by secure bypass-RLS operations.
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🤖</span>
                        <h5 className="font-bold text-white text-sm md:text-base">Gemini 2.5 Quiz Generation</h5>
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-7">
                        Quizzes are now generated with Google's fast and smart `gemini-2.5-flash-lite` AI model for maximum topic relevance and progression.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="p-6 bg-slate-950 border-t border-white/5">
                <Button
                  onClick={() => setShowV2NewsModal(false)}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-base rounded-xl shadow-[0_5px_15px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  LET'S PLAY BOOMKIT V2!
                </Button>
              </div>
            </Card>
          </div>
        )
      }
      {
        showNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
            {/* Backdrop with extreme blur and dark tint */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
              onClick={() => setShowNews(false)}
            />

            <Card className="w-full max-w-4xl bg-slate-900/90 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden flex flex-col md:flex-row h-[80vh] rounded-[2.5rem]">
              {/* Left Side: Featured News Image / Gradient */}
              <div className="md:w-1/3 relative bg-gradient-to-br from-purple-600 to-blue-700 overflow-hidden hidden md:block">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                  <Badge className="w-fit mb-4 bg-white/20 backdrop-blur-md border-none text-[10px] font-black uppercase tracking-widest">
                    Community Updates
                  </Badge>
                  <h3 className="text-4xl font-black leading-none tracking-tighter mb-4">
                    WHAT'S NEW IN BOOMKIT
                  </h3>
                  <p className="text-white/70 font-medium text-sm">
                    Stay ahead of the game with our latest features, patches, and community highlights.
                  </p>
                </div>
                {/* Decorative floating elements */}
                <div className="absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-40 left-10 w-16 h-16 bg-blue-400/20 rounded-full blur-xl animate-bounce-slow" />
              </div>

              {/* Right Side: News Feed */}
              <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm relative">
                <CardHeader className="border-b border-white/5 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <NewspaperIcon className="w-8 h-8 text-purple-400" />
                        The Daily Boom
                      </CardTitle>
                      <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Latest updates from the arena
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNews(false)}
                      className="rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                      <XIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {NEWS_ITEMS.map((news) => (
                    <div key={news.id} className="group relative flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-300">
                            {news.image}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">
                                {news.title}
                              </h4>
                              {news.badge && (
                                <Badge className={`${news.badgeColor || 'bg-purple-500'} text-white text-[9px] font-black border-none px-1.5 py-0 rounded-full`}>
                                  {news.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                              {news.date}
                            </p>
                          </div>
                        </div>
                      </div>

                      {news.imageUrl && (
                        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/5 group-hover:border-white/20 transition-all duration-300">
                          <img
                            src={news.imageUrl || "/placeholder.svg"}
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60" />
                        </div>
                      )}

                      <p className="text-white/60 text-sm leading-relaxed font-medium pl-10 border-l-2 border-white/5 group-hover:border-purple-500/30 transition-all duration-300">
                        {news.content}
                      </p>
                    </div>
                  ))}
                </CardContent>

                <div className="p-6 bg-slate-900 border-t border-white/5">
                  <Button
                    onClick={() => setShowNews(false)}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-lg rounded-2xl shadow-[0_10px_20px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_30px_rgba(147,51,234,0.4)] transition-all hover:-translate-y-1 active:scale-[0.98]"
                  >
                    RETURN TO ARENA
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      }

      {/* Solo Game Mode Selection Flow */}
      {
        soloFlow === "mode-select" && soloSubject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-500">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setSoloFlow(null)} />
            <div className="relative z-10 w-full max-w-5xl h-[85vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">Choose Your Solo Challenge</h2>
                  <p className="text-purple-300/60 font-medium">
                    Playing: {soloSubject.subject} (Grade {soloSubject.grade})
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoloFlow(null)}
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <XIcon className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                <GameModeSelector
                  subjectName={soloSubject.subject}
                  onBack={() => setSoloFlow(null)}
                  initialDuration={selectedDuration}
                  isSolo={true}
                  onSelect={(mode, duration) => {
                    console.log("Selected solo mode:", mode.id, "duration:", duration)
                    setSelectedDuration(duration) // Update shared duration state

                    // Wrap the async part
                    const startSoloGame = async () => {
                      setIsGeneratingSet(true)
                      setSoloFlow(null)

                      // Use pre-existing questions if they were passed via the subject state
                      let questions = (soloSubject as any)?.questions
                      if (!questions) {
                        questions = await fetchQuestionsWithAi(soloSubject.grade, soloSubject.subject, 30)
                      }

                      setIsGeneratingSet(false)

                      if (questions && questions.length > 0) {
                        setActiveDiscoverGame({
                          grade: soloSubject.grade,
                          subject: soloSubject.subject,
                          mode: "solo",
                          gameMode: mode.id,
                          questions,
                          duration,
                        })
                        setIsMergingGameActive(true)
                      }
                    }
                    startSoloGame()
                  }}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* PUBLIC PLAYER PROFILE MODAL */}
      {
        showPlayerProfile && selectedProfileUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md my-8 relative overflow-hidden shadow-2xl flex flex-col">

              {/* Banner & Close Button */}
              <div className={`h-32 w-full bg-gradient-to-r ${selectedProfileUser.bannerColor || "from-slate-700 to-slate-800"} relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full"
                  onClick={() => setShowPlayerProfile(false)}
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Profile Content Body */}
              <div className="px-6 pb-6 relative flex flex-col items-center -mt-16">

                {/* Avatar Outline */}
                <div className="rounded-full p-1.5 bg-slate-900 relative">
                  <Avatar className="h-28 w-28 border-4 border-slate-800 shadow-xl" style={{ backgroundColor: '#1a1d27' }}>
                    <AvatarFallback className="text-5xl">{selectedProfileUser.profilePicture || "🎮"}</AvatarFallback>
                  </Avatar>

                  {/* Status Indicator */}
                  <div
                    className={`absolute bottom-3 right-3 h-5 w-5 rounded-full border-4 border-slate-900 ${Date.now() - (selectedProfileUser.lastSeen || 0) < 5 * 60 * 1000 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-slate-500"
                      }`}
                    title={Date.now() - (selectedProfileUser.lastSeen || 0) < 5 * 60 * 1000 ? "Online" : "Offline"}
                  />
                </div>

                {/* Name & Role */}
                <div className="text-center mt-3 mb-6">
                  <h2 className={`text-2xl font-black ${selectedProfileUser.nameColor || "text-white"} flex items-center justify-center gap-2`}>
                    {selectedProfileUser.username}
                    {selectedProfileUser.isPlusUser && <SparklesIcon className="text-yellow-400 h-5 w-5 fill-yellow-400/20" />}
                  </h2>

                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <Badge className={`${getRoleColor(selectedProfileUser.role)} border-none px-3 py-1 text-xs uppercase font-extrabold tracking-wider`}>
                      {getUserRoleName(selectedProfileUser)}
                    </Badge>

                    {selectedProfileUser.badges?.map(badgeId => {
                      const b = AVAILABLE_BADGES.find(x => x.id === badgeId)
                      return b ? (
                        <Badge key={b.id} className={`${b.color} border-none font-bold`} title={b.name}>
                          {b.emoji} {b.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Boom Showcase Area */}
                <div className="w-full bg-slate-800/50 rounded-xl p-4 mb-6 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                  <h3 className="text-xs uppercase font-black tracking-widest text-slate-400 mb-3 relative z-10 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Showcase Boom
                  </h3>

                  <div className="relative z-10 flex flex-col items-center justify-center p-2 min-h-[120px]">
                    {selectedProfileUser.pinned_boom ? (
                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center bg-black/40 backdrop-blur-md shadow-xl ${getAnimationClass(getBoomRarity(selectedProfileUser.pinned_boom))} ${getBoomRarity(selectedProfileUser.pinned_boom) === "legendary" ? "border-orange-500/50" :
                        getBoomRarity(selectedProfileUser.pinned_boom) === "mystical" ? "border-purple-500/50" : "border-slate-700"
                        }`}>
                        <div className="text-6xl mb-2 drop-shadow-2xl">{getBoomAvatar(selectedProfileUser.pinned_boom)}</div>
                        <Badge className={`${getRarityColor(getBoomRarity(selectedProfileUser.pinned_boom))} px-3 uppercase text-[10px] font-black mb-2`}>
                          {selectedProfileUser.pinned_boom}
                        </Badge>

                        {selectedProfileEvolution && (
                          <div className="w-full mt-2 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-blue-400">Level {selectedProfileEvolution.level}</span>
                              <span className="text-white/40">{selectedProfileEvolution.xp} / {(selectedProfileEvolution.level || 1) * 500} XP</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${Math.min(100, (selectedProfileEvolution.xp / ((selectedProfileEvolution.level || 1) * 500)) * 100)}%` }}
                              />
                            </div>
                            {selectedProfileEvolution.is_fully_evolved && (
                              <div className="text-[9px] font-black text-center text-yellow-400 uppercase mt-1 animate-pulse">
                                ✨ Fully Evolved ✨
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center text-center opacity-50">
                        <PackageIcon className="h-10 w-10 mb-2 stroke-1" />
                        <p className="text-sm font-medium">No boom showcased yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col items-center border border-white/5 hover:bg-slate-800 transition-colors">
                    <CoinsIcon className="h-6 w-6 text-yellow-500 mb-2" />
                    <span className="text-2xl font-black text-white">{selectedProfileUser.tokens.toLocaleString()}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tokens</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col items-center border border-white/5 hover:bg-slate-800 transition-colors">
                    <TrophyIcon className="h-6 w-6 text-purple-400 mb-2" />
                    <span className="text-2xl font-black text-white">{selectedProfileUser.boomScore.toLocaleString()}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Boom Score</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col items-center border border-white/5 hover:bg-slate-800 transition-colors">
                    <BoxIcon className="h-6 w-6 text-blue-400 mb-2" />
                    <span className="text-2xl font-black text-white">{selectedProfileUser.packsOpened || 0}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Packs Opened</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col items-center border border-white/5 hover:bg-slate-800 transition-colors">
                    <MessageCircleIcon className="h-6 w-6 text-green-400 mb-2" />
                    <span className="text-sm font-black text-slate-200 text-center uppercase truncate w-full">Level {selectedProfileUser.level || 1}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Player Rank</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {currentUser && selectedProfileUser.id !== currentUser.id && (
                  <div className="w-full mt-6 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-black h-12 rounded-xl transition-colors"
                      onClick={() => {
                        const amountStr = prompt(`How many tokens do you want to safely gift to ${selectedProfileUser.username}?`);
                        if (!amountStr) return;
                        const amount = parseInt(amountStr, 10);
                        if (isNaN(amount) || amount <= 0) {
                          alert("Invalid amount.");
                          return;
                        }
                        handleGiftTokens(selectedProfileUser.username, amount);
                      }}
                    >
                      <CoinsIcon className="w-4 h-4 mr-2" />
                      Gift Tokens
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-black h-12 rounded-xl transition-colors"
                      onClick={() => {
                        const allBooms = Object.keys(currentUser?.booms || {}).filter(b => currentUser?.booms[b] > 0);
                        if (allBooms.length === 0) {
                          alert("You have no Booms to gift!");
                          return;
                        }
                        const boomName = prompt(`Which Boom would you like to gift to ${selectedProfileUser.username}?\n\nAvailable: ${allBooms.join(", ")}`);
                        if (!boomName || !allBooms.includes(boomName)) {
                          if (boomName) alert(`Invalid Boom or you don't own any ${boomName}!`);
                          return;
                        }
                        const amountStr = prompt(`How many ${boomName} would you like to gift? (You have ${currentUser.booms[boomName]})`);
                        if (!amountStr) return;
                        const amount = parseInt(amountStr, 10);
                        if (isNaN(amount) || amount <= 0) {
                          alert("Invalid amount.");
                          return;
                        }
                        handleGiftBoom(selectedProfileUser.username, boomName, amount);
                      }}
                    >
                      <PackageIcon className="w-4 h-4 mr-2" />
                      Gift Boom
                    </Button>
                  </div>
                )}

                {/* Footer Info */}
                <div className="w-full mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Joined {new Date(selectedProfileUser.joinDate).toLocaleDateString()}</span>
                  <span>ID: {selectedProfileUser.username.toLowerCase()}</span>
                </div>

              </div>
            </div>
          </div>
        )
      }

      {/* CLAN PROFILE OVERLAY POPUP */}
      {showClanProfileModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e]/95 border border-purple-500/20 rounded-[2.5rem] w-full max-w-lg relative overflow-hidden shadow-2xl p-8 space-y-6">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full"
              onClick={() => setShowClanProfileModal(null)}
            >
              <XIcon className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center text-5xl border border-purple-500/20">
                {showClanProfileModal.logo}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">{showClanProfileModal.name}</h2>
                  <span className={`inline-block text-sm font-black px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 ${showClanProfileModal.tag_color}`}>
                    [{showClanProfileModal.tag}]
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  Level {showClanProfileModal.level} Clan • {showClanProfileModal.members?.length || 0} members
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-2">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Description</span>
              <p className="text-white/70 text-xs leading-relaxed">
                {showClanProfileModal.description || "This clan has no description yet."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase text-white/30 tracking-wider mb-1">Leader</span>
                <span className="font-bold text-yellow-400">{showClanProfileModal.leader}</span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase text-white/30 tracking-wider mb-1">XP Progression</span>
                <span className="font-bold text-purple-400">{showClanProfileModal.xp?.toLocaleString()} Total XP</span>
              </div>
            </div>

            {/* Roster Preview */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider ml-1">Members List</span>
              <ScrollArea className="h-44 pr-2 bg-black/20 rounded-2xl border border-white/5 p-4 scrollbar-hide">
                <div className="space-y-2">
                  {showClanProfileModal.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{member.profile_picture || "🎮"}</span>
                        <span className={`font-bold ${member.name_color || 'text-white'}`}>{member.username}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        member.clan_role === 'leader' ? 'text-yellow-500' :
                        member.clan_role === 'co_leader' ? 'text-purple-400' : 'text-white/40'
                      }`}>
                        {member.clan_role}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Actions / Join button if not in a clan */}
            {!currentUser?.clan_id && (
              <Button
                onClick={() => {
                  handleJoinClan(showClanProfileModal.id);
                  setShowClanProfileModal(null);
                }}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl border-none text-xs"
              >
                Join Clan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {
        isGeneratingSet && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center flex-col gap-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight animate-pulse">GENERATING ARENA</h2>
              <p className="text-white/60 font-medium">Using AI to craft unique questions...</p>
            </div>
          </div>
        )
      }

      {
        packAnimation.show && (
          <div
            className={`fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden ${packAnimation.stage === "done" ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => {
              if (packAnimation.stage === "done") {
                closePackAnimation()
              }
            }}
          >
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
                    {/* Display Emoji instead of Image */}
                    <div className="text-8xl drop-shadow-md">
                      {PACKS.find(p => p.name === packAnimation.packName)?.emoji || "📦"}
                    </div>
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
                <div className="flex items-center justify-center w-full h-full" onClick={(e) => {
                  // Optional: Determine if clicking content should close it. 
                  // User said "click anywhere and exit", which usually includes the content.
                  // So we allow propagation to the parent.
                }}>
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
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      {packAnimation.boom.avatar.startsWith('/') ? (
                        <img
                          src={packAnimation.boom.avatar || "/placeholder.svg"}
                          alt={packAnimation.boom.name}
                          className="w-48 h-48 object-contain drop-shadow-2xl animate-in zoom-in duration-500"
                        />
                      ) : (
                        <span className="text-8xl drop-shadow-md">{packAnimation.boom.avatar}</span>
                      )}
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
                </div>
              )
            })()}
          </div>
        )
      }
      {
        showProfilePicker && (
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
        )
      }
      {
        showNameEdit && (
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
        )
      }
      {
        showEmailEdit && (
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
        )
      }
      {
        showPasswordEdit && (
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
        )
      }
      {
        showDeleteConfirm && (
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
        )
      }
      {
        showPrivacyPolicy && (
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
                    (Owner), Ughur Akparli (Co-Owner - Developer), and Turan Mecidov (Tester).
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
        )
      }
      {
        showTermsOfService && (
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
                    operated by Oktay Abdullazada, Ughur Akparli, and Turan Mecidov.
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
        )
      }
      {
        showUserStats && selectedUserStats && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 transition-all duration-300">
            <Card
              className={`w-full max-w-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-300 ${selectedUserStats.bannerColor === "rainbow"
                ? "bg-slate-900/95"
                : "bg-slate-900/90"
                }`}
            >
              {/* Header Banner */}
              <div className={`h-32 w-full relative ${selectedUserStats.bannerColor === "rainbow"
                ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"
                : selectedUserStats.bannerColor || "bg-gradient-to-r from-purple-600 to-pink-600"
                }`}>
                <div className="absolute inset-0 bg-black/20" />
                <button
                  onClick={() => setShowUserStats(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-20"
                >
                  ✕
                </button>
              </div>

              <CardContent className="px-8 pb-8 -mt-12 relative z-10">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Profile Picture & Primary Info */}
                  <div className="flex flex-col items-center md:items-start space-y-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-6xl shadow-2xl relative overflow-hidden">
                        {selectedUserStats.profilePicture || "🎮"}
                        {selectedUserStats.role === "owner" && (
                          <div className="absolute inset-0 border-4 border-yellow-500/30 animate-pulse rounded-2xl" />
                        )}
                      </div>
                      {selectedUserStats.isPlusUser && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                          PLUS
                        </div>
                      )}
                    </div>

                    <div className="text-center md:text-left">
                      <h2 className={`text-3xl font-black mb-1 ${selectedUserStats.nameColor === "rainbow"
                        ? "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
                        : "text-white"
                        }`}>
                        {selectedUserStats.username}
                      </h2>
                      <Badge variant="outline" className="border-white/20 text-white/60 bg-white/5 uppercase tracking-widest text-[10px] font-bold">
                        ID: {selectedUserStats.id.slice(0, 8)}...
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge className={`${getRoleColor(selectedUserStats.role)} text-white px-3 py-1 text-xs font-black uppercase tracking-wider border-none shadow-lg shadow-black/20`}>
                        {getUserRoleName(selectedUserStats)}
                      </Badge>
                      {selectedUserStats.isOwner && (
                        <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs font-black uppercase tracking-wider border-none shadow-lg shadow-black/20">
                          Official
                        </Badge>
                      )}
                    </div>

                    <div className="w-full pt-4">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Active Badges</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedUserStats.badges ?? []).length > 0 ? (
                            selectedUserStats.badges.map((badgeId) => {
                              const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)
                              return badge ? (
                                <div key={badgeId} className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                                  <span className="text-base">{badge.emoji}</span>
                                  <span className="text-[10px] text-white font-bold opacity-80">{badge.name}</span>
                                </div>
                              ) : null
                            })
                          ) : (
                            <p className="text-white/20 text-xs italic">No badges earned yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Statistics */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">💰</span>
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Tokens</span>
                        </div>
                        <div className="text-2xl font-black text-yellow-500">
                          {selectedUserStats.tokens.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">⭐</span>
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Score</span>
                        </div>
                        <div className="text-2xl font-black text-purple-400">
                          {selectedUserStats.boomScore.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">📦</span>
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Opened</span>
                        </div>
                        <div className="text-2xl font-black text-blue-400">
                          {selectedUserStats.packsOpened || 0}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🎆</span>
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Unique</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-400">
                          {Object.keys(selectedUserStats.booms).length}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Recent Activity</p>
                        <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">Live Tracking</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="text-white/70">Joined the Booom Arena on <span className="text-emerald-400 font-bold">{new Date(selectedUserStats.joinDate).toLocaleDateString()}</span></p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          <p className="text-white/70">Highest token balance recorded: <span className="text-yellow-400 font-bold">{selectedUserStats.tokens.toLocaleString()}</span></p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowUserStats(false)}
                      className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs border border-white/10 rounded-xl transition-all"
                    >
                      Close Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
      {
        showEditUserDialog && userToEdit && (
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
        )
      }
      {
        showMuteDialog && userToModerate && (
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
        )
      }
      {
        showBanDialog && userToModerate && (
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
        )
      }
      {/* Custom role manager removed for security */}
      {
        showBadgeManager && (
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
        )
      }
      {
        showBoomAction && selectedBoom && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Boom Actions</CardTitle>
                <CardDescription>What do you want to do with {selectedBoom}?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white">
                  <span className="text-3xl">{getBoomAvatar(selectedBoom)}</span> {selectedBoom}
                </p>

                <div className="space-y-2">
                  <Label className="text-white">Quantity to Sell: {sellQuantity}</Label>
                  <Input
                    type="range"
                    min="1"
                    max={currentUser?.booms[selectedBoom] || 1}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/70">
                    <span>1</span>
                    <span>{currentUser?.booms[selectedBoom] || 1}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded p-3 text-center">
                  <p className="text-white/70 text-sm">Total Value</p>
                  <p className="text-yellow-400 font-bold text-xl">
                    {getBoomSellPrice(selectedBoom) * sellQuantity} tokens
                  </p>
                </div>

                {/* Prevent selling rented booms */}
                {rentalListings.some(r => r.renter_username === currentUser?.username && r.boom_name === selectedBoom && r.status === "rented") ? (
                  <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-center text-xs text-blue-300 font-medium">
                    This is a rented Boom and cannot be sold.
                  </div>
                ) : (
                  <Button onClick={() => handleConfirmSell()} className="w-full bg-blue-600 hover:bg-blue-700">
                    Sell {sellQuantity} for {getBoomSellPrice(selectedBoom) * sellQuantity} tokens
                  </Button>
                )}

                <Button 
                  onClick={async () => {
                    setShowBoomAction(false)
                    await pinBoomToProfile(selectedBoom)
                  }} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black"
                >
                  📌 Pin to Profile Showcase
                </Button>

                <Button onClick={() => setShowBoomAction(false)} className="w-full bg-gray-600 hover:bg-gray-700">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }
      {
        showAiSetCreator && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-slate-900 border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-purple-400" />
                  Create Set with AI
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Tell the AI what you want to learn about, and it will create a question set for you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Solar system facts, or basic multiplication..."
                  value={aiSetPrompt}
                  onChange={(e) => {
                    const val = e.target.value
                    setAiSetPrompt(val)
                    // Auto-sync question count if a number is detected (e.g., "10 questions")
                    const match = val.match(/(\d+)\s+questions?/i)
                    if (match) {
                      const count = parseInt(match[1])
                      if (count >= 5 && count <= 50) setAiQuestionCount(count)
                    }
                  }}
                  className="bg-black/50 border-purple-500/30 text-white min-h-[100px]"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-bold block">Grade Level</label>
                    <select
                      value={aiGrade}
                      onChange={(e) => setAiGrade(parseInt(e.target.value))}
                      className="w-full bg-black/50 border-purple-500/30 text-white rounded-md p-2 text-sm outline-none focus:border-purple-500"
                    >
                      {gradingGroups.map(g => (
                        <option key={g.grade} value={g.grade}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-bold block">Subject</label>
                    <select
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      className="w-full bg-black/50 border-purple-500/30 text-white rounded-md p-2 text-sm outline-none focus:border-purple-500"
                    >
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="Social Studies">Social Studies</option>
                      <option value="English Language Arts">English Language Arts</option>
                      <option value="General">General/Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-bold block">
                    Number of Questions
                  </label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value) || 30)}
                    className="bg-black/50 border-purple-500/30 text-white"
                  />
                  <p className="text-[10px] text-white/30 italic">Default is 30 questions (Recommended for best experience).</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <Label className="text-white font-bold block">Public Visibility</Label>
                    <p className="text-[10px] text-white/50">Allow others to find and host this set.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiIsPublic}
                    onChange={(e) => setAiIsPublic(e.target.checked)}
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAiSetCreator(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateAiSet}
                    disabled={!aiSetPrompt || isGeneratingSet}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl"
                  >
                    {isGeneratingSet ? "Generating..." : "Generate Set"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Hosting Flow UI */}
      {
        hostingFlow === 'mode-select' && hostingSubject && (
          <GameModeSelector
            subjectName={`${gradingGroups.find(g => g.grade === hostingSubject.grade)?.label || 'Grade ' + hostingSubject.grade} ${hostingSubject.subject}`}
            onBack={() => setHostingFlow(null)}
            onSelect={(mode) => {
              setSelectedGameMode(mode)
              setHostingFlow('settings')
            }}
          />
        )
      }

      {
        hostingFlow === 'settings' && hostingSubject && selectedGameMode && (
          <HostSettingsModal
            modeName={selectedGameMode.name}
            modeIcon={selectedGameMode.icon}
            modeColor={selectedGameMode.color}
            subject={hostingSubject.subject}
            onBack={() => setHostingFlow('mode-select')}
            onHost={async (settings) => {
              setGameSettings(settings)

              // Now create the actual session
              setIsGeneratingSet(true)

              // Use pre-existing questions if available
              let questions = (hostingSubject as any)?.questions
              if (!questions) {
                questions = await fetchQuestionsWithAi(hostingSubject.grade, hostingSubject.subject, 30)
              }

              setIsGeneratingSet(false)

              if (!questions || questions.length === 0) {
                alert("Failed to generate questions. Please try again.")
                return
              }

              const pin = Math.floor(100000 + Math.random() * 900000).toString()

              if (supabase) {
                // Robust Hosting logic: Try new columns, fall back to old if schema cache is stale
                const lobbyData: any = {
                  pin,
                  host_id: currentUser?.id,
                  host_username: currentUser?.username,
                  grade: hostingSubject.grade,
                  subject: hostingSubject.subject,
                  questions,
                  status: "waiting",
                  duration: settings.duration * 60,
                  players: []
                }

                // Try with new columns first
                let { error } = await supabase.from("game_sessions").insert({
                  ...lobbyData,
                  mode: selectedGameMode.id,
                  settings: settings,
                })

                // If missing column error (42703), retry with basic data
                if (error && error.code === '42703') {
                  console.warn("Schema cache mismatch: Retrying without 'mode' and 'settings' columns.")
                  const retry = await supabase.from("game_sessions").insert(lobbyData)
                  error = retry.error

                  if (!error) {
                    alert("⚠️ Database Schema Alert: Your game started, but 'Game Modes' and 'Custom Settings' were lost because the database columns are missing. Please run the SQL migration in the implementation plan to fix this permamently.")
                  }
                }

                if (error) {
                  console.error("Host Session Error:", error)
                  alert(`Error creating lobby: ${error.message}`)
                  return
                }

                setActiveGamePin(pin)
                setActiveDiscoverGame({
                  grade: hostingSubject.grade,
                  subject: hostingSubject.subject,
                  mode: "host",
                  gameMode: selectedGameMode.id,
                  questions
                })
                setLobbyActive(true)
                setHostingFlow(null)
              }
            }}
          />
        )
      }

      {/* Host Dashboard Overlay - ONLY SHOW WHEN GAME IS ACTIVE */}
      {
        isMergingGameActive && currentUser && activeDiscoverGame?.mode === "host" && (
          <div className="fixed inset-0 z-[100] pointer-events-none">
            <div className="pointer-events-auto w-full h-full">
              <HostDashboard
                pin={activeGamePin || ""}
                gameMode={activeDiscoverGame.gameMode || "classic"}
                subject={activeDiscoverGame.subject}
                duration={selectedDuration || activeDiscoverGame.duration || 120}
                onEndGame={async () => {
                  if (supabase && activeGamePin) {
                    await supabase.from("game_sessions").update({ status: "finished" }).eq("pin", activeGamePin)
                  }
                  setIsMergingGameActive(false)
                  setShowGameResults(true)
                }}
                players={livePlayers.map(p => ({
                  id: p.id,
                  username: p.username,
                  score: p.score || 0,
                  profilePicture: p.profile_picture || p.profilePicture // Pass both to be safe
                }))}
              />
            </div>
          </div>
        )
      }

      {/* Game Results Screen */}
      {
        showGameResults && (
          <GameResults
            score={gameScore}
            totalQuestions={activeDiscoverGame?.questions?.length || 0}
            highScore={currentUser?.boomScore || 0}
            leaderboard={livePlayers.length > 0 ? [...livePlayers].filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0)).map(p => ({
              id: p.id,
              username: p.username,
              score: p.score || 0,
              avatar: p.profilePicture || p.profile_picture || "👤"
            })) : (currentUser ? [{
              id: currentUser.id,
              username: currentUser.username,
              score: gameScore,
              avatar: currentUser.profilePicture
            }] : [])}
            onExit={async () => {
              if (currentUser && gameScore > 0) {
                // Log activity
                await supabase?.rpc('log_user_activity', {
                  p_username: currentUser.username,
                  p_type: 'game_win',
                  p_desc: `Finished a game with score: ${gameScore}`,
                  p_details: { score: gameScore, pin: activeGamePin }
                })

                // Phase 5: Update stats and check achievements
                const newGamesPlayed = (currentUser.games_played || 0) + 1
                await supabase?.from("users").update({
                  games_played: newGamesPlayed
                }).eq("username", currentUser.username)

                // Add Season XP (50 per game + dynamic score bonus!)
                const seasonXpEarned = 50 + Math.floor(gameScore / 10)
                await handleAddSeasonXp(seasonXpEarned)

                // Check achievements
                await supabase?.rpc('check_achievements', {
                  p_username: currentUser.username,
                  p_type: 'games_played',
                  p_value: newGamesPlayed
                })

                // Submit to clan-based tournaments
                if (activeTournaments.length > 0 && currentUser.clan_id) {
                  for (const t of activeTournaments) {
                    if (t.status === 'active') {
                      await supabase?.rpc('submit_clan_tournament_score', {
                        p_tournament_id: t.id,
                        p_username: currentUser.username,
                        p_score: gameScore
                      })
                    }
                  }
                }

                // Award Clan XP (50 per game + dynamic score bonus!)
                if (currentUser.clan_id) {
                  const clanXpEarned = 50 + Math.floor(gameScore / 10)
                  await supabase?.rpc('add_clan_xp', {
                    p_username: currentUser.username,
                    p_amount: clanXpEarned
                  })
                }

                // Decrement rental session if playing with a rented boom
                if (currentUser.pinned_boom) {
                  const { data: rentRes, error: rentErr } = await supabase!.rpc('decrement_rental_session', {
                    p_renter: currentUser.username,
                    p_boom_name: currentUser.pinned_boom
                  })
                  if (rentErr) {
                    console.error("[v0] Error decrementing rental session:", rentErr.message)
                  } else if (rentRes?.success) {
                    console.log("[v0] Rental session used:", rentRes.message)
                  }
                }
              }
              setShowGameResults(false)
              setActiveDiscoverGame(null)
              setActiveGamePin("")
              setLobbyActive(false)
              fetchUsersFromSupabase(true)
            }}
            onPlayAgain={() => {
              setShowGameResults(false)
              // Logic to restart would go here, for now just close
              setActiveDiscoverGame(null)
            }}
          />
        )
      }
    </div >
  )
}
