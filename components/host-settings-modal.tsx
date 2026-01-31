"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "./ui/switch"
import { Label } from "@/components/ui/label"
import {
    Clock,
    Zap,
    Settings2,
    ArrowLeft,
    Play,
    Eye,
    UserPlus,
    Users,
    Info,
    Timer
} from "lucide-react"

interface HostSettingsModalProps {
    modeName: string
    modeIcon: React.ReactNode
    modeColor: string
    subject: string
    onBack: () => void
    onHost: (settings: GameSettings) => void
}

export interface GameSettings {
    goalType: "time" | "crypto" | "score"
    duration: number // in minutes
    cryptoGoal: number
    allowLateJoining: boolean
    showInstructions: boolean
    useRandomNames: boolean
    allowStudentAccounts: boolean
}

export default function HostSettingsModal({
    modeName,
    modeIcon,
    modeColor,
    subject,
    onBack,
    onHost
}: HostSettingsModalProps) {
    const [settings, setSettings] = useState<GameSettings>({
        goalType: "time",
        duration: 7,
        cryptoGoal: 1000,
        allowLateJoining: true,
        showInstructions: true,
        useRandomNames: false,
        allowStudentAccounts: true
    })

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-[#141521] border-white/10 overflow-hidden shadow-2xl">
                <div className={`h-2 bg-gradient-to-r ${modeColor}`} />

                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <Button variant="ghost" onClick={onBack} className="text-white/40 hover:text-white -ml-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Modes
                        </Button>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">
                            Hosting: {subject}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modeColor} flex items-center justify-center text-white shadow-lg`}>
                            <div className="[&_svg]:w-10 [&_svg]:h-10">
                                {modeIcon}
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-4xl font-black text-white">{modeName}</CardTitle>
                            <CardDescription className="text-white/40 text-lg">Configure your game settings</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-8">
                    {/* Goal Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSettings(s => ({ ...s, goalType: "time" }))}
                            className={`
                                p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                                ${settings.goalType === "time" ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"}
                            `}
                        >
                            <Clock className="w-8 h-8" />
                            <div className="text-center">
                                <p className="font-black text-xl">Time</p>
                                <p className="text-xs opacity-60">Game ends when time is up</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setSettings(s => ({ ...s, goalType: "crypto" }))}
                            className={`
                                p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                                ${settings.goalType === "crypto" ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"}
                            `}
                        >
                            <Zap className="w-8 h-8" />
                            <div className="text-center">
                                <p className="font-black text-xl">Goal</p>
                                <p className="text-xs opacity-60">First to reach the target</p>
                            </div>
                        </button>
                    </div>

                    {/* Numeric Inputs */}
                    <div className="bg-white/5 rounded-2xl p-6 space-y-6 border border-white/5">
                        {settings.goalType === "time" ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-white text-lg font-bold flex items-center gap-2">
                                        <Timer className="w-5 h-5 text-cyan-400" />
                                        Time Limit (minutes)
                                    </Label>
                                    <span className="text-cyan-400 font-black text-2xl">{settings.duration}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={settings.duration}
                                    onChange={(e) => setSettings(s => ({ ...s, duration: parseInt(e.target.value) }))}
                                    className="w-full accent-cyan-500"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-white text-lg font-bold flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        Crypto Amount
                                    </Label>
                                    <span className="text-amber-400 font-black text-2xl">{settings.cryptoGoal.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="100000"
                                    step="100"
                                    value={settings.cryptoGoal}
                                    onChange={(e) => setSettings(s => ({ ...s, cryptoGoal: parseInt(e.target.value) }))}
                                    className="w-full accent-amber-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Toggle Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">Show Instructions</Label>
                                <p className="text-xs text-white/30">Display game tutorial</p>
                            </div>
                            <Switch
                                checked={settings.showInstructions}
                                onCheckedChange={(v: boolean) => setSettings(s => ({ ...s, showInstructions: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">Allow Late Joining</Label>
                                <p className="text-xs text-white/30">Players can join mid-game</p>
                            </div>
                            <Switch
                                checked={settings.allowLateJoining}
                                onCheckedChange={(v: boolean) => setSettings(s => ({ ...s, allowLateJoining: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-white font-bold">Use Random Names</Label>
                                <p className="text-xs text-white/30">Hide real usernames</p>
                            </div>
                            <Switch
                                checked={settings.useRandomNames}
                                onCheckedChange={(v: boolean) => setSettings(s => ({ ...s, useRandomNames: v }))}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={() => onHost(settings)}
                        className="w-full h-16 bg-white hover:bg-white/90 text-black text-2xl font-black rounded-2xl shadow-xl shadow-white/5 group"
                    >
                        <Play className="w-6 h-6 mr-2 fill-black group-hover:scale-110 transition-transform" />
                        Host Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${className}`}>
            {children}
        </div>
    )
}
