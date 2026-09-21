"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { stepMergeBoard, weightedRarity } from "@/lib/merge-game-engine"
import { useGameRewards } from '@/hooks/use-game-rewards'
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
    rarity: "uncommon" | "rare" | "epic" | "legendary" | "chroma" | "mystical" | "hidden"
    emoji: string
    x: number
    y: number
    isMerging?: boolean
}

interface MergingGameProps {
    sessionPin?: string
    forceEnd?: boolean
    grade: number
    subject: string
    mode: "solo" | "host" | "join"
    gameMode: string
    questions: Question[]
    durationSeconds: number
    startTimeOffset?: number
    onEnd: (score: number, correctAnswers?: number, questionsAnswered?: number, rewards?: { tokens: number; xp: number }) => void
    onScoreUpdate?: (score: number) => void
    onAwardTokens?: (amount: number) => void
}

interface ModeConfig {
    rewardMultiplier: number
    dropRateShift: number // Positive increases rare drop chances
    timeBonus: number // Seconds added to duration
}

const DEFAULT_CONFIG: ModeConfig = { rewardMultiplier: 1, dropRateShift: 0, timeBonus: 0 }

const MODE_CONFIGS: Record<string, ModeConfig> = {
    "classic": { rewardMultiplier: 1, dropRateShift: 0, timeBonus: 0 },
    "factory": { rewardMultiplier: 1.2, dropRateShift: 5, timeBonus: 30 },
    "cafe": { rewardMultiplier: 1.1, dropRateShift: 2, timeBonus: 0 },
    "racing": { rewardMultiplier: 1.5, dropRateShift: -5, timeBonus: -30 }, // Stressful/High reward
    "blook-rush": { rewardMultiplier: 1.3, dropRateShift: 10, timeBonus: 0 },
    "dino-world": { rewardMultiplier: 1.4, dropRateShift: 0, timeBonus: 60 },
    "space-explorer": { rewardMultiplier: 1.5, dropRateShift: 2, timeBonus: 120 },
    "wild-west": { rewardMultiplier: 1.2, dropRateShift: 8, timeBonus: 0 },
    "city-builder": { rewardMultiplier: 1.1, dropRateShift: 0, timeBonus: 300 },
    "pirate-booty": { rewardMultiplier: 1.3, dropRateShift: 15, timeBonus: 0 },
    "alchemy": { rewardMultiplier: 1.6, dropRateShift: 0, timeBonus: 60 },
    "dungeon-crawl": { rewardMultiplier: 1.4, dropRateShift: 5, timeBonus: 90 },
    "farm-tycoon": { rewardMultiplier: 1.2, dropRateShift: -2, timeBonus: 180 },
    "monster-brawl": { rewardMultiplier: 1.4, dropRateShift: 10, timeBonus: 0 },
    "zombie-uprising": { rewardMultiplier: 1.3, dropRateShift: 0, timeBonus: 45 },
    "kingdom": { rewardMultiplier: 1.2, dropRateShift: 3, timeBonus: 150 },
    "escape-room": { rewardMultiplier: 2.0, dropRateShift: 20, timeBonus: -60 }, // Harder, massive rewards
    "stock-market": { rewardMultiplier: 1.5, dropRateShift: 5, timeBonus: 0 },
    "cyberpunk": { rewardMultiplier: 1.7, dropRateShift: 10, timeBonus: 30 },
    "magic-academy": { rewardMultiplier: 1.4, dropRateShift: 5, timeBonus: 60 },
    "submarine": { rewardMultiplier: 1.3, dropRateShift: -5, timeBonus: 120 },
    "volcano-escape": { rewardMultiplier: 1.8, dropRateShift: 15, timeBonus: -45 },
    "candy-land": { rewardMultiplier: 1.1, dropRateShift: 0, timeBonus: 15 },
    "robot-war": { rewardMultiplier: 1.5, dropRateShift: 5, timeBonus: 60 },
    "gladiator": { rewardMultiplier: 1.6, dropRateShift: 10, timeBonus: 0 },
    "gold-quest": { rewardMultiplier: 1.2, dropRateShift: 20, timeBonus: 0 },
    "fishing-frenzy": { rewardMultiplier: 1.1, dropRateShift: 5, timeBonus: 60 },
    "crypto-hack": { rewardMultiplier: 1.4, dropRateShift: 10, timeBonus: 0 },
    "tower-defense": { rewardMultiplier: 1.5, dropRateShift: 5, timeBonus: 180 },
    "battle-royale": { rewardMultiplier: 1.6, dropRateShift: 10, timeBonus: -60 },
};

