"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Timer, Trophy, Star, Anchor, Waves, Fish, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Question {
    id: string
    question: string
    options: string[]
    correctIndex: number
}

interface FishingFrenzyProps {
    grade: number
    subject: string
    mode: "solo" | "host" | "join"
    gameMode: string
    questions: Question[]
    durationSeconds: number
    onEnd: (score: number) => void
    onScoreUpdate?: (score: number) => void
    onAwardTokens?: (amount: number) => void
}

type GameState = "idle" | "casting" | "waiting" | "hooked" | "question" | "result"

export default function FishingFrenzy({
    grade,
    subject,
    mode,
    questions,
    durationSeconds,
    onEnd,
    onScoreUpdate,
    onAwardTokens
}: FishingFrenzyProps) {
    const [gameState, setGameState] = useState<GameState>("idle")
    const [timeLeft, setTimeLeft] = useState(durationSeconds)
    const [score, setScore] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [lastCatch, setLastCatch] = useState<{ name: string; weight: number; rarity: string; color?: string } | null>(null)
    const [isGameOver, setIsGameOver] = useState(false)

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0 || isGameOver) return
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(timer)
    }, [timeLeft, isGameOver])

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsGameOver(true)
            onEnd(score)
        }
    }, [timeLeft, score, onEnd])

    const handleCast = () => {
        if (gameState !== "idle" && gameState !== "result") return
        setGameState("casting")

        // Random wait time before bite
        setTimeout(() => {
            setGameState("waiting")
            const biteDelay = 2000 + Math.random() * 3000
            setTimeout(() => {
                setGameState("hooked")
            }, biteDelay)
        }, 1000)
    }


    const handleReel = () => {
        if (gameState !== "hooked") return
        setGameState("question")
    }

    // Weighted tier system
    const getTierAndWeight = () => {
        const roll = Math.random() * 100

        // S Tier: 1% chance - SUPER RARE
        if (roll < 1) {
            return { tier: "S", weight: 10000, color: "from-yellow-400 to-orange-600 animate-pulse" }
        }
        // A Tier: 9% chance (1-10) - High LBS
        if (roll < 10) {
            const weight = 500 + Math.floor(Math.random() * 500) // 500-1000 lbs
            return { tier: "A", weight, color: "from-purple-500 to-pink-600" }
        }
        // B Tier: 20% chance (10-30)
        if (roll < 30) {
            const weight = 100 + Math.floor(Math.random() * 200) // 100-300 lbs
            return { tier: "B", weight, color: "from-blue-500 to-cyan-500" }
        }
        // C Tier: 30% chance (30-60)
        if (roll < 60) {
            const weight = 25 + Math.floor(Math.random() * 50) // 25-75 lbs
            return { tier: "C", weight, color: "from-green-500 to-emerald-600" }
        }
        // D Tier: 40% chance (60-100) - Lowest
        const weight = 1 + Math.floor(Math.random() * 20) // 1-20 lbs
        return { tier: "D", weight, color: "from-gray-400 to-slate-500" }
    }

    const handleAnswer = (index: number) => {
        const correct = index === questions[currentQuestionIndex].correctIndex

        if (correct) {
            const { tier, weight, color } = getTierAndWeight()

            const fishByTier: Record<string, string[]> = {
                "S": ["Golden Kraken", "Diamond Leviathan", "Cosmic Whale", "Radioactive Shark"],
                "A": ["Great White Shark", "Giant Squid", "Megalodon Pup", "Swordfish Titan"],
                "B": ["Electric Eel", "Marlin", "Barracuda", "Stingray"],
                "C": ["Tuna", "Salmon", "Catfish", "Bass"],
                "D": ["Goldfish", "Sardine", "Clownfish", "Old Boot"]
            }
            const fishNames = fishByTier[tier] || fishByTier["D"]
            const fish = fishNames[Math.floor(Math.random() * fishNames.length)]

            setLastCatch({ name: fish, weight, rarity: tier, color })
            setScore(prev => prev + weight)
            if (onScoreUpdate) onScoreUpdate(score + weight)
            if (onAwardTokens) onAwardTokens(tier === "S" ? 500 : Math.floor(weight / 5))
            setGameState("result")
        } else {
            setGameState("idle")
        }

        // Move to next question or loop
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    }

    return (
        <div className="relative w-full h-full bg-[#1a1c2c] overflow-hidden flex flex-col">
            {/* Header / Stats */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10">
                        <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-black text-white">{score} lbs</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10">
                        <Timer className={`w-6 h-6 ${timeLeft < 30 ? "text-red-500 animate-pulse" : "text-purple-400"}`} />
                        <span className="text-2xl font-black text-white tabular-nums">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Game Canvas / World */}
            <div className="relative flex-1 cursor-pointer select-none" onClick={handleCast}>
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-600">
                    <img
                        src="/images/fishing-frenzy/background.png"
                        alt="Fishing Background"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                </div>

                {/* Ocean Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-blue-600/30 backdrop-blur-[2px]">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 animate-wave-flow" />
                </div>

                {/* Pier */}
                <div className="absolute bottom-[35%] left-0 w-[40%] h-12 bg-orange-800 rounded-r-lg shadow-2xl z-10">
                    <div className="absolute -bottom-24 left-10 w-4 h-24 bg-orange-950" />
                    <div className="absolute -bottom-24 left-40 w-4 h-24 bg-orange-950" />
                </div>

                {/* Robot / Fisher */}
                <div className="absolute bottom-[28%] left-[10%] z-20">
                    <motion.div
                        animate={gameState === "casting" ? { rotate: -20, y: -10 } : { rotate: 0, y: 0 }}
                        className="relative"
                    >
                        <div className="w-32 h-32 flex items-center justify-center">
                            <img
                                src="/images/fishing-frenzy/robot.png"
                                alt="Fishing Robot"
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fisher' }}
                            />
                        </div>
                        {/* Fishing Rod Extension (invisible but anchor for line) */}
                        <motion.div
                            initial={{ rotate: 35 }}
                            animate={gameState === "hooked" ? { rotate: [30, 40, 30] } : { rotate: 35 }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="absolute top-8 left-20 w-32 h-2 origin-left rounded-full"
                        >
                            {/* Fishing Line */}
                            <div className="absolute right-4 top-1 w-0.5 h-[300px] bg-white/60 blur-[1px] origin-top" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* UI Prompts */}
                <div className="absolute inset-x-0 bottom-[10%] flex justify-center z-30">
                    <AnimatePresence>
                        {gameState === "idle" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/20 text-white font-black text-2xl shadow-2xl"
                            >
                                CLICK ANYWHERE TO CAST
                            </motion.div>
                        )}
                        {gameState === "hooked" && (
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1.2, rotate: 10 }}
                                className="bg-orange-500 px-12 py-6 rounded-3xl border-8 border-white text-white font-black text-6xl shadow-[0_0_50px_rgba(249,115,22,0.5)] cursor-pointer hover:scale-125 transition-transform"
                                onClick={(e) => { e.stopPropagation(); handleReel(); }}
                            >
                                HOOKED!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Question Overlay */}
            <AnimatePresence>
                {gameState === "question" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[50] flex items-center justify-center p-6"
                    >
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-lg" />
                        <Card className="w-full max-w-4xl relative bg-slate-800 border-white/10 shadow-2xl overflow-hidden">
                            <div className="h-2 bg-slate-700">
                                <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 15, ease: "linear" }}
                                    className="h-full bg-purple-500"
                                    onAnimationComplete={() => setGameState("idle")}
                                />
                            </div>
                            <CardContent className="p-12 space-y-12">
                                <h3 className="text-4xl font-black text-white text-center leading-tight">
                                    {questions[currentQuestionIndex].question}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {questions[currentQuestionIndex].options.map((option, idx) => (
                                        <Button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={`h-24 text-2xl font-black rounded-3xl border-4 border-black/20 shadow-xl transition-all hover:scale-105 active:scale-95 ${idx === 0 ? "bg-orange-500 hover:bg-orange-600" :
                                                idx === 1 ? "bg-blue-500 hover:bg-blue-600" :
                                                    idx === 2 ? "bg-green-500 hover:bg-green-600" :
                                                        "bg-purple-500 hover:bg-purple-600"
                                                }`}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Popup */}
            <AnimatePresence>
                {gameState === "result" && lastCatch && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-white rounded-[40px] p-1 border-8 border-orange-500 shadow-[0_0_100px_rgba(249,115,22,0.6)] w-72 aspect-[3/4] flex flex-col items-center justify-center gap-6 animate-bounce">
                            <div className="text-center">
                                <div className="text-slate-900 font-black text-2xl uppercase tracking-widest">{lastCatch.rarity}</div>
                                <div className="text-slate-600 font-bold">{lastCatch.name}</div>
                            </div>
                            <div className="w-32 h-32 bg-orange-100 rounded-3xl flex items-center justify-center text-6xl">
                                🐟
                            </div>
                            <div className="text-center">
                                <div className={`font-black text-6xl italic ${lastCatch.rarity === "S" ? "text-yellow-500 animate-pulse" :
                                    lastCatch.rarity === "A" ? "text-purple-500" :
                                        lastCatch.rarity === "B" ? "text-blue-500" :
                                            lastCatch.rarity === "C" ? "text-green-500" :
                                                "text-gray-500"
                                    }`}>
                                    {lastCatch.rarity} Tier
                                </div>
                                <div className="text-slate-900 font-black text-4xl">{lastCatch.weight} lbs</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over */}
            {isGameOver && (
                <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center">
                    <Star className="w-24 h-24 text-yellow-500 fill-yellow-500 animate-bounce mb-8" />
                    <h2 className="text-7xl font-black text-white mb-4 tracking-tighter">TIME'S UP!</h2>
                    <p className="text-4xl text-purple-400 font-black mb-12">TOTAL WEIGHT: {score} lbs</p>
                    <Button
                        onClick={() => onEnd(score)}
                        className="px-12 py-8 bg-white text-black text-3xl font-black rounded-3xl hover:bg-purple-400 hover:text-white transition-all transform hover:scale-110"
                    >
                        RETURN TO LOBBY
                    </Button>
                </div>
            )}
        </div>
    )
}
