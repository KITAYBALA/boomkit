"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Clock,
    Trophy,
    Sparkles,
    Gamepad2,
    Coins,
    Zap,
    Sword,
    Shield,
    Ghost,
    Fish,
    Timer,
    Info,
    ArrowLeft,
    Users
} from "lucide-react"

export interface GameMode {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    color: string
    difficulty: "Simple" | "Moderate" | "Difficult"
    skills: string[]
    idealTime: string
    questionFrequency: "High" | "Medium" | "Low"
    image?: string
    isPlus?: boolean
}

const GAME_MODES: GameMode[] = [
    {
        id: "gold-quest",
        name: "Gold Quest",
        description: "Exciting Twists and Chests Full of Gold!",
        icon: <Coins className="w-8 h-8" />,
        color: "from-amber-400 to-orange-600",
        difficulty: "Simple",
        skills: ["Luck", "Speed"],
        idealTime: "7 min",
        questionFrequency: "High",
        image: "/images/modes/gold-quest.png"
    },
    {
        id: "fishing-frenzy",
        name: "Fishing Frenzy",
        description: "Cast your line and reel in the biggest catch!",
        icon: <Fish className="w-8 h-8" />,
        color: "from-blue-400 to-cyan-600",
        difficulty: "Moderate",
        skills: ["Speed", "Precision"],
        idealTime: "10 min",
        questionFrequency: "Medium",
        image: "/images/modes/fishing-frenzy.png"
    },
    {
        id: "crypto-hack",
        name: "Crypto Hack",
        description: "Hack your way to the top of the crypto market!",
        icon: <Zap className="w-8 h-8" />,
        color: "from-emerald-400 to-green-600",
        difficulty: "Moderate",
        skills: ["Strategy", "Luck"],
        idealTime: "8 min",
        questionFrequency: "High",
        image: "/images/modes/crypto-hack.png"
    },
    {
        id: "tower-defense",
        name: "Tower Defense",
        description: "Build towers and defend your kingdom!",
        icon: <Shield className="w-8 h-8" />,
        color: "from-rose-400 to-red-600",
        difficulty: "Difficult",
        skills: ["Strategy", "Planning"],
        idealTime: "15 min",
        questionFrequency: "Medium",
        image: "/images/modes/tower-defense.png"
    },
    {
        id: "battle-royale",
        name: "Battle Royale",
        description: "Last one standing wins the ultimate glory!",
        icon: <Sword className="w-8 h-8" />,
        color: "from-purple-400 to-indigo-600",
        difficulty: "Difficult",
        skills: ["Speed", "Accuracy"],
        idealTime: "12 min",
        questionFrequency: "High",
        image: "/images/modes/battle-royale.png"
    },
    {
        id: "classic",
        name: "Classic",
        description: "The original Boomkit experience!",
        icon: <Trophy className="w-8 h-8" />,
        color: "from-blue-500 to-indigo-700",
        difficulty: "Simple",
        skills: ["Speed", "Accuracy"],
        idealTime: "5 min",
        questionFrequency: "Medium",
        image: "/images/modes/classic.png"
    },
    {
        id: "factory",
        name: "Factory",
        description: "Industrial production and upgrade simulator.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-slate-600 to-slate-900",
        difficulty: "Moderate",
        skills: ["Strategy", "Efficiency"],
        idealTime: "10 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
    },
    {
        id: "cafe",
        name: "Cafe",
        description: "Fast-paced customer service and recipe management.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-orange-400 to-amber-700",
        difficulty: "Moderate",
        skills: ["Speed", "Multitasking"],
        idealTime: "8 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
    },
    {
        id: "racing",
        name: "Racing",
        description: "A lap-based speed competition.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-red-600 to-blue-900",
        difficulty: "Difficult",
        skills: ["Reflexes", "Consistency"],
        idealTime: "6 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1511994298241-608e28f14f66?w=800&q=80"
    },
    {
        id: "blook-rush",
        name: "Blook Rush",
        description: "Quick-reflex icon collection.",
        icon: <Gamepad2 className="w-8 h-8" />,
        color: "from-pink-500 to-rose-700",
        difficulty: "Simple",
        skills: ["Speed", "Reflexes"],
        idealTime: "5 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80"
    },
    {
        id: "dino-world",
        name: "Dino World",
        description: "Prehistoric evolution and survival.",
        icon: <Trophy className="w-8 h-8" />,
        color: "from-emerald-600 to-green-900",
        difficulty: "Difficult",
        skills: ["Survival", "Knowledge"],
        idealTime: "12 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1525873542528-98444634358a?w=800&q=80"
    },
    {
        id: "space-explorer",
        name: "Space Explorer",
        description: "Galactic conquest and planet-claiming.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-indigo-900 to-black",
        difficulty: "Difficult",
        skills: ["Exploration", "Planning"],
        idealTime: "15 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80"
    },
    {
        id: "wild-west",
        name: "Wild West",
        description: "Outlaw duels and bounty hunting.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-amber-800 to-orange-950",
        difficulty: "Moderate",
        skills: ["Quick-draw", "Accuracy"],
        idealTime: "7 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80"
    },
    {
        id: "city-builder",
        name: "City Builder",
        description: "Urban planning and infrastructure management.",
        icon: <Shield className="w-8 h-8" />,
        color: "from-sky-500 to-blue-800",
        difficulty: "Moderate",
        skills: ["Planning", "Economy"],
        idealTime: "20 min",
        questionFrequency: "Low",
        image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80"
    },
    {
        id: "pirate-booty",
        name: "Pirate Booty",
        description: "High-seas plunder and ship upgrades.",
        icon: <Coins className="w-8 h-8" />,
        color: "from-cyan-600 to-indigo-900",
        difficulty: "Moderate",
        skills: ["Strategy", "Luck"],
        idealTime: "10 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1566378246598-5b11a0ff7f6c?w=800&q=80"
    },
    {
        id: "alchemy",
        name: "Alchemy",
        description: "Elemental merging and transmutation.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-fuchsia-600 to-purple-900",
        difficulty: "Difficult",
        skills: ["Memory", "Combination"],
        idealTime: "9 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1532187863486-abf9d3a446a0?w=800&q=80"
    },
    {
        id: "dungeon-crawl",
        name: "Dungeon Crawl",
        description: "RPG-style exploration and combat.",
        icon: <Ghost className="w-8 h-8" />,
        color: "from-zinc-800 to-black",
        difficulty: "Difficult",
        skills: ["Combat", "Navigation"],
        idealTime: "15 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80"
    },
    {
        id: "farm-tycoon",
        name: "Farm Tycoon",
        description: "Agriculture and market logistics.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-lime-500 to-green-800",
        difficulty: "Simple",
        skills: ["Timing", "Management"],
        idealTime: "12 min",
        questionFrequency: "Low",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"
    },
    {
        id: "monster-brawl",
        name: "Monster Brawl",
        description: "Evolution and arena fighting.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-orange-600 to-red-900",
        difficulty: "Moderate",
        skills: ["Training", "Tactics"],
        idealTime: "8 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1580234797602-22c37b2a6230?w=800&q=80"
    },
    {
        id: "zombie-uprising",
        name: "Zombie Uprising",
        description: "Post-apocalyptic survival.",
        icon: <Ghost className="w-8 h-8" />,
        color: "from-zinc-900 to-green-950",
        difficulty: "Difficult",
        skills: ["Defense", "Quick-thinking"],
        idealTime: "10 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=800&q=80"
    },
    {
        id: "kingdom",
        name: "Kingdom",
        description: "Medieval tax collection and expansion.",
        icon: <Shield className="w-8 h-8" />,
        color: "from-amber-600 to-yellow-900",
        difficulty: "Moderate",
        skills: ["Leadership", "Economy"],
        idealTime: "15 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80"
    },
    {
        id: "escape-room",
        name: "Escape Room",
        description: "Puzzle-solving under pressure.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-indigo-800 to-blue-950",
        difficulty: "Difficult",
        skills: ["Logic", "Pressure"],
        idealTime: "5 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&q=80"
    },
    {
        id: "stock-market",
        name: "Stock Market",
        description: "Financial trading simulation.",
        icon: <Coins className="w-8 h-8" />,
        color: "from-emerald-500 to-teal-900",
        difficulty: "Moderate",
        skills: ["Analysis", "Risk"],
        idealTime: "8 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1611974717482-990520a3250a?w=800&q=80"
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk",
        description: "High-tech neural upgrades and hacking.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-fuchsia-600 to-blue-900",
        difficulty: "Difficult",
        skills: ["Decoding", "Speed"],
        idealTime: "10 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80"
    },
    {
        id: "magic-academy",
        name: "Magic Academy",
        description: "Spell-casting duels and rank progression.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-violet-500 to-indigo-950",
        difficulty: "Moderate",
        skills: ["Spells", "Focus"],
        idealTime: "9 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1514894780037-3c553246a48d?w=800&q=80"
    },
    {
        id: "submarine",
        name: "Submarine",
        description: "Deep-sea exploration and discovery.",
        icon: <Fish className="w-8 h-8" />,
        color: "from-blue-900 to-black",
        difficulty: "Moderate",
        skills: ["Observation", "Stealth"],
        idealTime: "12 min",
        questionFrequency: "Low",
        image: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80"
    },
    {
        id: "volcano-escape",
        name: "Volcano Escape",
        description: "High-stress obstacle navigation.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-orange-700 to-red-950",
        difficulty: "Difficult",
        skills: ["Agility", "Speed"],
        idealTime: "6 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1531238944588-44487f55f284?w=800&q=80"
    },
    {
        id: "candy-land",
        name: "Candy Land",
        description: "Whimsical matching and sugary speed.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-pink-400 to-fuchsia-600",
        difficulty: "Simple",
        skills: ["Color-matching", "Speed"],
        idealTime: "5 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1582050048266-32bc8802d2ec?w=800&q=80"
    },
    {
        id: "robot-war",
        name: "Robot War",
        description: "Mechanical engineering and battle.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-slate-500 to-cyan-900",
        difficulty: "Difficult",
        skills: ["Engineering", "Combat"],
        idealTime: "12 min",
        questionFrequency: "Medium",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80"
    },
    {
        id: "gladiator",
        name: "Gladiator",
        description: "Ancient arena combat and fame building.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-orange-800 to-yellow-950",
        difficulty: "Moderate",
        skills: ["Strength", "Fame"],
        idealTime: "10 min",
        questionFrequency: "High",
        image: "https://images.unsplash.com/photo-1551047116-24ba469444f2?w=800&q=80"
    }
]
interface GameModeSelectorProps {
    onSelect: (mode: GameMode, duration: number) => void
    onBack: () => void
    subjectName: string
    isSolo?: boolean
    initialDuration?: number
}

