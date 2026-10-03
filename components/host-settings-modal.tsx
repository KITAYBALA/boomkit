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
        <div className="fixed inset-0 z-[70] club-overlay flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="absolute inset-0 club-surface pointer-events-none" />

            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto club-surface club-border relative animate-in zoom-in-95 duration-500">
                {/* Accent Glow */}
                <div className={`absolute -top-24 -left-24 w-48 h-48 club-surface ${modeColor} blur-[100px] opacity-20`} />
                <div className={`absolute -bottom-24 -right-24 w-48 h-48 club-surface ${modeColor} blur-[100px] opacity-10`} />

                <div className={`h-1.5 club-surface ${modeColor} relative z-10 `} />

                <CardHeader className="p-8 pb-2 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="club-action font-heading club-muted club-ink club-well transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Modes
                        </Button>
                        <div className="px-4 py-1.5 rounded-full border club-border club-accent club-purple text-xs font-black uppercase tracking-wide ">
                            Hosting: {subject}
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className={`absolute -inset-4 club-surface ${modeColor} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                            <div className={`relative w-24 h-24 rounded-xl club-surface ${modeColor} flex items-center justify-center club-ink transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500`}>
                                <div className="[&_svg]:w-12 [&_svg]:h-12 drop-shadow-lg">
                                    {modeIcon}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="font-heading text-4xl font-black club-ink tracking-tighter leading-tight ">
                                {modeName}
                            </h1>
                            <p className="font-heading club-muted text-lg font-medium tracking-tight">Configure the ultimate arena</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 relative z-10">
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="p-4 rounded-full club-well border club-border ">
                            <div className="w-16 h-16 rounded-full club-surface absolute opacity-50" />
                            <Zap className="w-8 h-8 club-ink relative z-10" />
                        </div>
                        <div className="font-heading text-center space-y-2">
                            <h3 className="font-heading text-2xl font-black club-ink">Ready to Host?</h3>
                            <p className="font-heading club-muted font-medium max-w-[300px] mx-auto">
                                Create a lobby for <strong>{modeName}</strong> in <strong>{subject}</strong>. Players can join using the Game PIN.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => onHost(settings)}
                        className={`club-action w-full h-20 club-surface ${modeColor} hover:brightness-110 club-ink font-black text-2xl rounded-xl group relative overflow-hidden transition-all active:scale-[0.98]`}
                    >
                        <div className="absolute inset-0 club-well translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center gap-4 justify-center">
                            <Play className="w-8 h-8 fill-current" />
                            CREATE LOBBY
                        </span>
                    </Button>
                </CardContent>

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
