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
    const [timeLeft, setTimeLeft] = useState(duration || 120)
    const [isPaused, setIsPaused] = useState(false)
    const [recentActivity, setRecentActivity] = useState<{ id: string, message: string, time: string }[]>([
        { id: "1", message: "Game started!", time: "just now" },
        { id: "2", message: "Waiting for first answers...", time: "just now" }
    ])

    // Simulate some activity for now, in a real game this would come from Supabase
    useEffect(() => {
        if (isPaused || players.length === 0) return
        const interval = setInterval(() => {
            const validPlayers = players.filter(Boolean)
            if (validPlayers.length === 0) return
            const player = validPlayers[Math.floor(Math.random() * validPlayers.length)]
            const events = [
                `just got a Correct Answer!`,
                `is on a 5-streak!`,
                `just moved up a rank!`,
                `is playing fast!`,
            ]
            const event = events[Math.floor(Math.random() * events.length)]
            setRecentActivity(prev => [
                { id: Math.random().toString(), message: `${player.username} ${event}`, time: "now" },
                ...prev.slice(0, 4)
            ])
        }, 5000)
        return () => clearInterval(interval)
    }, [players, isPaused])

    useEffect(() => {
        if (isPaused) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onEndGame()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isPaused, onEndGame])

    const sortedPlayers = [...players].filter(Boolean).sort((a, b) => (b.score || 0) - (a.score || 0))
    const topPlayer = sortedPlayers[0]

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="fixed inset-0 z-50 club-surface club-ink flex flex-col">
            {/* Top Bar */}
            <div className="h-24 club-surface border-b club-border px-8 flex items-center justify-between ">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-xl club-purple flex items-center justify-center ">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl font-black tracking-tight">{subject}</h1>
                        <p className="font-heading club-muted text-sm font-bold uppercase tracking-wide">{gameMode}</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="font-heading text-center">
                        <p className="font-heading club-muted text-xs font-black uppercase tracking-wide mb-1">Time Left</p>
                        <div className="flex items-center gap-2 text-3xl font-black font-mono">
                            <Timer className="w-6 h-6 club-accent" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    <div className="font-heading text-center">
                        <p className="font-heading club-muted text-xs font-black uppercase tracking-wide mb-1">Join PIN</p>
                        <div className="font-heading text-4xl font-black club-accent tracking-tighter">
                            {pin}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsPaused(!isPaused)}
                        className="club-action club-well club-border club-well club-ink rounded-xl"
                    >
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button
                        onClick={onEndGame}
                        className="club-action club-red club-red club-ink font-bold rounded-xl "
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
                        <h2 className="font-heading text-3xl font-black flex items-center gap-2">
                            <Trophy className="w-8 h-8 club-accent" />
                            Leaderboard
                        </h2>
                        <Badge variant="outline" className="font-heading club-muted club-border">
                            {players.length} Players
                        </Badge>
                    </div>

                    <div className="flex-1 club-well rounded-xl border club-border p-6 overflow-y-auto space-y-3">
                        {sortedPlayers.length > 0 ? (
                            sortedPlayers.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`
                                        flex items-center justify-between p-4 rounded-2xl transition-all duration-500 animate-in fade-in slide-in-from-left-4
                                        ${index === 0 ? "club-yellow border club-border" : "club-well border club-border"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                                            ${index === 0 ? "club-yellow club-ink" :
                                                index === 1 ? "club-well club-ink" :
                                                    index === 2 ? "club-yellow club-ink" : "club-well club-muted"}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-xl flex items-center gap-2">
                                                {player.username}
                                                {index === 0 && <Crown className="w-4 h-4 club-accent" />}
                                            </p>
                                            <p className="font-heading text-xs club-muted uppercase font-bold tracking-wide">Rank {index + 1}</p>
                                        </div>
                                    </div>
                                    <div className="font-heading text-right">
                                        <p className="font-heading text-2xl font-black club-ink">{(player.score || 0).toLocaleString()}</p>
                                        <p className="font-heading text-xs club-accent font-bold uppercase tracking-wide">
                                            {gameMode === "fishing-frenzy" ? "LBS" : "Points"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center club-muted gap-4">
                                <Users className="w-16 h-16 opacity-20" />
                                <p className="font-heading text-xl font-bold">Waiting for players...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Overview */}
                <div className="w-[350px] space-y-6">
                    <Card className="club-surface border-none rounded-xl p-8 club-ink ">
                        <p className="font-heading club-muted text-sm font-bold uppercase tracking-wide mb-1">In the Lead</p>
                        <h3 className="font-heading text-4xl font-black truncate mb-4">{topPlayer?.username || "---"}</h3>
                        <div className="flex items-center justify-between club-well rounded-xl p-4">
                            <div>
                                <p className="font-heading text-xs club-muted font-bold uppercase">
                                    {gameMode === "fishing-frenzy" ? "Current Weight" : "Current Score"}
                                </p>
                                <p className="font-heading text-2xl font-black">
                                    {(topPlayer?.score || 0).toLocaleString()}
                                    {gameMode === "fishing-frenzy" && <span className="font-heading text-sm ml-1 opacity-60">lbs</span>}
                                </p>
                            </div>
                            <Trophy className="w-10 h-10 club-accent" />
                        </div>
                    </Card>

                    <Card className="club-well club-border rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl club-blue flex items-center justify-center club-accent">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-heading club-muted text-xs font-bold uppercase">Game Activity</p>
                                <p className="font-heading text-lg font-black club-ink">Normal</p>
                            </div>
                        </div>
                        <div className="h-[100px] flex items-end gap-1 px-2">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 club-blue rounded-t-sm"
                                    style={{ height: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                    </Card>

                    <div className="club-well border club-border rounded-xl p-6 flex-1 flex flex-col min-h-0">
                        <h4 className="font-heading club-muted text-xs font-black uppercase tracking-wide mb-4">Recent Activity</h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-2 text-xs animate-in slide-in-from-right-2 duration-300">
                                    <div className="w-1.5 h-1.5 rounded-full club-purple mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-heading club-ink font-medium">{activity.message}</p>
                                        <p className="font-heading club-muted text-xs uppercase font-bold">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="club-well border club-border rounded-xl p-6">
                        <h4 className="font-heading club-muted text-xs font-black uppercase tracking-wide mb-4">Host Controls</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="club-action w-full club-well club-border club-ink text-xs h-10 rounded-xl">
                                Hide PIN
                            </Button>
                            <Button variant="outline" className="club-action w-full club-well club-border club-ink text-xs h-10 rounded-xl">
                                Scores Off
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
