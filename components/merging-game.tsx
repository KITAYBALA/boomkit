"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Trophy, Star, ArrowUp, ArrowDown, Zap, BookOpen } from "lucide-react"

interface Question {
    id: string
    question: string
    options: string[]
    correctIndex: number
}

interface MergeItem {
    id: string
    rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical"
    emoji: string
    x: number
    y: number
    isMerging?: boolean
}

interface MergingGameProps {
    grade: number
    subject: string
    mode: "solo" | "host" | "join"
    onEnd: (score: number) => void
    questions: Question[]
    durationSeconds: number
}

const RARITY_DATA = {
    uncommon: { emoji: "📦", points: 0, next: "rare", nextPoints: 1, color: "text-green-400" },
    rare: { emoji: "💎", points: 1, next: "epic", nextPoints: 2, color: "text-blue-400" },
    epic: { emoji: "🔥", points: 2, next: "legendary", nextPoints: 3, color: "text-purple-400" },
    legendary: { emoji: "👑", points: 3, next: "chroma", nextPoints: 5, color: "text-yellow-400" },
    chroma: { emoji: "🌈", points: 5, next: "mystical", nextPoints: 10, color: "text-pink-400" },
    mystical: { emoji: "✨", points: 10, next: null, nextPoints: 0, color: "text-cyan-400" },
}

const DROP_RATES = [
    { rarity: "uncommon", chance: 60 },
    { rarity: "rare", chance: 25 },
    { rarity: "epic", chance: 10 },
    { rarity: "legendary", chance: 4 },
    { rarity: "chroma", chance: 0.9 },
    { rarity: "mystical", chance: 0.1 },
]

