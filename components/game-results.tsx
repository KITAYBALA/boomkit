"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Home, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PlayerScore {
    id: string
    username: string
    score: number
    avatar?: string
    accuracy?: number
    careerAccuracy?: number
}

interface GameResultsProps {
    score: number
    totalQuestions: number
    highScore: number
    leaderboard: PlayerScore[]
    tokensEarned: number
    onExit: () => void
    onPlayAgain?: () => void
}

export default function GameResults({
    score,
    totalQuestions,
    highScore,
    leaderboard,
    tokensEarned,
    onExit,
    onPlayAgain
}: GameResultsProps) {
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null)

    // Auto-show leaderboard after a delay
    useEffect(() => {
        const timer = setTimeout(() => setShowLeaderboard(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score)
    const userRank = sortedLeaderboard.findIndex(p => p.score === score) + 1

    return (
        <div className="fixed inset-0 z-[100] club-surface club-ink flex items-center justify-center p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 club-surface pointer-events-none" />
            <div className="club-decoration absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" />

            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 z-10">
                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 space-y-6"
                >
                    <Card className="club-well club-border overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 club-surface " />
                        <CardHeader className="font-heading text-center pt-10 pb-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                                className="w-24 h-24 club-surface rounded-full mx-auto flex items-center justify-center mb-4"
                            >
                                <Trophy className="w-12 h-12 club-ink" />
                            </motion.div>
                            <CardTitle className="font-heading text-4xl font-black uppercase tracking-tighter club-ink">
                                Game Over!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="font-heading text-center space-y-8 p-8">
                            <div>
                                <p className="font-heading club-muted font-bold uppercase tracking-wide text-xs mb-1">Total Score</p>
                                <div className="font-heading text-4xl font-black club-accent">
                                    {score.toLocaleString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="club-well rounded-xl p-4 border club-border">
                                    <div className="font-heading text-2xl font-black club-accent">#{userRank > 0 ? userRank : "-"}</div>
                                    <div className="font-heading text-xs club-muted uppercase font-bold tracking-wide">Rank</div>
                                </div>
                                <div className="club-well rounded-xl p-4 border club-border relative overflow-hidden group">
                                    <div className="font-heading text-2xl font-black club-success">+{tokensEarned}</div>
                                    <div className="font-heading text-xs club-muted uppercase font-bold tracking-wide">Tokens Gained</div>
                                    <div className="absolute top-1 right-1 text-xs">🪙</div>
                                </div>
                                <div className="club-well rounded-xl p-4 border club-border">
                                    <div className="font-heading text-2xl font-black club-accent">{highScore > score ? highScore.toLocaleString() : "NEW!"}</div>
                                    <div className="font-heading text-xs club-muted uppercase font-bold tracking-wide">High Score</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={onExit}
                            className="club-action club-well club-well club-ink h-14 rounded-xl font-bold text-lg"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Lobby
                        </Button>
                        {onPlayAgain && (
                            <Button
                                onClick={onPlayAgain}
                                className="club-action club-surface club-ink h-14 rounded-xl font-black text-lg "
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
                        className="w-full md:w-[400px] flex flex-col"
                    >
                        <div className="club-well border club-border rounded-xl p-6 flex-1 flex flex-col ">
                            <h3 className="font-heading text-2xl font-black flex items-center gap-3 mb-2">
                                <Star className="w-6 h-6 club-accent fill-yellow-400" />
                                Leaderboard
                            </h3>
                            <p className="font-heading text-xs club-muted uppercase font-bold tracking-wide mb-4">Click player to view stats</p>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {sortedLeaderboard.map((player, index) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all ${player.score === score
                                            ? "club-purple border club-border"
                                            : "club-well border club-border"
                                            }`}
                                        onClick={() => setSelectedPlayer(player)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                                ${index === 0 ? "club-yellow club-ink" :
                                                    index === 1 ? "club-well club-ink" :
                                                        index === 2 ? "club-yellow club-ink" : "club-well club-muted"}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <div className="font-bold truncate max-w-[120px]">{player.username}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-heading text-xs club-accent font-bold club-blue px-2 py-0.5 rounded border club-border">
                                                {player.accuracy !== undefined ? `${player.accuracy}%` : "0%"}
                                            </span>
                                            <div className="font-mono font-black club-ink">{(player.score || 0).toLocaleString()}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Player Stats Modal */}
            <AnimatePresence>
                {selectedPlayer && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPlayer(null)}
                            className="absolute inset-0 club-overlay "
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md club-surface border club-border rounded-xl p-8 text-center overflow-hidden"
                        >
                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-2 club-surface " />
                            
                            <h3 className="font-heading text-3xl font-black club-ink uppercase tracking-tighter mb-2">
                                {selectedPlayer.username}
                            </h3>
                            <p className="font-heading club-accent font-bold text-xs uppercase tracking-wide mb-8">Performance Summary</p>

                            <div className="space-y-6">
                                {/* Current Game Accuracy */}
                                <div className="club-well rounded-xl p-5 border club-border flex items-center justify-between">
                                    <div className="font-heading text-left">
                                        <div className="font-heading text-xs club-muted uppercase font-black tracking-wide">Game Accuracy</div>
                                        <div className="font-heading text-xs club-muted">This session's correctness</div>
                                    </div>
                                    <div className="font-heading text-3xl font-black club-accent">
                                        {selectedPlayer.accuracy !== undefined ? `${selectedPlayer.accuracy}%` : "0%"}
                                    </div>
                                </div>

                                {/* Career Average Accuracy */}
                                <div className="club-well rounded-xl p-5 border club-border flex items-center justify-between">
                                    <div className="font-heading text-left">
                                        <div className="font-heading text-xs club-muted uppercase font-black tracking-wide">Average Accuracy</div>
                                        <div className="font-heading text-xs club-muted">All-time career performance</div>
                                    </div>
                                    <div className="font-heading text-3xl font-black club-accent">
                                        {selectedPlayer.careerAccuracy !== undefined ? `${selectedPlayer.careerAccuracy}%` : "0%"}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setSelectedPlayer(null)}
                                className="club-action w-full h-12 mt-8 club-well club-well club-ink font-bold rounded-xl"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