const RARITY_DATA = {
    uncommon: { emoji: "📦", points: 0, next: "rare", nextPoints: 1, color: "text-green-400", tokenAward: 0 },
    rare: { emoji: "💎", points: 1, next: "epic", nextPoints: 2, color: "text-blue-400", tokenAward: 10 },
    epic: { emoji: "🔥", points: 2, next: "legendary", nextPoints: 3, color: "text-purple-400", tokenAward: 20 },
    legendary: { emoji: "👑", points: 3, next: "chroma", nextPoints: 5, color: "text-yellow-400", tokenAward: 50 },
    chroma: { emoji: "🌈", points: 5, next: "hidden", nextPoints: 8, color: "text-pink-400", tokenAward: 100 },
    hidden: { emoji: "🖤", points: 8, next: "mystical", nextPoints: 10, color: "text-slate-400", tokenAward: 150 },
    mystical: { emoji: "✨", points: 10, next: null, nextPoints: 0, color: "text-cyan-400", tokenAward: 250 },
}

const DROP_RATES = [
    { rarity: "uncommon", chance: 60 },
    { rarity: "rare", chance: 25 },
    { rarity: "epic", chance: 10 },
    { rarity: "legendary", chance: 4 },
    { rarity: "chroma", chance: 0.9 },
    { rarity: "hidden", chance: 0.09 },
    { rarity: "mystical", chance: 0.01 },
]