export default function MergingGame({ grade, subject, mode, onEnd, questions, durationSeconds }: MergingGameProps) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds)
    const [score, setScore] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [mergingBooms, setMergingBooms] = useState<MergeItem[]>([])
    const [nextBooms, setNextBooms] = useState<string[]>(["uncommon", "uncommon", "uncommon"])
    const [isAnswering, setIsAnswering] = useState(true)
    const [isGameOver, setIsGameOver] = useState(false)
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

    const gameAreaRef = useRef<HTMLDivElement>(null)

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0 || isGameOver) {
            if (!isGameOver) handleGameOver()
            return
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, isGameOver])

    const handleGameOver = () => {
        setIsGameOver(true)
        onEnd(score)
    }

    const getRandomRarity = () => {
        const r = Math.random() * 100
        let cumulative = 0
        for (const item of DROP_RATES) {
            cumulative += item.chance
            if (r <= cumulative) return item.rarity
        }
        return "uncommon"
    }

    const handleAnswer = (index: number) => {
        const currentQuestion = questions[currentQuestionIndex]
        if (index === currentQuestion.correctIndex) {
            setFeedback("correct")
            setIsAnswering(false)
            setTimeout(() => {
                setFeedback(null)
            }, 1000)
        } else {
            setFeedback("incorrect")
            setTimeout(() => {
                setFeedback(null)
                setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
            }, 1000)
        }
    }

    const dropBoom = () => {
        if (isAnswering) return

        const rarity = nextBooms[0] as keyof typeof RARITY_DATA
        const newBoom: MergeItem = {
            id: Math.random().toString(36).substr(2, 9),
            rarity: rarity as any,
            emoji: RARITY_DATA[rarity].emoji,
            x: Math.random() * 80 + 10,
            y: 0,
        }

        setMergingBooms((prev) => [...prev, newBoom])
        setNextBooms((prev) => [...prev.slice(1), getRandomRarity()])
        setIsAnswering(true)
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    }

    // Simulation
    useEffect(() => {
        if (isGameOver) return

        const simulation = setInterval(() => {
            setMergingBooms((prev) => {
                const next = prev.map((b) => {
                    if (b.y < 85) {
                        return { ...b, y: b.y + 2 }
                    }
                    return b
                })

                const merged: MergeItem[] = []
                const toRemove = new Set<string>()

                for (let i = 0; i < next.length; i++) {
                    if (toRemove.has(next[i].id)) continue
                    for (let j = i + 1; j < next.length; j++) {
                        if (toRemove.has(next[j].id)) continue

                        const b1 = next[i]
                        const b2 = next[j]

                        const dist = Math.sqrt(Math.pow(b1.x - b2.x, 2) + Math.pow(b1.y - b2.y, 2))
                        if (b1.rarity === b2.rarity && dist < 10 && b1.y > 80 && b2.y > 80) {
                            const data = RARITY_DATA[b1.rarity]
                            if (data.next) {
                                const nextRarity = data.next as keyof typeof RARITY_DATA
                                merged.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    rarity: nextRarity as any,
                                    emoji: RARITY_DATA[nextRarity].emoji,
                                    x: (b1.x + b2.x) / 2,
                                    y: 85,
                                })
                                setScore((s) => s + data.nextPoints)
                                toRemove.add(b1.id)
                                toRemove.add(b2.id)

                                if (nextRarity === "mystical") {
                                    setTimeout(handleGameOver, 500)
                                }
                            }
                        }
                    }
                }

                return [...next.filter((b) => !toRemove.has(b.id)), ...merged]
            })
        }, 100)

        return () => clearInterval(simulation)
    }, [isGameOver])

    const currentQuestion = questions[currentQuestionIndex]

    if (isGameOver) {
        return (
            <div className="flex items-center justify-center min-h-[600px] animate-in zoom-in-95 duration-500">
                <Card className="w-full max-w-lg bg-slate-900/90 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                    <CardHeader className="text-center">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <CardTitle className="text-4xl font-black text-white">GAME OVER!</CardTitle>
                        <CardDescription className="text-purple-300 text-xl font-bold mt-2">
                            Final Score: {score} pts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                            <p className="text-white/60 font-medium">You reached high tiers!</p>
                            <div className="flex justify-center gap-4 mt-4">
                                {Object.entries(RARITY_DATA).map(([key, data]) => (
                                    <div key={key} className="flex flex-col items-center">
                                        <span className="text-2xl">{data.emoji}</span>
                                        <span className={`text-[10px] uppercase font-black ${data.color}`}>{key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => window.location.reload()} className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xl rounded-2xl shadow-lg">
                            PLAY AGAIN
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-2 rounded-xl">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">{subject}</h2>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Grade {grade}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Time Left</p>
                        <div className="flex items-center gap-2 text-2xl font-black text-white">
                            <Timer className={`w-5 h-5 ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-cyan-400"}`} />
                            {timeLeft}s
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Score</p>
                        <div className="flex items-center gap-2 text-2xl font-black text-yellow-500">
                            <Star className="w-5 h-5" />
                            {score}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                <div className="flex flex-col space-y-4">
                    <Card className="flex-1 bg-white/5 border-white/10 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                            <div
                                className="h-full bg-purple-500 transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        <CardContent className="flex flex-col h-full pt-10">
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-8">
                                    {currentQuestion.question}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                                {currentQuestion.options.map((option, i) => (
                                    <Button
                                        key={i}
                                        onClick={() => isAnswering && handleAnswer(i)}
                                        disabled={!isAnswering}
                                        className={`h-24 rounded-2xl text-lg font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 ${feedback === "correct" && i === currentQuestion.correctIndex ? "bg-green-500 border-green-700" :
                                                feedback === "incorrect" && i !== currentQuestion.correctIndex ? "bg-red-500/20 border-red-900/40 text-white/40" :
                                                    "bg-white/10 hover:bg-white/20 border-white/5 text-white"
                                            }`}
                                    >
                                        {option}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>

                        {feedback && (
                            <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10 scale-110 transition-transform duration-300`}>
                                <div className={`text-6xl font-black uppercase tracking-[0.2em] transform -rotate-12 ${feedback === "correct" ? "text-green-500" : "text-red-500"}`}>
                                    {feedback === "correct" ? "CORRECT!" : "WRONG!"}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="flex flex-col space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Next Booms</p>
                            {!isAnswering && <div className="text-green-400 text-xs font-black animate-pulse flex items-center gap-1"><Zap size={12} /> READY TO DROP!</div>}
                        </div>
                        <div className="flex gap-4 justify-center">
                            {nextBooms.map((rarity, i) => (
                                <div
                                    key={i}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 transition-all duration-300 ${i === 0 ? "bg-white/10 border-white/30 scale-110 shadow-white/10" : "bg-white/5 border-white/5 opacity-50"
                                        }`}
                                    onClick={() => i === 0 && !isAnswering && dropBoom()}
                                >
                                    {RARITY_DATA[rarity as keyof typeof RARITY_DATA].emoji}
                                </div>
                            ))}
                        </div>
                        <Button
                            disabled={isAnswering}
                            onClick={dropBoom}
                            className={`w-full mt-4 h-12 rounded-xl font-black uppercase tracking-widest transition-all ${!isAnswering ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-white/5 text-white/20"}`}
                        >
                            <ArrowDown className="mr-2" /> DROP BOOM
                        </Button>
                    </div>

                    <div
                        ref={gameAreaRef}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl relative overflow-hidden min-h-[400px]"
                    >
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="w-full h-full" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                        </div>

                        <div className="absolute bottom-0 left-0 w-full h-4 bg-white/5" />

                        {mergingBooms.map((boom) => (
                            <div
                                key={boom.id}
                                className="absolute w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10 border border-white/20 shadow-lg z-20 transition-all duration-100 ease-linear"
                                style={{ left: `${boom.x}%`, top: `${boom.y}%` }}
                            >
                                {boom.emoji}
                                {(boom.rarity === "legendary" || boom.rarity === "chroma" || boom.rarity === "mystical") && (
                                    <div className={`absolute inset-0 rounded-xl animate-pulse blur-md opacity-50 ${RARITY_DATA[boom.rarity].color.replace("text-", "bg-")}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
