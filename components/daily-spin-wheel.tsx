'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CoinsIcon } from 'lucide-react'

interface DailySpinWheelProps {
    onWin: (amount: number) => void
    isSpinning: boolean
    setIsSpinning: (val: boolean) => void
    canSpin: boolean
}

const SECTORS = [
    { amount: 100, color: '#4F46E5' }, // Indigo
    { amount: 150, color: '#7C3AED' }, // Violet
    { amount: 200, color: '#2563EB' }, // Blue
    { amount: 250, color: '#DB2777' }, // Pink
    { amount: 300, color: '#9333EA' }, // Purple
    { amount: 350, color: '#059669' }, // Emerald
    { amount: 400, color: '#D97706' }, // Amber
    { amount: 500, color: '#DC2626' }, // Red (Jackpot)
]

export default function DailySpinWheel({ onWin, isSpinning, setIsSpinning, canSpin }: DailySpinWheelProps) {
    const [rotation, setRotation] = useState(0)
    const [result, setResult] = useState<number | null>(null)

    const handleSpin = () => {
        if (isSpinning || !canSpin) return

        setIsSpinning(true)
        setResult(null)

        // 1. Pick result FIRST to ensure consistency
        const winIndex = Math.floor(Math.random() * SECTORS.length)
        const winAmount = SECTORS[winIndex].amount

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
        const targetSectorAngle = 360 - (winIndex * sectorSize)
        const totalRotation = currentRotationBase + (extraSpins * 360) + targetSectorAngle

        setRotation(totalRotation)

        // 3. Set timer for the UI to catch up (8 seconds for slower feel)
        setTimeout(() => {
            setResult(winAmount)
            setIsSpinning(false)
            onWin(winAmount)
        }, 8000)
    }

    return (
        <div className="flex flex-col items-center gap-8 py-10">
            <div className="relative w-80 h-80">
                {/* Pointer */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 w-8 h-8 bg-white shadow-xl flex items-center justify-center rounded-b-full">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-slate-900 mb-1" />
                </div>

                {/* The Wheel */}
                <div
                    className="w-full h-full rounded-full border-8 border-slate-800 shadow-2xl relative transition-transform duration-[8000ms] cubic-bezier(0.15, 0, 0.15, 1)"
                    style={{ transform: `rotate(${rotation}deg)` }}
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
                className="h-16 px-12 text-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
                {isSpinning ? 'SPINNING...' : !canSpin ? 'SPUN TODAY' : 'SPIN NOW!'}
            </Button>

            {result && (
                <div className="animate-bounce flex flex-col items-center gap-2">
                    <p className="text-white/60 font-bold uppercase tracking-widest text-sm">You won</p>
                    <div className="flex items-center gap-3">
                        <CoinsIcon className="w-8 h-8 text-yellow-500" />
                        <span className="text-5xl font-black text-white">{result}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
