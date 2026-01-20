"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Users2Icon,
    TimerIcon,
    PlayIcon,
    XIcon,
    Gamepad2Icon,
    CrownIcon,
    Settings2Icon,
    InfoIcon
} from "lucide-react"

interface GameLobbyProps {
    pin: string
    mode: "host" | "join"
    subject: string
    grade: number
    currentUser: any
    onStart: (duration: number) => void
    onCancel: () => void
}

export default function GameLobby({
    pin,
    mode,
    subject,
    grade,
    currentUser,
    onStart,
    onCancel
}: GameLobbyProps) {
    const [duration, setDuration] = useState(120) // Default 2 mins
    const [players, setPlayers] = useState<any[]>([])
    const [isGameStarted, setIsGameStarted] = useState(false)

    // Sync players and game state via localStorage for local multi-tab demo
    useEffect(() => {
        const syncLobby = () => {
            const sessions = JSON.parse(localStorage.getItem("boomkit_game_sessions") || "{}")
            const session = sessions[pin]
            if (session) {
                setPlayers(session.players || [])
                if (session.status === "started") {
                    setIsGameStarted(true)
                    onStart(session.duration || duration)
                }
            }
        }

        // Register self if joining
        if (mode === "join") {
            const sessions = JSON.parse(localStorage.getItem("boomkit_game_sessions") || "{}")
            if (sessions[pin]) {
                const currentPlayers = sessions[pin].players || []
                if (!currentPlayers.find((p: any) => p.username === currentUser.username)) {
                    sessions[pin].players = [...currentPlayers, {
                        username: currentUser.username,
                        profilePicture: currentUser.profilePicture,
                        id: currentUser.id
                    }]
                    localStorage.setItem("boomkit_game_sessions", JSON.stringify(sessions))
                    // Trigger storage event for other tabs
                    window.dispatchEvent(new Event('storage'))
                }
            }
        }

        syncLobby()

        const interval = setInterval(syncLobby, 1000)
        window.addEventListener('storage', syncLobby)

        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', syncLobby)
        }
    }, [pin, mode, currentUser])

    const handleStartGame = () => {
        const sessions = JSON.parse(localStorage.getItem("boomkit_game_sessions") || "{}")
        if (sessions[pin]) {
            sessions[pin].status = "started"
            sessions[pin].duration = duration
            localStorage.setItem("boomkit_game_sessions", JSON.stringify(sessions))
            window.dispatchEvent(new Event('storage'))
            onStart(duration)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Lobby Header */}
            <div className="text-center space-y-4">
                <Badge className="bg-purple-600 text-white px-4 py-1 rounded-full text-lg font-black tracking-widest animate-pulse">
                    {mode === "host" ? "HOSTING" : "WAITING"}
                </Badge>
                <h1 className="text-6xl font-black text-white tracking-widest flex items-center gap-4 justify-center">
                    <Gamepad2Icon className="w-12 h-12 text-cyan-400" />
                    PIN: <span className="text-yellow-400 bg-black/40 px-6 py-2 rounded-2xl border-2 border-white/20 select-all cursor-copy">{pin}</span>
                </h1>
                <p className="text-white/60 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    {subject} <span className="text-white/20">•</span> Grade {grade}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                {/* Settings Panel (Host Only) */}
                {mode === "host" ? (
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                                <Settings2Icon className="w-6 h-6 text-purple-400" />
                                Game Settings
                            </CardTitle>
                            <CardDescription className="text-white/40 font-medium">Customize your live session</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-white/70 font-bold flex items-center gap-2">
                                        <TimerIcon className="w-4 h-4 text-cyan-400" />
                                        Game Duration
                                    </p>
                                    <Badge variant="outline" className="text-white border-white/20 px-3 py-1">
                                        {Math.floor(duration / 60)}m {duration % 60}s
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    {[60, 120, 300, 600].map((t) => (
                                        <Button
                                            key={t}
                                            variant={duration === t ? "default" : "outline"}
                                            onClick={() => setDuration(t)}
                                            className={`flex-1 rounded-xl font-bold ${duration === t ? "bg-cyan-500 hover:bg-cyan-600 border-none" : "border-white/10 text-white/60 hover:text-white"}`}
                                        >
                                            {t >= 300 ? `${t / 60}m` : `${t}s`}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button
                                    onClick={handleStartGame}
                                    disabled={players.length === 0}
                                    className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-2xl rounded-2xl shadow-xl shadow-green-900/20 group"
                                >
                                    <PlayIcon className="mr-2 w-8 h-8 group-hover:scale-110 transition-transform" />
                                    START GAME
                                </Button>
                                {players.length === 0 && (
                                    <p className="text-yellow-400/60 text-xs font-bold text-center animate-pulse">
                                        WAITING FOR PLAYERS TO JOIN...
                                    </p>
                                )}
                                <Button
                                    onClick={onCancel}
                                    variant="ghost"
                                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold"
                                >
                                    <XIcon className="mr-2 w-4 h-4" /> Cancel Session
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 bg-cyan-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="w-32 h-32 bg-cyan-500/40 rounded-full flex items-center justify-center relative z-10">
                                <Users2Icon className="w-16 h-16 text-cyan-400 animate-bounce" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">You're in!</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest max-w-[200px]">
                            Waiting for the host to start the game
                        </p>
                        <div className="mt-8 flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                            <InfoIcon className="w-4 h-4 text-cyan-400" />
                            <p className="text-xs text-white/60 font-medium">Keep this tab open</p>
                        </div>
                    </Card>
                )}

                {/* Players Panel */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                                <Users2Icon className="w-6 h-6 text-cyan-400" />
                                Players
                            </CardTitle>
                            <CardDescription className="text-white/40 font-medium tracking-tight">Everyone ready to play</CardDescription>
                        </div>
                        <Badge className="bg-white/10 text-white font-black text-lg h-10 w-10 flex items-center justify-center rounded-xl border border-white/10">
                            {players.length}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {players.map((player, i) => (
                                <div
                                    key={player.id || i}
                                    className="bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 hover:bg-white/20 animate-in slide-in-from-bottom-2 duration-300"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-xl shadow-lg border-2 border-white/20">
                                        {player.profilePicture || "👤"}
                                    </div>
                                    <p className="text-white font-black text-sm truncate w-full text-center">{player.username}</p>
                                    {player.username === currentUser.username && (
                                        <Badge variant="outline" className="text-[8px] bg-green-500/20 text-green-400 border-green-500/20 uppercase font-black px-1 py-0">You</Badge>
                                    )}
                                </div>
                            ))}
                            {players.length === 0 && (
                                <div className="col-span-2 py-12 flex flex-col items-center text-white/20">
                                    <Users2Icon className="w-12 h-12 mb-2" />
                                    <p className="font-bold uppercase text-xs tracking-widest">No players yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Info */}
            <div className="flex items-center gap-6 text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">
                <div className="flex items-center gap-2">
                    <CrownIcon className="w-3 h-3 text-yellow-500/40" />
                    Host: {mode === "host" ? "You" : (players[0]?.username || "...")}
                </div>
                <div>•</div>
                <div>Boomkit LIVE</div>
            </div>
        </div>
    )
}
