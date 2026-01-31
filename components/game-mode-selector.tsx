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
        questionFrequency: "High"
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
        questionFrequency: "Medium"
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
        questionFrequency: "High"
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
        questionFrequency: "Medium"
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
        questionFrequency: "High"
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
        questionFrequency: "High"
    },
    // Adding 24 more modes as placeholders to hit 30
    ...Array.from({ length: 24 }).map((_, i) => ({
        id: `mode-${i + 7}`,
        name: `Mode ${i + 7}`,
        description: "More exciting ways to learn and play!",
        icon: <Sparkles className="w-8 h-8" />,
        color: i % 2 === 0 ? "from-fuchsia-400 to-pink-600" : "from-sky-400 to-blue-600",
        difficulty: "Moderate" as const,
        skills: ["N/A"],
        idealTime: "10 min",
        questionFrequency: "Medium" as const,
        isPlus: i > 10
    }))
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
                    <div className={`w-full aspect-video rounded-3xl bg-gradient-to-br ${selectedMode.color} flex items-center justify-center text-white shadow-2xl text-[80px]`}>
                        <div className="[&_svg]:w-24 [&_svg]:h-24">
                            {selectedMode.icon}
                        </div>
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
                                    flex flex-col items-center justify-center p-6 text-white text-center
                                    relative overflow-hidden
                                `}>
                                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                        {mode.icon}
                                    </div>
                                    <span className="text-xl font-black tracking-tight">{mode.name}</span>

                                    {mode.isPlus && (
                                        <Badge className="absolute top-4 right-4 bg-amber-500 text-black font-black border-none">
                                            PLUS
                                        </Badge>
                                    )}

                                    {/* Gloss effect */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-12 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
