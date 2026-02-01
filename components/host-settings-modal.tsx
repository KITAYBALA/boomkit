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
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />

            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0b14]/80 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl relative animate-in zoom-in-95 duration-500">
                {/* Accent Glow */}
                <div className={`absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br ${modeColor} blur-[100px] opacity-20`} />
                <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${modeColor} blur-[100px] opacity-10`} />

                <div className={`h-1.5 bg-gradient-to-r ${modeColor} relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />

                <CardHeader className="p-8 pb-2 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="text-white/40 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Modes
                        </Button>
                        <div className="px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            Hosting: {subject}
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className={`absolute -inset-4 bg-gradient-to-br ${modeColor} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                            <div className={`relative w-24 h-24 rounded-[2rem] bg-gradient-to-br ${modeColor} flex items-center justify-center text-white shadow-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500`}>
                                <div className="[&_svg]:w-12 [&_svg]:h-12 drop-shadow-lg">
                                    {modeIcon}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-md">
                                {modeName}
                            </h1>
                            <p className="text-white/40 text-lg font-medium tracking-tight">Configure the ultimate arena</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-10 relative z-10">
                    {/* Goal Selection Card */}
                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={() => setSettings(s => ({ ...s, goalType: "time" }))}
                            className={`
                                group relative p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden
                                ${settings.goalType === "time"
                                    ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    : "bg-white/5 border-white/5 hover:border-white/20"}
                            `}
                        >
                            {settings.goalType === "time" && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />
                                </div>
                            )}
                            <div className={`p-4 rounded-2xl transition-all duration-500 ${settings.goalType === "time" ? "bg-cyan-500 text-white shadow-lg" : "bg-white/5 text-white/20 group-hover:text-white/40"}`}>
                                <Clock className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className={`font-black text-2xl tracking-tighter transition-colors ${settings.goalType === "time" ? "text-cyan-400" : "text-white/40"}`}>Timed Match</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Race against the clock</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setSettings(s => ({ ...s, goalType: "crypto" }))}
                            className={`
                                group relative p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden
                                ${settings.goalType === "crypto"
                                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                    : "bg-white/5 border-white/5 hover:border-white/20"}
                            `}
                        >
                            {settings.goalType === "crypto" && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />
                                </div>
                            )}
                            <div className={`p-4 rounded-2xl transition-all duration-500 ${settings.goalType === "crypto" ? "bg-amber-500 text-black shadow-lg" : "bg-white/5 text-white/20 group-hover:text-white/40"}`}>
                                <Zap className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className={`font-black text-2xl tracking-tighter transition-colors ${settings.goalType === "crypto" ? "text-amber-400" : "text-white/40"}`}>Goal Target</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">First to reach the cap</p>
                            </div>
                        </button>
                    </div>

                    {/* Controls Section */}
                    <div className="space-y-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                        {settings.goalType === "time" ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <Label className="text-white text-2xl font-black tracking-tighter flex items-center gap-3">
                                            <Timer className="w-6 h-6 text-cyan-400" />
                                            MATCH DURATION
                                        </Label>
                                        <p className="text-white/40 text-xs font-medium">How many minutes of pure intensity?</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-cyan-400 font-black text-5xl tracking-tighter leading-none animate-in slide-in-from-bottom-2">
                                            {settings.duration}
                                        </span>
                                        <span className="text-[10px] text-cyan-400/40 font-black uppercase tracking-widest mt-1">minutes</span>
                                    </div>
                                </div>
                                <div className="relative group pt-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={settings.duration}
                                        onChange={(e) => setSettings(s => ({ ...s, duration: parseInt(e.target.value) }))}
                                        className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 transition-all hover:h-4"
                                    />
                                    <div className="flex justify-between mt-4">
                                        {[1, 15, 30, 45, 60].map(val => (
                                            <span key={val} className="text-[10px] font-black text-white/20">{val}m</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <Label className="text-white text-2xl font-black tracking-tighter flex items-center gap-3">
                                            <Zap className="w-6 h-6 text-amber-400" />
                                            CRYPTO GOAL
                                        </Label>
                                        <p className="text-white/40 text-xs font-medium">Point threshold for victory</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-amber-400 font-black text-5xl tracking-tighter leading-none animate-in slide-in-from-bottom-2">
                                            {settings.cryptoGoal.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-amber-400/40 font-black uppercase tracking-widest mt-1">points</span>
                                    </div>
                                </div>
                                <div className="relative group pt-4">
                                    <input
                                        type="range"
                                        min="100"
                                        max="100000"
                                        step="100"
                                        value={settings.cryptoGoal}
                                        onChange={(e) => setSettings(s => ({ ...s, cryptoGoal: parseInt(e.target.value) }))}
                                        className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-400 transition-all hover:h-4"
                                    />
                                    <div className="flex justify-between mt-4">
                                        {["100", "25k", "50k", "75k", "100k"].map(val => (
                                            <span key={val} className="text-[10px] font-black text-white/20">{val}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toggles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'instructions', label: 'Show Instructions', sub: 'The tutorial screen', icon: Info, key: 'showInstructions' },
                            { id: 'late', label: 'Allow Late Joining', sub: 'Jump in mid-game', icon: UserPlus, key: 'allowLateJoining' },
                            { id: 'random', label: 'Randomized Names', sub: 'Privacy mode active', icon: Users, key: 'useRandomNames' },
                        ].map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 hover:bg-white/[0.08] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-white font-bold tracking-tight leading-none">{item.label}</Label>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide leading-none">{item.sub}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={(settings as any)[item.key]}
                                    onCheckedChange={(v: boolean) => setSettings(s => ({ ...s, [item.key]: v }))}
                                    className="data-[state=checked]:bg-purple-500"
                                />
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={() => onHost(settings)}
                        className="w-full h-20 bg-white hover:bg-white/90 text-black text-3xl font-black rounded-[2rem] shadow-[0_20px_40px_rgba(255,255,255,0.1)] group transition-all active:scale-[0.98]"
                    >
                        <Play className="w-8 h-8 mr-3 fill-black group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                        LAUNCH ARENA
                    </Button>
                </CardContent>
            </Card>

            <style jsx global>{`
                input[type='range']::-webkit-slider-thumb {
                    width: 24px;
                    height: 24px;
                    background: white;
                    border: 4px solid currentColor;
                    border-radius: 50%;
                    box-shadow: 0 0 15px rgba(0,0,0,0.5);
                    cursor: pointer;
                    -webkit-appearance: none;
                    transition: transform 0.2s;
                }
                input[type='range']::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
            `}</style>
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
