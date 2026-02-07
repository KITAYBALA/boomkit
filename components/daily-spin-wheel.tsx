'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CoinsIcon } from 'lucide-react'

interface DailySpinWheelProps {
    onWin: (amount: number) => void
    isSpinning: boolean
    setIsSpinning: (val: boolean) => void
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

export default function DailySpinWheel({ onWin, isSpinning, setIsSpinning }: DailySpinWheelProps) {
    const [rotation, setRotation] = useState(0)
    const [result, setResult] = useState<number | null>(null)

    const handleSpin = () => {
        if (isSpinning) return

        setIsSpinning(true)
        setResult(null)

        // Random spin: multiple full rotations + random offset
        const extraDegrees = Math.floor(Math.random() * 360)
        const totalRotation = 3600 + extraDegrees // 10 full spins + extra

        setRotation(prev => prev + totalRotation)

        // Calculate result based on degrees
        // Each sector is 360 / 8 = 45 degrees
        // (TotalRotation % 360) is where it lands. 
        // We need to invert it because the wheel rotates clockwise but index 0 is at top
        setTimeout(() => {
            const actualDegrees = (rotation + totalRotation) % 360
            // Find the index. We subtract from 360 because rotation is clockwise
            // but the array is indexed clockwise too. 
            // Pointer is at the top (270deg in SVG space usually, but easier to rotate wheel)
            const sectorSize = 360 / SECTORS.length
            const index = Math.floor(((360 - (actualDegrees % 360)) + sectorSize / 2) % 360 / sectorSize)
            const winAmount = SECTORS[index % SECTORS.length].amount

            setResult(winAmount)
            setIsSpinning(false)
            onWin(winAmount)
        }, 4000)
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
                    className="w-full h-full rounded-full border-8 border-slate-800 shadow-2xl relative transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
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
                disabled={isSpinning}
                className="h-16 px-12 text-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
                {isSpinning ? 'SPINNING...' : 'SPIN NOW!'}
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
