'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CoinsIcon } from 'lucide-react'

interface DailySpinWheelProps {
    onSpin: () => Promise<number>
    onWin: (amount: number) => void
    isSpinning: boolean
    setIsSpinning: (val: boolean) => void
    canSpin: boolean
}

const SECTORS = [
    { amount: 100, color: '#226653' }, // Indigo
    { amount: 150, color: '#4d7180' }, // Violet
    { amount: 200, color: '#a65b37' }, // Blue
    { amount: 250, color: '#74634b' }, // Pink
    { amount: 300, color: '#785c80' }, // Purple
    { amount: 350, color: '#427350' }, // Emerald
    { amount: 400, color: '#946522' }, // Amber
    { amount: 500, color: '#8c4240' }, // Red (Jackpot)
]

export default function DailySpinWheel({ onSpin, onWin, isSpinning, setIsSpinning, canSpin }: DailySpinWheelProps) {
    const [rotation, setRotation] = useState(0)
    const [result, setResult] = useState<number | null>(null)
    const busy = useRef(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); setIsSpinning(false) }
    }, [setIsSpinning])

    const handleSpin = async () => {
        if (busy.current || isSpinning || !canSpin) return
        busy.current = true

        setIsSpinning(true)
        setResult(null)

        // 1. Pick result FIRST to ensure consistency
        let winAmount: number
        try { winAmount = await onSpin() }
        catch (error) {
            busy.current = false
            if (mounted.current) { setIsSpinning(false); alert(error instanceof Error ? error.message : 'Spin failed') }
            return
        }
        if (!mounted.current) return
        const winIndex = SECTORS.findIndex(s => s.amount === winAmount)

        // 2. Calculate rotation
        // Each sector is 45 degrees. Sector 0 is at -90deg (top)
        // We want to land at the top pointer.
        // The rotation needed is: (full rotations) + (offset to bring the sector to top)
        // Since the wheel starts at 0 and sector 0 is at top (if we account for -90 rotation in SVG),
        // to bring sector i to top, we need to rotate by - (i * 45) degrees?
        // Let's make it simpler: current rotation + 10 spins + angle to winIndex

        const sectorSize = 360 / SECTORS.length
        const extraSpins = 5 // Slower, so fewer spins feels better
        const currentRotationBase = Math.ceil(rotation / 360) * 360

        // Target angle: To bring sector 'winIndex' to the top (pointer at 0 degrees relative to wheel center)
        // Because index 0 is at top-right (0 in math, but SVG -rotate-90 makes it top),
        // we need to rotate wheel so that sector 'winIndex' is at the top.
        // Sector i starts at i*45 degrees.
        // To put sector i at the top (which is 0 degrees in SVG -rotate-90 space),
        // we need to rotate the wheel by -(i * 45) degrees, or 360 - (i * 45).
        const targetSectorAngle = 360 - ((winIndex + 0.5) * sectorSize)
        const totalRotation = currentRotationBase + (extraSpins * 360) + targetSectorAngle

        setRotation(totalRotation)

        // 3. Set timer for the UI to catch up (8 seconds for slower feel)
        timer.current = setTimeout(() => {
            busy.current = false
            setResult(winAmount)
            setIsSpinning(false)
            onWin(winAmount)
        }, 8000)
    }

    return (
        <div className="club-wheel">
            <div className="club-wheel-disc">
                {/* Pointer */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 w-8 h-8 club-surface flex items-center justify-center rounded-b-full">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-slate-900 mb-1" />
                </div>

                {/* The Wheel */}
                <div
                    className="w-full h-full rounded-full border-8 club-border relative transition-transform"
                    style={{ transform: `rotate(${rotation}deg)`, transitionDuration: "8000ms", transitionTimingFunction: "cubic-bezier(0.15, 0, 0.15, 1)" }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {SECTORS.map((sector, i) => {
                            const startAngle = (i * 360) / SECTORS.length
                            const endAngle = ((i + 1) * 360) / SECTORS.length

                            // SVG arc calculation
                            const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180)
                            const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180)
                            const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180)
                            const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180)

                            return (
                                <g key={i}>
                                    <path
                                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                                        fill={sector.color}
                                        className="stroke-slate-900/20 stroke-1"
                                    />
                                    {/* Text labels */}
                                    <text
                                        x="75"
                                        y="50"
                                        fill="white"
                                        fontSize="5"
                                        fontWeight="900"
                                        textAnchor="middle"
                                        transform={`rotate(${startAngle + 22.5}, 50, 50)`}
                                        className="select-none"
                                    >
                                        {sector.amount}
                                    </text>
                                </g>
                            )
                        })}
                        <circle cx="50" cy="50" r="5" fill="#1e293b" />
                    </svg>
                </div>
            </div>

            <Button
                onClick={handleSpin}
                disabled={isSpinning || !canSpin}
                className="club-action h-11 px-6 text-sm club-surface club-ink font-black rounded-xl active:scale-95 transition-all"
            >
                {isSpinning ? 'SPINNING...' : !canSpin ? 'SPUN TODAY' : 'SPIN NOW!'}
            </Button>

            {result && (
                <div className="animate-bounce flex flex-col items-center gap-2">
                    <p className="font-heading club-muted font-bold uppercase tracking-wide text-sm">You won</p>
                    <div className="flex items-center gap-3">
                        <CoinsIcon className="w-8 h-8 club-accent" />
                        <span className="font-heading text-4xl font-black club-ink">{result}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
