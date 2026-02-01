"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Star, ArrowRight, Home, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

interface PlayerScore {
    id: string
    username: string
    score: number
    avatar?: string
}

interface GameResultsProps {
    score: number
    totalQuestions: number // or total weight for fishing? let's stick to score
    highScore: number
    leaderboard: PlayerScore[]
    onExit: () => void
    onPlayAgain?: () => void
}

export default function GameResults({
    score,
    totalQuestions,
    highScore,
    leaderboard,
    onExit,
    onPlayAgain
}: GameResultsProps) {
    const [showLeaderboard, setShowLeaderboard] = useState(false)

    // Auto-show leaderboard after a delay
    useEffect(() => {
        const timer = setTimeout(() => setShowLeaderboard(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score)
    const userRank = sortedLeaderboard.findIndex(p => p.score === score) + 1 // This is a simplistic check, ideally pass user ID

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f101a] text-white flex items-center justify-center p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0f101a] to-blue-900/20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

            <div className="max-w-4xl w-full flex gap-8 z-10">
                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 space-y-6"
                >
                    <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                        <CardHeader className="text-center pt-10 pb-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                                className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4"
                            >
                                <Trophy className="w-12 h-12 text-white" />
                            </motion.div>
                            <CardTitle className="text-4xl font-black uppercase tracking-tighter text-white">
                                Game Over!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-8 p-8">
                            <div>
                                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-1">Total Score</p>
                                <div className="text-6xl font-black bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                                    {score.toLocaleString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-2xl font-black text-yellow-400">#{userRank > 0 ? userRank : "-"}</div>
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Rank</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-2xl font-black text-purple-400">{highScore > score ? highScore.toLocaleString() : "NEW!"}</div>
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">High Score</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={onExit}
                            className="bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl font-bold text-lg"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Lobby
                        </Button>
                        {onPlayAgain && (
                            <Button
                                onClick={onPlayAgain}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white h-14 rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20"
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Play Again
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Leaderboard Section */}
                {showLeaderboard && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-[400px] flex flex-col"
                    >
                        <div className="bg-slate-900/80 border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 flex-1 flex flex-col shadow-2xl">
                            <h3 className="text-2xl font-black flex items-center gap-3 mb-6">
                                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                Leaderboard
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {sortedLeaderboard.map((player, index) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center justify-between p-4 rounded-2xl ${player.score === score
                                                ? "bg-purple-500/20 border border-purple-500/50"
                                                : "bg-white/5 border border-white/5"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                                ${index === 0 ? "bg-yellow-500 text-black" :
                                                    index === 1 ? "bg-slate-300 text-black" :
                                                        index === 2 ? "bg-orange-500 text-black" : "bg-white/10 text-white/40"}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <div className="font-bold truncate max-w-[120px]">{player.username}</div>
                                        </div>
                                        <div className="font-mono font-black text-white/80">{player.score.toLocaleString()}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
