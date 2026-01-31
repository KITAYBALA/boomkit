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
        description: "Just good old-fashioned trivia racing.",
        icon: <Trophy className="w-8 h-8" />,
        color: "from-slate-400 to-slate-600",
        difficulty: "Simple",
        skills: ["Accuracy", "Speed"],
        idealTime: "5 min",
        questionFrequency: "High",
        image: "/images/modes/classic.png"
    },
    {
        id: "factory",
        name: "Factory",
        description: "Industrial production and upgrade simulator.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-gray-400 to-yellow-600",
        difficulty: "Moderate",
        skills: ["Strategy", "Efficiency"],
        idealTime: "12 min",
        questionFrequency: "Medium"
    },
    {
        id: "cafe",
        name: "Cafe",
        description: "Fast-paced customer service and recipe management.",
        icon: <Timer className="w-8 h-8" />,
        color: "from-orange-400 to-amber-600",
        difficulty: "Simple",
        skills: ["Speed", "Memory"],
        idealTime: "8 min",
        questionFrequency: "High"
    },
    {
        id: "racing",
        name: "Racing",
        description: "A lap-based speed competition.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-blue-500 to-indigo-700",
        difficulty: "Simple",
        skills: ["Speed", "Reflexes"],
        idealTime: "6 min",
        questionFrequency: "High"
    },
    {
        id: "blook-rush",
        name: "Blook Rush",
        description: "Quick-reflex icon collection.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-pink-400 to-rose-600",
        difficulty: "Simple",
        skills: ["Speed", "Luck"],
        idealTime: "5 min",
        questionFrequency: "High"
    },
    {
        id: "dino-world",
        name: "Dino World",
        description: "Prehistoric evolution and survival.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-green-500 to-emerald-700",
        difficulty: "Moderate",
        skills: ["Strategy", "Planning"],
        idealTime: "10 min",
        questionFrequency: "Medium"
    },
    {
        id: "space-explorer",
        name: "Space Explorer",
        description: "Galactic conquest and planet-claiming.",
        icon: <Gamepad2 className="w-8 h-8" />,
        color: "from-indigo-600 to-purple-900",
        difficulty: "Difficult",
        skills: ["Strategy", "Control"],
        idealTime: "15 min",
        questionFrequency: "Medium"
    },
    {
        id: "wild-west",
        name: "Wild West",
        description: "Outlaw duels and bounty hunting.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-amber-700 to-orange-900",
        difficulty: "Moderate",
        skills: ["Speed", "Precision"],
        idealTime: "8 min",
        questionFrequency: "High"
    },
    {
        id: "city-builder",
        name: "City Builder",
        description: "Urban planning and infrastructure management.",
        icon: <Shield className="w-8 h-8" />,
        color: "from-sky-400 to-blue-600",
        difficulty: "Moderate",
        skills: ["Planning", "Economy"],
        idealTime: "12 min",
        questionFrequency: "Low"
    },
    {
        id: "pirate-booty",
        name: "Pirate Booty",
        description: "High-seas plunder and ship upgrades.",
        icon: <Coins className="w-8 h-8" />,
        color: "from-cyan-500 to-blue-700",
        difficulty: "Moderate",
        skills: ["Strategy", "Luck"],
        idealTime: "10 min",
        questionFrequency: "Medium"
    },
    {
        id: "alchemy",
        name: "Alchemy",
        description: "Elemental merging and transmutation.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-fuchsia-500 to-purple-700",
        difficulty: "Difficult",
        skills: ["Memory", "Strategy"],
        idealTime: "12 min",
        questionFrequency: "Medium"
    },
    {
        id: "dungeon-crawl",
        name: "Dungeon Crawl",
        description: "RPG-style exploration and combat.",
        icon: <Ghost className="w-8 h-8" />,
        color: "from-stone-600 to-neutral-900",
        difficulty: "Difficult",
        skills: ["Tactics", "Grit"],
        idealTime: "15 min",
        questionFrequency: "Medium"
    },
    {
        id: "farm-tycoon",
        name: "Farm Tycoon",
        description: "Agriculture and market logistics.",
        icon: <Trophy className="w-8 h-8" />,
        color: "from-lime-400 to-green-600",
        difficulty: "Moderate",
        skills: ["Efficiency", "Patience"],
        idealTime: "15 min",
        questionFrequency: "Low"
    },
    {
        id: "monster-brawl",
        name: "Monster Brawl",
        description: "Evolution and arena fighting.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-red-500 to-rose-700",
        difficulty: "Moderate",
        skills: ["Power", "Speed"],
        idealTime: "10 min",
        questionFrequency: "High"
    },
    {
        id: "zombie-uprising",
        name: "Zombie Uprising",
        description: "Post-apocalyptic survival.",
        icon: <Ghost className="w-8 h-8" />,
        color: "from-emerald-700 to-stone-900",
        difficulty: "Difficult",
        skills: ["Survival", "Focus"],
        idealTime: "12 min",
        questionFrequency: "High"
    },
    {
        id: "kingdom",
        name: "Kingdom",
        description: "Medieval tax collection and expansion.",
        icon: <Shield className="w-8 h-8" />,
        color: "from-yellow-400 to-amber-600",
        difficulty: "Moderate",
        skills: ["Strategy", "Management"],
        idealTime: "15 min",
        questionFrequency: "Medium"
    },
    {
        id: "escape-room",
        name: "Escape Room",
        description: "Puzzle-solving under pressure.",
        icon: <Clock className="w-8 h-8" />,
        color: "from-teal-400 to-cyan-600",
        difficulty: "Difficult",
        skills: ["Logic", "Speed"],
        idealTime: "10 min",
        questionFrequency: "Medium"
    },
    {
        id: "stock-market",
        name: "Stock Market",
        description: "Financial trading simulation.",
        icon: <Coins className="w-8 h-8" />,
        color: "from-green-400 to-emerald-600",
        difficulty: "Moderate",
        skills: ["Risk", "Analysis"],
        idealTime: "10 min",
        questionFrequency: "Medium"
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk",
        description: "High-tech neural upgrades and hacking.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-purple-400 to-fuchsia-600",
        difficulty: "Moderate",
        skills: ["Speed", "Strategy"],
        idealTime: "8 min",
        questionFrequency: "High"
    },
    {
        id: "magic-academy",
        name: "Magic Academy",
        description: "Spell-casting duels and rank progression.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-violet-500 to-indigo-700",
        difficulty: "Moderate",
        skills: ["Knowledge", "Reflexes"],
        idealTime: "10 min",
        questionFrequency: "High"
    },
    {
        id: "submarine",
        name: "Submarine",
        description: "Deep-sea exploration and discovery.",
        icon: <Fish className="w-8 h-8" />,
        color: "from-blue-700 to-navy-900",
        difficulty: "Moderate",
        skills: ["Exploration", "Speed"],
        idealTime: "8 min",
        questionFrequency: "Medium"
    },
    {
        id: "volcano-escape",
        name: "Volcano Escape",
        description: "High-stress obstacle navigation.",
        icon: <Timer className="w-8 h-8" />,
        color: "from-orange-600 to-red-800",
        difficulty: "Difficult",
        skills: ["Precision", "Calm"],
        idealTime: "7 min",
        questionFrequency: "High"
    },
    {
        id: "candy-land",
        name: "Candy Land",
        description: "Whimsical matching and sugary speed.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-pink-300 to-fuchsia-500",
        difficulty: "Simple",
        skills: ["Speed", "Color Matching"],
        idealTime: "7 min",
        questionFrequency: "High"
    },
    {
        id: "robot-war",
        name: "Robot War",
        description: "Mechanical engineering and battle.",
        icon: <Zap className="w-8 h-8" />,
        color: "from-slate-500 to-blue-900",
        difficulty: "Moderate",
        skills: ["Tactics", "Customization"],
        idealTime: "12 min",
        questionFrequency: "Medium"
    },
    {
        id: "gladiator",
        name: "Gladiator",
        description: "Ancient arena combat and fame building.",
        icon: <Sword className="w-8 h-8" />,
        color: "from-amber-600 to-red-600",
        difficulty: "Difficult",
        skills: ["Strength", "Fame"],
        idealTime: "10 min",
        questionFrequency: "High"
    }
]

