"use client"

import React, { useState, useEffect, useRef } from "react"
import { sessionAction } from '@/lib/secure-rpc'
import { pollRoom } from '@/lib/room-polling'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BoomAvatar } from "./boom-avatar"
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
    supabase: any
    pin: string
    mode: "host" | "join"
    subject: string
    grade: number
    currentUser: any
    onStart: (duration: number, questions: any[] | null) => void // Updated signature
    onCancel: () => void
}

export default function GameLobby({
    supabase,
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
    const [hostUsername, setHostUsername] = useState<string>("")
    const startedRef=useRef(false)
    const startRef=useRef(onStart)
    startRef.current=onStart

    // Sync players and game state via Supabase
    useEffect(() => pollRoom(pin, room => {
      setPlayers(room.players || [])
      setHostUsername(room.host_username || '')
      if (room.status?.startsWith('started') && !startedRef.current) {
        startedRef.current=true
        setIsGameStarted(true)
        startRef.current(room.duration,room.questions)
      }
    }), [pin])

    const handleStartGame = async () => {
      if (startedRef.current) return
      const {data,error}=await sessionAction('start',{pin,duration})
      if (error) { alert(error.message); return }
      if (!startedRef.current) {
        startedRef.current=true
        setIsGameStarted(true)
        startRef.current(data.duration,data.questions)
      }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Lobby Header */}
            <div className="font-heading text-center space-y-4">
                <Badge className="club-purple club-ink px-4 py-1 rounded-full text-lg font-black tracking-wide ">
                    {mode === "host" ? "HOSTING" : "WAITING"}
                </Badge>
                <h1 className="font-heading text-4xl font-black club-ink tracking-wide flex items-center gap-4 justify-center">
                    <Gamepad2Icon className="w-12 h-12 club-accent" />
                    PIN: <span className="font-heading club-accent club-well px-6 py-2 rounded-xl border-2 club-border select-all cursor-copy">{pin}</span>
                </h1>
                <p className="font-heading club-muted font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                    {subject} <span className="font-heading club-muted">•</span> Grade {grade}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                {/* Settings Panel (Host Only) */}
                {mode === "host" ? (
                    <Card className="club-well club-border ">
                        <CardHeader>
                            <CardTitle className="font-heading text-2xl font-black club-ink flex items-center gap-2">
                                <Settings2Icon className="w-6 h-6 club-accent" />
                                Game Settings
                            </CardTitle>
                            <CardDescription className="font-heading club-muted font-medium">Customize your live session</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="font-heading club-ink font-bold flex items-center gap-2">
                                        <TimerIcon className="w-4 h-4 club-accent" />
                                        Game Duration
                                    </p>
                                    <Badge variant="outline" className="font-heading club-ink club-border px-3 py-1">
                                        {Math.floor(duration / 60)}m {duration % 60}s
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    {[60, 120, 300, 600].map((t) => (
                                        <Button
                                            key={t}
                                            variant={duration === t ? "default" : "outline"}
                                            onClick={() => setDuration(t)}
                                            className={`club-action flex-1 rounded-xl font-bold ${duration === t ? "club-blue club-blue border-none" : "club-border club-muted club-ink"}`}
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
                                    className="club-action w-full h-16 club-surface club-ink font-black text-2xl rounded-xl group"
                                >
                                    <PlayIcon className="mr-2 w-8 h-8 group-hover:scale-110 transition-transform" />
                                    START GAME
                                </Button>
                                {players.length === 0 && (
                                    <p className="font-heading club-accent text-xs font-bold text-center animate-pulse">
                                        WAITING FOR PLAYERS TO JOIN...
                                    </p>
                                )}
                                <Button
                                    onClick={onCancel}
                                    variant="ghost"
                                    className="club-action w-full club-danger club-danger hover:bg-red-500/10 font-bold"
                                >
                                    <XIcon className="mr-2 w-4 h-4" /> Cancel Session
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="club-well club-border flex flex-col items-center justify-center p-8 text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 club-blue rounded-full absolute inset-0" />
                            <div className="w-32 h-32 club-blue rounded-full flex items-center justify-center relative z-10">
                                <Users2Icon className="w-16 h-16 club-accent animate-bounce" />
                            </div>
                        </div>
                        <h2 className="font-heading text-3xl font-black club-ink mb-2">You're in!</h2>
                        <p className="font-heading club-muted font-bold uppercase tracking-wide max-w-[200px]">
                            Waiting for the host to start the game
                        </p>
                        <div className="mt-8 flex items-center gap-2 club-well px-4 py-2 rounded-full border club-border">
                            <InfoIcon className="w-4 h-4 club-accent" />
                            <p className="font-heading text-xs club-muted font-medium">Keep this tab open</p>
                        </div>
                    </Card>
                )}

                {/* Players Panel */}
                <Card className="club-well club-border ">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-heading text-2xl font-black club-ink flex items-center gap-2">
                                <Users2Icon className="w-6 h-6 club-accent" />
                                Players
                            </CardTitle>
                            <CardDescription className="font-heading club-muted font-medium tracking-tight">Everyone ready to play</CardDescription>
                        </div>
                        <Badge className="club-well club-ink font-black text-lg h-10 w-10 flex items-center justify-center rounded-xl border club-border">
                            {players.length}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {players.filter(Boolean).map((player, i) => (
                                <div
                                    key={player.id || i}
                                    className="club-well border club-border rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 club-well animate-in slide-in-from-bottom-2 duration-300"
                                >
                                    <div className="w-12 h-12 club-well rounded-xl flex items-center justify-center text-xl border club-border p-1 relative overflow-hidden">
                                        <BoomAvatar name={player.profilePicture || "👤"} className="w-full h-full object-contain" />
                                    </div>
                                    <p className="font-heading club-ink font-black text-sm truncate w-full text-center">{player.username}</p>
                                    {player.username === currentUser.username && (
                                        <Badge variant="outline" className="font-heading text-xs club-green club-success club-border uppercase font-black px-1 py-0">You</Badge>
                                    )}
                                </div>
                            ))}
                            {players.length === 0 && (
                                <div className="col-span-2 py-12 flex flex-col items-center club-muted">
                                    <Users2Icon className="w-12 h-12 mb-2" />
                                    <p className="font-bold uppercase text-xs tracking-widest">No players yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Info */}
            <div className="flex items-center gap-6 club-muted font-black uppercase tracking-wide text-xs">
                <div className="flex items-center gap-2">
                    <CrownIcon className="w-3 h-3 club-accent" />
                    Host: {mode === "host" ? "You" : (hostUsername || players[0]?.username || "...")}
                </div>
                <div>•</div>
                <div>Boomkit LIVE</div>
            </div>
        </div>
    )
}