export default function MergingGame({
    grade,
    subject,
    mode,
    gameMode,
    onEnd,
    questions,
    durationSeconds,
    onScoreUpdate,
    onAwardTokens,
    startTimeOffset,
    sessionPin, forceEnd,
}: MergingGameProps) {
    const rewards = useGameRewards(questions, durationSeconds - (startTimeOffset || 0), sessionPin)
    const config = MODE_CONFIGS[gameMode] || DEFAULT_CONFIG
    const initialTime = Math.max(0, durationSeconds - (startTimeOffset || 0))
    const [timeLeft, setTimeLeft] = useState(initialTime)
    const [score, setScore] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [mergingBooms, setMergingBooms] = useState<MergeItem[]>([])
    const [nextBooms, setNextBooms] = useState<string[]>(["uncommon", "uncommon", "uncommon"])
    const [isAnswering, setIsAnswering] = useState(true)
    const [isGameOver, setIsGameOver] = useState(false)
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
    const [currentBoomX, setCurrentBoomX] = useState(50) // Horizontal position 0-100
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [questionsAnswered, setQuestionsAnswered] = useState(0)
    const [shuffledOptions, setShuffledOptions] = useState<{ text: string, originalIndex: number }[]>([])

    const gameAreaRef = useRef<HTMLDivElement>(null)

    const endedRef = useRef(false)
    const answerLockedRef = useRef(false)
    const dropReadyRef = useRef(false)
    const boardRef = useRef<MergeItem[]>([])
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const latestRef = useRef({ score, correctAnswers, questionsAnswered, onEnd, onAwardTokens })
    latestRef.current = { score, correctAnswers, questionsAnswered, onEnd, onAwardTokens }
    useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout) }, [])
    useEffect(() => { onScoreUpdate?.(score) }, [score, onScoreUpdate])

    // Shuffle options whenever the question changes
    useEffect(() => {
        const question = questions?.[currentQuestionIndex]
        if (question) {
            const optionsWithIndices = question.options?.map((option, index) => ({
                text: option,
                originalIndex: index
            }))
            // Fisher-Yates shuffle
            const shuffled = [...(optionsWithIndices || [])]
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            setShuffledOptions(shuffled)
        }
    }, [currentQuestionIndex, questions])

    // A deadline prevents background-tab throttling from extending the game.
    useEffect(() => {
        const deadline = Date.now() + Math.max(0, durationSeconds - (startTimeOffset || 0)) * 1000
        const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
        tick()
        const timer = setInterval(tick, 250)
        return () => clearInterval(timer)
    }, [durationSeconds, startTimeOffset])

    useEffect(() => {
        if (timeLeft <= 0 || forceEnd) handleGameOver()
    }, [timeLeft,forceEnd])

    const handleGameOver = () => {
        if (endedRef.current) return
        endedRef.current = true
        timeoutsRef.current.forEach(clearTimeout)
        setIsGameOver(true)
        const latest = latestRef.current
        void rewards.finish().catch(error => { alert(error.message); return { tokens: 0, xp: 0 } }).then(result => {
            latest.onEnd(latest.score, latest.correctAnswers, latest.questionsAnswered, result)
        })
    }

    const getRandomRarity = () => weightedRarity(DROP_RATES, config.dropRateShift, Math.random())

    const handleAnswer = (shuffledIndex: number) => {
        if (endedRef.current || !isAnswering || answerLockedRef.current || !shuffledOptions[shuffledIndex]) return
        answerLockedRef.current = true
        const originalIndex = shuffledOptions[shuffledIndex].originalIndex
        rewards.answer(originalIndex)
        setQuestionsAnswered(prev => prev + 1)

        if (originalIndex === questions[currentQuestionIndex]?.correctIndex) {
            setFeedback("correct")
            setCorrectAnswers(prev => prev + 1)
            setScore(prev => prev + Math.ceil(10 * config.rewardMultiplier))
            timeoutsRef.current.push(setTimeout(() => {
                if (endedRef.current) return
                setFeedback(null)
                dropReadyRef.current = true
                dropBoom()
                setCurrentQuestionIndex(prev => (prev + 1) % questions.length)
                answerLockedRef.current = false
            }, 500))
        } else {
            setFeedback("incorrect")
            timeoutsRef.current.push(setTimeout(() => {
                if (endedRef.current) return
                setFeedback(null)
                setCurrentQuestionIndex(prev => (prev + 1) % questions.length)
                answerLockedRef.current = false
            }, 1000))
        }
    }

    // Keyboard controls
    useEffect(() => {
        if (isGameOver || isAnswering) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setCurrentBoomX(prev => Math.max(5, prev - 5))
            } else if (e.key === "ArrowRight") {
                setCurrentBoomX(prev => Math.min(95, prev + 5))
            } else if (e.key === "ArrowDown" || e.key === " ") {
                dropBoom()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isGameOver, isAnswering, currentBoomX])

    const dropBoom = () => {
        if (endedRef.current || !dropReadyRef.current) return
        dropReadyRef.current = false

        const rarity = nextBooms[0] as keyof typeof RARITY_DATA
        const newBoom: MergeItem = {
            id: Math.random().toString(36).substr(2, 9),
            rarity: rarity as any,
            emoji: RARITY_DATA[rarity].emoji,
            x: currentBoomX,
            y: 0,
        }

        boardRef.current = [...boardRef.current, newBoom]
        setMergingBooms(boardRef.current)
        setNextBooms((prev) => [...prev.slice(1), getRandomRarity()])
        setIsAnswering(true)
        setCurrentBoomX(50) // Reset for next turn
    }

    // Keep rewards outside React state updaters, which may run twice in Strict Mode.
    useEffect(() => {
        const simulation = setInterval(() => {
            if (endedRef.current) return
            const result = stepMergeBoard(boardRef.current, RARITY_DATA, () => crypto.randomUUID())
            boardRef.current = result.pieces as MergeItem[]
            setMergingBooms(boardRef.current)
            if (result.points) setScore(value => value + result.points)
            if (result.tokens) latestRef.current.onAwardTokens?.(result.tokens)
            if (result.reachedTopTier) timeoutsRef.current.push(setTimeout(handleGameOver, 500))
        }, 50)
        return () => clearInterval(simulation)
    }, [])

    if (!Array.isArray(questions) || questions.length === 0) {
        return <div className="flex items-center justify-center w-full h-full text-white">Waiting for questions...</div>
    }


    if (isGameOver) {
        return (
            <div className="flex items-center justify-center min-h-[600px] animate-in zoom-in-95 duration-500">
                <Card className="w-full max-w-lg bg-slate-900/90 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                    <CardHeader className="font-heading text-center">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <CardTitle className="font-heading text-4xl font-black text-white">GAME OVER!</CardTitle>
                        <CardDescription className="font-heading text-purple-300 text-xl font-bold mt-2">
                            Final Score: {score} pts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                            <p className="font-heading text-white/60 font-medium">You reached high tiers!</p>
                            <div className="flex justify-center gap-4 mt-4">
                                {Object.entries(RARITY_DATA).map(([key, data]) => (
                                    <div key={key} className="flex flex-col items-center">
                                        <span className="font-heading text-2xl">{data.emoji}</span>
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
                {/* Left: Subject & Grade */}
                <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                    <div className="bg-purple-600 p-2 rounded-xl">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl font-black text-white uppercase tracking-tighter leading-tight">{subject}</h2>
                        <p className="font-heading text-white/40 text-[10px] font-black uppercase tracking-widest">Grade {grade}</p>
                    </div>
                </div>

                {/* Center: Active Mode */}
                <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <p className="font-heading text-[10px] text-white/40 font-black uppercase tracking-widest leading-none">ACTIVE MODE</p>
                        <p className="font-heading text-sm font-black text-white uppercase tracking-tight">{gameMode.replace(/-/g, ' ')}</p>
                    </div>
                </div>

                {/* Right: Time & Score */}
                <div className="flex items-center gap-8 pl-6 border-l border-white/10">
                    <div className="font-heading text-center">
                        <p className="font-heading text-white/40 text-[10px] font-black uppercase tracking-widest">Time Left</p>
                        <div className="flex items-center gap-2 text-2xl font-black text-white">
                            <Timer className={`w-5 h-5 ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-cyan-400"}`} />
                            {timeLeft}s
                        </div>
                    </div>
                    <div className="font-heading text-center">
                        <p className="font-heading text-white/40 text-[10px] font-black uppercase tracking-widest">Score</p>
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
                                <h3 className="font-heading text-2xl md:text-3xl font-black text-white leading-tight mb-8">
                                    {questions.length > 0 ? questions[currentQuestionIndex]?.question : "Waiting for game start..."}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                                {questions.length > 0 && shuffledOptions.map((option, i) => (
                                    <Button
                                        key={i}
                                        onClick={() => isAnswering && handleAnswer(i)}
                                        disabled={!isAnswering}
                                        className={`h-24 rounded-2xl text-lg font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 ${feedback === "correct" && option.originalIndex === questions[currentQuestionIndex]?.correctIndex ? "bg-green-500 border-green-700" :
                                            feedback === "incorrect" && option.originalIndex !== questions[currentQuestionIndex]?.correctIndex ? "bg-red-500/20 border-red-900/40 text-white/40" :
                                                "bg-white/10 hover:bg-white/20 border-white/5 text-white"
                                            }`}
                                    >
                                        {option.text}
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
                            <p className="font-heading text-white/40 text-[10px] font-black uppercase tracking-widest">Next Booms</p>
                            {!isAnswering && <div className="font-heading text-green-400 text-xs font-black animate-pulse flex items-center gap-1"><Zap size={12} /> READY TO DROP!</div>}
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

                        {/* Drop Preview */}
                        {!isAnswering && !isGameOver && (
                            <div
                                className="absolute w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/20 border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] z-30 transition-all duration-100 animate-pulse"
                                style={{ left: `${currentBoomX}%`, top: "-4px", transform: "translateX(-50%)" }}
                            >
                                {RARITY_DATA[nextBooms[0] as keyof typeof RARITY_DATA].emoji}
                            </div>
                        )}

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