export default function GameModeSelector({ onSelect, onBack, subjectName, isSolo, initialDuration = 120 }: GameModeSelectorProps) {
    const [selectedId, setSelectedId] = useState(GAME_MODES[0].id)
    const [isSelecting, setIsSelecting] = useState(false)
    const [duration, setDuration] = useState(initialDuration)
    const selectedMode = GAME_MODES.find(m => m.id === selectedId)!

    const durationOptions = [
        { label: "1 Min", value: 60 },
        { label: "2 Min", value: 120 },
        { label: "5 Min", value: 300 },
        { label: "10 Min", value: 600 },
        { label: "15 Min", value: 900 },
    ]

    return (
        <div className="fixed inset-0 z-[60] bg-[#1a1c2c] flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Mode Info */}
            <div className="w-full md:w-[400px] border-r border-white/10 bg-[#141521] p-6 flex flex-col gap-6 overflow-y-auto">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="w-fit text-white/60 hover:text-white mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Topics
                </Button>

                <div className="space-y-4">
                    <div className={`w-full aspect-video rounded-3xl bg-gradient-to-br ${selectedMode.color} flex items-center justify-center text-white shadow-2xl relative overflow-hidden`}>
                        {selectedMode.image ? (
                            <img
                                src={selectedMode.image}
                                alt={selectedMode.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-[80px] [&_svg]:w-24 [&_svg]:h-24">
                                {selectedMode.icon}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>

                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">{selectedMode.name}</h1>
                        <p className="text-white/60 text-lg mt-2">{selectedMode.description}</p>
                    </div>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Difficulty</span>
                            <Badge className={`${selectedMode.difficulty === "Simple" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                selectedMode.difficulty === "Moderate" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                    "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                }`}>
                                {selectedMode.difficulty}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Skills</span>
                            <div className="flex gap-2">
                                {selectedMode.skills.map(skill => (
                                    <Badge key={skill} variant="outline" className="border-white/10 text-white/80">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Questions</span>
                            <span className="text-white font-bold">{selectedMode.questionFrequency}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-white/40 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Game Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                            {durationOptions.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant="outline"
                                    onClick={() => setDuration(opt.value)}
                                    className={`h-10 rounded-xl border-white/10 font-bold transition-all ${duration === opt.value
                                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-auto pt-6">
                    <Button
                        onClick={() => {
                            setIsSelecting(true)
                            setTimeout(() => {
                                onSelect(selectedMode, duration)
                                setIsSelecting(false)
                            }, 800)
                        }}
                        disabled={selectedMode.isPlus || isSelecting}
                        className={`w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-2xl font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all ${isSelecting ? "scale-95 opacity-50" : "hover:scale-105"}`}
                    >
                        {isSelecting ? "Initializing Arena..." : (selectedMode.isPlus ? "Unlock Mode" : (isSolo ? "Play Solo" : "Host Game"))}
                    </Button>
                    <p className="text-center text-white/30 text-xs mt-4">
                        Subject: <span className="text-purple-400 font-bold">{subjectName}</span>
                    </p>
                </div>
            </div>

            {/* Main Content: Mode Grid */}
            <div className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col gap-8 bg-[#1a1c2c]">
                <div className="flex items-center justify-between">
                    <h2 className="text-5xl font-black text-white">Select Mode</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-bold">Live Lobby</span>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                        {GAME_MODES.map((mode) => (
                            <Card
                                key={mode.id}
                                className={`
                                    relative overflow-hidden cursor-pointer group transition-all duration-500
                                    bg-slate-900/40 backdrop-blur-xl border-white/5 hover:border-white/20
                                    hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]
                                    ${selectedId === mode.id ? 'ring-2 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] bg-slate-800/60' : ''}
                                `}
                                onClick={() => setSelectedId(mode.id)}
                            >
                                {/* Background Image with Parallax-like effect */}
                                {mode.image && (
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={mode.image}
                                            alt={mode.name}
                                            className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent`} />
                                    </div>
                                )}

                                {/* Card Content */}
                                <CardHeader className="relative z-10 pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${mode.color} text-white shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            {mode.icon}
                                        </div>
                                        <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] uppercase font-black tracking-widest px-2 py-0.5 backdrop-blur-md">
                                            {mode.difficulty}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">
                                        {mode.name}
                                    </CardTitle>
                                    <CardDescription className="text-white/60 text-sm line-clamp-2 min-h-[40px] font-medium leading-relaxed">
                                        {mode.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="relative z-10 space-y-4 pt-0">
                                    <div className="flex flex-wrap gap-1.5">
                                        {mode.skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="bg-white/5 text-white/50 border-none text-[9px] font-bold px-1.5 py-0">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{mode.idealTime}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{mode.questionFrequency}</span>
                                            </div>
                                        </div>
                                        {selectedId === mode.id && (
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_purple]" />
                                        )}
                                    </div>
                                </CardContent>

                                {/* Hover Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500" />

                                {/* Interactive Particles on Hover */}
                                <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-mode-particle"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                animationDelay: `${Math.random() * 2}s`,
                                                ["--x" as string]: `${(Math.random() - 0.5) * 100}px`,
                                                ["--y" as string]: `${(Math.random() - 0.5) * 100}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            {/* Selection Flash Overlay */}
            {isSelecting && (
                <div className="fixed inset-0 z-[100] bg-white animate-flash-white flex items-center justify-center">
                    <div className="text-center">
                        <Sparkles className="w-24 h-24 text-purple-600 animate-bounce mb-4" />
                        <h2 className="text-4xl font-black text-purple-900 tracking-tighter">PREPARING ARENA</h2>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes flash-white {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-flash-white {
                    animation: flash-white 0.8s ease-in-out forwards;
                }
                @keyframes mode-particle {
                    0% { transform: translate(0, 0) scale(1); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
                }
                .animate-mode-particle {
                    animation: mode-particle 3s ease-out infinite;
                }
            `}</style>
        </div>
    )
}
