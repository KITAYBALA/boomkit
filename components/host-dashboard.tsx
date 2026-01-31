"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Trophy,
    Users,
    Timer,
    Zap,
    BarChart3,
    Crown,
    ArrowRight,
    Play,
    Pause,
    XCircle
} from "lucide-react"

interface PlayerScore {
    id: string
    username: string
    score: number
    avatar?: string
}

interface HostDashboardProps {
    pin: string
    gameMode: string
    subject: string
    duration: number
    onEndGame: () => void
    players: PlayerScore[]
}

export default function HostDashboard({
    pin,
    gameMode,
    subject,
    duration,
    onEndGame,
    players = []
}: HostDashboardProps) {
    const [timeLeft, setTimeLeft] = useState(duration * 60)
    const [isPaused, setIsPaused] = useState(false)

    useEffect(() => {
        if (isPaused) return

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(timer)
    }, [isPaused])

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const topPlayer = sortedPlayers[0]

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#0f101a] text-white flex flex-col">
            {/* Top Bar */}
            <div className="h-24 bg-[#141521] border-b border-white/10 px-8 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{subject}</h1>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">{gameMode}</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-center">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Time Left</p>
                        <div className="flex items-center gap-2 text-3xl font-black font-mono">
                            <Timer className="w-6 h-6 text-cyan-400" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Join PIN</p>
                        <div className="text-4xl font-black text-purple-400 tracking-tighter">
                            {pin}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsPaused(!isPaused)}
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl"
                    >
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button
                        onClick={onEndGame}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        End Game
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 flex gap-8 overflow-hidden">
                {/* Left: Live Leaderboard */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black flex items-center gap-2">
                            <Trophy className="w-8 h-8 text-amber-400" />
                            Leaderboard
                        </h2>
                        <Badge variant="outline" className="text-white/40 border-white/10">
                            {players.length} Players
                        </Badge>
                    </div>

                    <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-y-auto space-y-3">
                        {sortedPlayers.length > 0 ? (
                            sortedPlayers.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`
                                        flex items-center justify-between p-4 rounded-2xl transition-all duration-500 animate-in fade-in slide-in-from-left-4
                                        ${index === 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-white/5 border border-white/5"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                                            ${index === 0 ? "bg-amber-500 text-black" :
                                                index === 1 ? "bg-slate-300 text-black" :
                                                    index === 2 ? "bg-orange-400 text-black" : "bg-white/10 text-white/40"}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-xl flex items-center gap-2">
                                                {player.username}
                                                {index === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Rank {index + 1}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">{player.score.toLocaleString()}</p>
                                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Points</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                <Users className="w-16 h-16 opacity-20" />
                                <p className="text-xl font-bold">Waiting for players...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Overview */}
                <div className="w-[350px] space-y-6">
                    <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none rounded-[2rem] p-8 text-white shadow-2xl">
                        <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">In the Lead</p>
                        <h3 className="text-4xl font-black truncate mb-4">{topPlayer?.username || "---"}</h3>
                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase">Current Score</p>
                                <p className="text-2xl font-black">{topPlayer?.score.toLocaleString() || "0"}</p>
                            </div>
                            <Trophy className="w-10 h-10 text-amber-300" />
                        </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase">Game Activity</p>
                                <p className="text-lg font-black text-white">Normal</p>
                            </div>
                        </div>
                        <div className="h-[100px] flex items-end gap-1 px-2">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-cyan-500/30 rounded-t-sm"
                                    style={{ height: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                    </Card>

                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
                        <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Host Controls</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white text-xs h-10 rounded-xl">
                                Hide PIN
                            </Button>
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white text-xs h-10 rounded-xl">
                                Scores Off
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