interface GameModeSelectorProps {
    onSelect: (mode: GameMode) => void
    onBack: () => void
    subjectName: string
}

export default function GameModeSelector({ onSelect, onBack, subjectName }: GameModeSelectorProps) {
    const [selectedId, setSelectedId] = useState(GAME_MODES[0].id)
    const selectedMode = GAME_MODES.find(m => m.id === selectedId)!

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
                            <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Ideal Time</span>
                            <span className="text-white font-bold flex items-center gap-2">
                                <Timer className="w-4 h-4 text-purple-400" />
                                {selectedMode.idealTime}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Questions</span>
                            <span className="text-white font-bold">{selectedMode.questionFrequency}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-auto pt-6">
                    <Button
                        onClick={() => onSelect(selectedMode)}
                        disabled={selectedMode.isPlus}
                        className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-2xl font-black rounded-2xl shadow-xl shadow-purple-500/20"
                    >
                        {selectedMode.isPlus ? "Unlock Mode" : "Host Game"}
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
                            <button
                                key={mode.id}
                                onClick={() => setSelectedId(mode.id)}
                                className={`
                                    relative group aspect-square rounded-[2rem] p-1 transition-all duration-300
                                    ${selectedId === mode.id ? "ring-4 ring-purple-500 scale-95" : "hover:scale-105 active:scale-95"}
                                `}
                            >
                                <div className={`
                                    w-full h-full rounded-[1.8rem] bg-gradient-to-br ${mode.color} 
                                    flex flex-col items-center justify-center text-white text-center
                                    relative overflow-hidden
                                `}>
                                    {mode.image ? (
                                        <img
                                            src={mode.image}
                                            alt={mode.name}
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                        />
                                    ) : (
                                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                            {mode.icon}
                                        </div>
                                    )}

                                    <div className="relative z-10 w-full p-6">
                                        {!mode.image && <span className="text-xl font-black tracking-tight block">{mode.name}</span>}
                                        {mode.image && (
                                            <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl inline-block">
                                                <span className="text-xl font-black tracking-tight">{mode.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {mode.isPlus && (
                                        <Badge className="absolute top-4 right-4 bg-amber-500 text-black font-black border-none z-20">
                                            PLUS
                                        </Badge>
                                    )}

                                    {/* Gloss effect */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-12 -translate-y-1/2 pointer-events-none z-20" />
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
