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
        color: " ",
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
        color: " ",
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
        <div className="fixed inset-0 z-[60] club-surface flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Mode Info */}
            <div className="w-full md:w-[400px] border-r club-border club-surface p-6 flex flex-col gap-6 overflow-y-auto">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="club-action w-fit club-muted club-ink mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Topics
                </Button>

                <div className="space-y-4">
                    <div className={`w-full aspect-video rounded-xl club-surface ${selectedMode.color} flex items-center justify-center club-ink relative overflow-hidden`}>
                        {selectedMode.image ? (
                            <img
                                src={selectedMode.image}
                                alt={selectedMode.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="font-heading text-[80px] [&_svg]:w-24 [&_svg]:h-24">
                                {selectedMode.icon}
                            </div>
                        )}
                        <div className="absolute inset-0 club-surface pointer-events-none" />
                    </div>

                    <div>
                        <h1 className="font-heading text-4xl font-black club-ink tracking-tight">{selectedMode.name}</h1>
                        <p className="font-heading club-muted text-lg mt-2">{selectedMode.description}</p>
                    </div>
                </div>

                <Card className="club-well club-border ">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-heading club-muted text-sm font-bold uppercase tracking-wider">Difficulty</span>
                            <Badge className={`${selectedMode.difficulty === "Simple" ? "club-green club-success club-border" :
                                selectedMode.difficulty === "Moderate" ? "club-yellow club-accent club-border" :
                                    "club-red club-danger club-border"
                                }`}>
                                {selectedMode.difficulty}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-heading club-muted text-sm font-bold uppercase tracking-wider">Skills</span>
                            <div className="flex gap-2">
                                {selectedMode.skills.map(skill => (
                                    <Badge key={skill} variant="outline" className="club-border club-ink">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-heading club-muted text-sm font-bold uppercase tracking-wider">Questions</span>
                            <span className="font-heading club-ink font-bold">{selectedMode.questionFrequency}</span>
                        </div>
                    </CardContent>
                </Card>

                {isSolo && (
                    <Card className="club-well club-border ">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="font-heading club-muted text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4 club-accent" />
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
                                        className={`club-action h-10 rounded-xl club-border font-bold transition-all ${duration === opt.value
                                            ? "club-purple club-border club-ink "
                                            : "club-well club-muted club-well club-ink"
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
                        className={`club-action w-full h-16 club-surface club-ink text-2xl font-black rounded-xl transition-all ${isSelecting ? "scale-95 opacity-50" : "hover:scale-105"}`}
                    >
                        {isSelecting ? "Initializing Arena..." : (selectedMode.isPlus ? "Unlock Mode" : (isSolo ? "Play Solo" : "Host Game"))}
                    </Button>
                    <p className="font-heading text-center club-muted text-xs mt-4">
                        Subject: <span className="font-heading club-accent font-bold">{subjectName}</span>
                    </p>
                </div>
            </div>

            {/* Main Content: Mode Grid */}
            <div className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col gap-8 club-surface">
                <div className="flex items-center justify-between">
                    <h2 className="font-heading text-4xl font-black club-ink">Select Mode</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 club-well rounded-full border club-border">
                            <Users className="w-4 h-4 club-accent" />
                            <span className="font-heading club-ink font-bold">Live Lobby</span>
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
 club-well club-border club-border
 hover:-translate-y-2
 ${selectedId === mode.id ? 'ring-2 club-well' : ''}
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
                                        <div className={`absolute inset-0 club-surface `} />
                                    </div>
                                )}

                                {/* Card Content */}
                                <CardHeader className="relative z-10 pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-3 rounded-xl club-surface ${mode.color} club-ink group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            {mode.icon}
                                        </div>
                                        <Badge className="club-well club-ink club-border text-xs uppercase font-black tracking-wide px-2 py-0.5 ">
                                            {mode.difficulty}
                                        </Badge>
                                    </div>
                                    <CardTitle className="font-heading text-2xl font-black club-ink tracking-tight club-accent transition-colors">
                                        {mode.name}
                                    </CardTitle>
                                    <CardDescription className="font-heading club-muted text-sm line-clamp-2 min-h-[40px] font-medium leading-relaxed">
                                        {mode.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="relative z-10 space-y-4 pt-0">
                                    <div className="flex flex-wrap gap-1.5">
                                        {mode.skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="club-well club-muted border-none text-xs font-bold px-1.5 py-0">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t club-border">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 club-accent" />
                                                <span className="font-heading text-xs font-black club-muted uppercase tracking-tighter">{mode.idealTime}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 club-accent" />
                                                <span className="font-heading text-xs font-black club-muted uppercase tracking-tighter">{mode.questionFrequency}</span>
                                            </div>
                                        </div>
                                        {selectedId === mode.id && (
                                            <div className="w-2 h-2 rounded-full club-purple " />
                                        )}
                                    </div>
                                </CardContent>

                                {/* Hover Glow Effect */}
                                <div className="absolute -inset-1 club-surface rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-500" />

                                {/* Interactive Particles on Hover */}
                                <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-1 club-purple rounded-full animate-mode-particle"
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
                <div className="fixed inset-0 z-[100] club-surface animate-flash-white flex items-center justify-center">
                    <div className="font-heading text-center">
                        <Sparkles className="w-24 h-24 club-accent mb-4" />
                        <h2 className="font-heading text-4xl font-black club-accent tracking-tighter">PREPARING ARENA</h2>
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
