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
        id: "merging",
        name: "Merging",
        description: "Combine items to create higher rarity booms!",
        icon: <Zap className="w-8 h-8" />,
        color: "from-purple-500 to-indigo-600",
        difficulty: "Moderate",
        skills: ["Strategy", "Planning"],
        idealTime: "10 min",
        questionFrequency: "Medium",
        image: "/images/modes/classic.png" // Using classic image as placeholder or we can use a generated one if needed, but keeping it simple for now
    },
    {
        id: "fishing-frenzy",
        name: "Fish Rush", // Renamed from Fishing Frenzy
        description: "Cast your line and reel in the biggest catch!",
        icon: <Fish className="w-8 h-8" />,
        color: "from-blue-400 to-cyan-600",
        difficulty: "Moderate",
        skills: ["Speed", "Precision"],
        idealTime: "10 min",
        questionFrequency: "Medium",
        image: "/images/modes/fishing-frenzy.png"
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

                {isSolo && (
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
                )}

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
