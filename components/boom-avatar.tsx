"use client"

import React from "react"

// Types of eyes and mouths we can reuse
type EyeType = "default" | "cute" | "spider" | "alien" | "cyborg" | "wizard" | "cat" | "none"
type MouthType = "smile" | "grin" | "beak" | "none"

interface BlookDesign {
  bg: string // CSS gradient class
  border: string // border color
  eyes?: EyeType
  mouth?: MouthType
  customEyes?: React.ReactNode
  customMouth?: React.ReactNode
  decorations?: React.ReactNode
}

// Blook configurations for all 70+ Booms
const BLOOKS: Record<string, BlookDesign> = {
  // Bug Pack
  Butterfly: {
    bg: "from-pink-400 to-fuchsia-500",
    border: "border-pink-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Antennas */}
        <path d="M 42 15 Q 35 5 25 10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 58 15 Q 65 5 75 10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Butterfly wings extending from sides */}
        <path d="M 15 25 Q -10 10 5 45 Q -15 75 20 60 Z" fill="#ec4899" opacity="0.85" />
        <path d="M 85 25 Q 110 10 95 45 Q 115 75 80 60 Z" fill="#ec4899" opacity="0.85" />
      </>
    )
  },
  Bee: {
    bg: "from-yellow-400 to-amber-500",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Bee stripes */}
        <rect x="12" y="32" width="76" height="10" fill="#1e293b" />
        <rect x="12" y="55" width="76" height="10" fill="#1e293b" />
        {/* Small wings */}
        <ellipse cx="28" cy="22" rx="7" ry="12" fill="#e2e8f0" transform="rotate(-30 28 22)" opacity="0.75" />
        <ellipse cx="72" cy="22" rx="7" ry="12" fill="#e2e8f0" transform="rotate(30 72 22)" opacity="0.75" />
      </>
    )
  },
  Spider: {
    bg: "from-slate-800 to-slate-950",
    border: "border-slate-700",
    eyes: "spider",
    mouth: "none",
    decorations: (
      <>
        {/* Spider legs */}
        <path d="M 5 35 Q 20 40 25 45 M 5 50 Q 20 50 25 50 M 5 65 Q 20 60 25 55" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <path d="M 95 35 Q 80 40 75 45 M 95 50 Q 80 50 75 50 M 95 65 Q 80 60 75 55" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        {/* Red hourglass symbol */}
        <polygon points="50,45 60,45 50,60 60,60" fill="#ef4444" />
      </>
    )
  },
  "Golden Beetle": {
    bg: "from-amber-400 via-yellow-500 to-yellow-600",
    border: "border-yellow-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Beetle Horn */}
        <path d="M 50 15 L 50 2 Q 40 -5 35 -10 L 45 -5 L 50 5 L 55 -5 L 65 -10 Q 60 -5 50 2 Z" fill="#eab308" />
        {/* Shiny shell line */}
        <line x1="50" y1="35" x2="50" y2="85" stroke="#ca8a04" strokeWidth="3" />
      </>
    )
  },
  "Rainbow Dragonfly": {
    bg: "from-teal-400 via-indigo-500 to-purple-600",
    border: "border-indigo-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Long wings */}
        <path d="M 15 35 Q -25 25 15 45 M 85 35 Q 125 25 85 45" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        <path d="M 18 45 Q -20 40 18 53 M 82 45 Q 120 40 82 53" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </>
    )
  },
  "Cosmic Mantis": {
    bg: "from-emerald-600 to-teal-900",
    border: "border-emerald-500",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Mantis Claws */}
        <path d="M 20 60 Q 10 70 20 85 L 25 70 Z" fill="#10b981" />
        <path d="M 80 60 Q 90 70 80 85 L 75 70 Z" fill="#10b981" />
      </>
    )
  },

  // Pirate Pack
  Parrot: {
    bg: "from-red-500 to-red-700",
    border: "border-red-400",
    eyes: "default",
    mouth: "beak",
    decorations: (
      <>
        {/* Yellow mask */}
        <path d="M 25 35 Q 50 45 75 35 L 75 55 Q 50 65 25 55 Z" fill="#eab308" opacity="0.8" />
        {/* Eye patch */}
        <circle cx="35" cy="45" r="11" fill="black" />
        <line x1="15" y1="30" x2="45" y2="50" stroke="black" strokeWidth="3" />
      </>
    )
  },
  "Treasure Chest": {
    bg: "from-amber-800 to-amber-950",
    border: "border-amber-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Chest bands */}
        <rect x="22" y="10" width="8" height="80" fill="#f59e0b" />
        <rect x="70" y="10" width="8" height="80" fill="#f59e0b" />
        <rect x="10" y="45" width="80" height="10" fill="#f59e0b" />
        {/* Lock */}
        <rect x="44" y="40" width="12" height="15" rx="2" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="50" cy="45" r="2.5" fill="black" />
      </>
    )
  },
  "Ghost Ship": {
    bg: "from-cyan-900/60 to-indigo-950/60",
    border: "border-cyan-500/30",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Eerie tattered sails */}
        <path d="M 25 20 L 50 15 L 45 45 Z" fill="#94a3b8" opacity="0.7" />
        <path d="M 55 25 L 80 20 L 70 50 Z" fill="#94a3b8" opacity="0.7" />
        <line x1="50" y1="12" x2="50" y2="85" stroke="#475569" strokeWidth="4" />
        {/* Glow */}
        <circle cx="50" cy="50" r="20" fill="#22d3ee" opacity="0.1" className="animate-pulse" />
      </>
    )
  },
  Kraken: {
    bg: "from-teal-700 to-slate-900",
    border: "border-teal-600",
    eyes: "none",
    mouth: "none",
    customEyes: (
      <g>
        {/* Big singular eye */}
        <circle cx="50" cy="42" r="16" fill="white" />
        <circle cx="50" cy="42" r="8" fill="#ef4444" />
        <circle cx="50" cy="42" r="4" fill="black" />
      </g>
    ),
    decorations: (
      <>
        {/* Tentacles */}
        <path d="M 12 75 Q 20 60 25 85" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" />
        <path d="M 88 75 Q 80 60 75 85" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" />
        <path d="M 35 80 Q 50 65 65 80" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },
  "Golden Compass": {
    bg: "from-amber-500 via-yellow-400 to-yellow-600",
    border: "border-yellow-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Dial */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#78350f" strokeWidth="3" />
        <polygon points="50,25 55,50 50,55" fill="#ef4444" />
        <polygon points="50,75 55,50 50,50" fill="#94a3b8" />
        <circle cx="50" cy="50" r="4" fill="#ca8a04" />
      </>
    )
  },
  "Davy Jones": {
    bg: "from-emerald-800 to-slate-950",
    border: "border-emerald-600",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        {/* Pirate Hat */}
        <path d="M 10 30 Q 50 15 90 30 L 90 20 Q 50 5 10 20 Z" fill="#0f172a" />
        {/* Octopus Tentacles beard */}
        <path d="M 35 60 Q 30 85 35 90" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <path d="M 50 60 Q 50 85 50 90" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <path d="M 65 60 Q 70 85 65 90" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },

  // Space Pack
  Alien: {
    bg: "from-green-400 to-emerald-600",
    border: "border-green-300",
    eyes: "none",
    mouth: "smile",
    decorations: (
      <>
        {/* Three eyes */}
        <circle cx="30" cy="40" r="7" fill="white" />
        <circle cx="30" cy="40" r="3.5" fill="black" />
        <circle cx="50" cy="35" r="7" fill="white" />
        <circle cx="50" cy="35" r="3.5" fill="black" />
        <circle cx="70" cy="40" r="7" fill="white" />
        <circle cx="70" cy="40" r="3.5" fill="black" />
        {/* Antenna */}
        <line x1="50" y1="20" x2="50" y2="8" stroke="white" strokeWidth="3" />
        <circle cx="50" cy="6" r="4.5" fill="#f43f5e" />
      </>
    )
  },
  Planet: {
    bg: "from-blue-600 to-indigo-900",
    border: "border-blue-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Planetary Ring */}
        <ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="#f97316" strokeWidth="7" transform="rotate(-15 50 50)" opacity="0.8" />
      </>
    )
  },
  "Black Hole": {
    bg: "from-slate-950 via-purple-950 to-slate-950",
    border: "border-indigo-900",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Accretion disk vortex */}
        <circle cx="50" cy="50" r="34" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,15" className="animate-spin-slow" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#a855f7" strokeWidth="4" />
        <circle cx="50" cy="50" r="15" fill="black" />
      </>
    )
  },
  Galaxy: {
    bg: "from-violet-950 via-indigo-900 to-black",
    border: "border-purple-500/40",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Swirling spiral arms */}
        <path d="M 50 50 Q 20 40 30 20 M 50 50 Q 80 60 70 80" stroke="#f472b6" strokeWidth="3" fill="none" opacity="0.6" />
        {/* Tiny stars */}
        <circle cx="25" cy="25" r="1" fill="white" />
        <circle cx="75" cy="30" r="1.5" fill="white" />
        <circle cx="35" cy="75" r="1" fill="white" />
      </>
    )
  },
  "Cosmic Dragon": {
    bg: "from-pink-900 to-purple-950",
    border: "border-pink-500",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Dragon Horns */}
        <path d="M 25 15 Q 15 -2 5 5" stroke="#f472b6" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 75 15 Q 85 -2 95 5" stroke="#f472b6" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    )
  },
  "Universe Core": {
    bg: "from-cyan-500 via-indigo-500 to-purple-600",
    border: "border-cyan-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Orbits */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(30 50 50)" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(-30 50 50)" />
        {/* Glowing core */}
        <circle cx="50" cy="50" r="10" fill="white" className="animate-pulse" />
      </>
    )
  },

  // Medieval Pack
  Castle: {
    bg: "from-gray-500 to-slate-700",
    border: "border-gray-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Castle Battlements */}
        <rect x="20" y="5" width="12" height="12" fill="#475569" />
        <rect x="44" y="5" width="12" height="12" fill="#475569" />
        <rect x="68" y="5" width="12" height="12" fill="#475569" />
        {/* Bricks */}
        <line x1="30" y1="75" x2="70" y2="75" stroke="#334155" strokeWidth="2" />
        <line x1="50" y1="75" x2="50" y2="90" stroke="#334155" strokeWidth="2" />
      </>
    )
  },
  Dragon: {
    bg: "from-orange-600 to-red-800",
    border: "border-orange-500",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Snout with flame details */}
        <path d="M 38 60 L 50 72 L 62 60" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
        <circle cx="45" cy="58" r="2.5" fill="black" />
        <circle cx="55" cy="58" r="2.5" fill="black" />
      </>
    )
  },
  Wizard: {
    bg: "from-blue-700 to-indigo-950",
    border: "border-blue-500",
    eyes: "wizard",
    mouth: "smile",
    decorations: (
      <>
        {/* Wizard Hat */}
        <path d="M 12 28 L 50 -5 L 88 28 Z" fill="#1e1b4b" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="50" cy="12" r="2" fill="#eab308" />
        {/* Beard */}
        <path d="M 30 65 Q 50 95 70 65 Q 50 75 30 65" fill="#f1f5f9" />
      </>
    )
  },
  "Crown Jewels": {
    bg: "from-rose-600 to-red-900",
    border: "border-rose-400",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Crown */}
        <path d="M 20 45 L 30 20 L 50 35 L 70 20 L 80 45 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        {/* Gemstones */}
        <circle cx="30" cy="20" r="3.5" fill="#ef4444" />
        <circle cx="50" cy="35" r="3.5" fill="#3b82f6" />
        <circle cx="70" cy="20" r="3.5" fill="#10b981" />
      </>
    )
  },
  Excalibur: {
    bg: "from-sky-800 to-slate-900",
    border: "border-sky-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Sword stuck in stone */}
        <path d="M 47 15 L 53 15 L 53 60 L 47 60 Z" fill="#cbd5e1" />
        <line x1="38" y1="20" x2="62" y2="20" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" />
        <rect x="46" y="2" width="8" height="18" rx="2" fill="#ca8a04" />
        {/* Stone at bottom */}
        <path d="M 20 85 Q 50 55 80 85 Z" fill="#64748b" />
      </>
    )
  },
  "Merlin's Staff": {
    bg: "from-amber-900 to-stone-950",
    border: "border-amber-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Staff shaft */}
        <rect x="46" y="10" width="8" height="80" rx="3" fill="#78350f" />
        {/* Glowing floating orb */}
        <circle cx="50" cy="22" r="14" fill="#3b82f6" opacity="0.3" className="animate-pulse" />
        <circle cx="50" cy="22" r="9" fill="#60a5fa" />
        <circle cx="50" cy="22" r="5" fill="white" />
      </>
    )
  },

  // Safari Pack
  Elephant: {
    bg: "from-zinc-400 to-zinc-600",
    border: "border-zinc-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Elephant Ears */}
        <path d="M 12 30 Q -10 20 8 65 L 15 50 Z" fill="#71717a" />
        <path d="M 88 30 Q 110 20 92 65 L 85 50 Z" fill="#71717a" />
        {/* Trunk */}
        <path d="M 46 55 Q 50 78 40 85 Q 48 85 54 75 L 54 55 Z" fill="#71717a" />
      </>
    )
  },
  Giraffe: {
    bg: "from-amber-400 to-orange-500",
    border: "border-amber-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Giraffe spots */}
        <rect x="20" y="70" width="10" height="10" rx="2" fill="#78350f" opacity="0.3" />
        <rect x="70" y="65" width="12" height="8" rx="2" fill="#78350f" opacity="0.3" />
        {/* Small horns */}
        <rect x="38" y="5" width="5" height="10" fill="#78350f" />
        <rect x="57" y="5" width="5" height="10" fill="#78350f" />
        <circle cx="40" cy="4" r="4.5" fill="#ca8a04" />
        <circle cx="59" cy="4" r="4.5" fill="#ca8a04" />
      </>
    )
  },
  Rhino: {
    bg: "from-slate-400 to-slate-600",
    border: "border-slate-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Rhino Horns */}
        <path d="M 50 48 L 45 30 L 53 48 Z" fill="#e2e8f0" />
        <path d="M 50 56 L 47 44 L 52 56 Z" fill="#e2e8f0" />
      </>
    )
  },
  "White Tiger": {
    bg: "from-slate-50 to-slate-200",
    border: "border-slate-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Tiger Stripes */}
        <path d="M 12 35 L 25 38 L 12 42 Z" fill="#0f172a" />
        <path d="M 88 35 L 75 38 L 88 42 Z" fill="#0f172a" />
        <path d="M 12 55 L 22 58 L 12 62 Z" fill="#0f172a" />
        <path d="M 88 55 L 78 58 L 88 62 Z" fill="#0f172a" />
      </>
    )
  },
  "Golden Leopard": {
    bg: "from-amber-400 via-yellow-400 to-amber-500",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Leopard spots */}
        <circle cx="22" cy="72" r="3.5" fill="#78350f" />
        <circle cx="78" cy="72" r="3.5" fill="#78350f" />
        <circle cx="30" cy="22" r="3" fill="#78350f" />
        <circle cx="70" cy="22" r="3" fill="#78350f" />
        <circle cx="50" cy="78" r="4.5" fill="#78350f" />
      </>
    )
  },
  "Spirit Lion": {
    bg: "from-cyan-400 via-blue-500 to-indigo-600",
    border: "border-cyan-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Glowing Lion Mane overlay */}
        <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z" fill="none" stroke="#22d3ee" strokeWidth="4" opacity="0.6" />
        <path d="M 12 12 Q 50 -5 88 12 Q 105 50 88 88 Q 50 105 12 88 Q -5 50 12 12" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
      </>
    )
  },

  // Aquatic Pack
  Dolphin: {
    bg: "from-cyan-400 to-blue-500",
    border: "border-cyan-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Dolphin dorsal fin on side */}
        <path d="M 12 40 Q -5 30 10 50 Z" fill="#0891b2" />
      </>
    )
  },
  Octopus: {
    bg: "from-rose-400 to-pink-500",
    border: "border-rose-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Tentacles */}
        <path d="M 15 80 Q 8 95 18 90" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        <path d="M 30 80 Q 25 95 32 90" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        <path d="M 70 80 Q 75 95 68 90" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        <path d="M 85 80 Q 92 95 82 90" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },
  Whale: {
    bg: "from-blue-700 to-slate-800",
    border: "border-blue-500",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Spout */}
        <path d="M 50 10 Q 50 -5 45 -8 M 50 10 Q 55 -5 60 -8" stroke="#93c5fd" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  },
  Mermaid: {
    bg: "from-teal-400 via-pink-400 to-purple-500",
    border: "border-teal-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Scales texture */}
        <path d="M 15 70 Q 25 78 35 70 M 65 70 Q 75 78 85 70" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
        {/* Red hair */}
        <path d="M 15 15 L 85 15 L 85 30 L 15 30 Z" fill="#ef4444" />
      </>
    )
  },
  "Poseidon's Trident": {
    bg: "from-cyan-700 to-indigo-900",
    border: "border-cyan-400",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Wave pattern */}
        <path d="M 10 75 Q 30 65 50 75 Q 70 85 90 75" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
        {/* Gold Trident */}
        <path d="M 50 15 L 50 65 M 40 25 L 60 25 M 40 15 L 40 25 M 60 15 L 60 25" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
      </>
    )
  },
  Leviathan: {
    bg: "from-teal-900 to-stone-950",
    border: "border-teal-700",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Glowing red details */}
        <circle cx="30" cy="65" r="2.5" fill="#ef4444" className="animate-pulse" />
        <circle cx="70" cy="65" r="2.5" fill="#ef4444" className="animate-pulse" />
      </>
    )
  },

  // Breakfast Pack
  Bacon: {
    bg: "from-red-400 via-rose-500 to-red-600",
    border: "border-red-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Bacon waves */}
        <path d="M 22 10 Q 25 35 18 55 Q 25 75 22 90" stroke="white" strokeWidth="5" fill="none" opacity="0.4" />
        <path d="M 78 10 Q 75 35 82 55 Q 75 75 78 90" stroke="white" strokeWidth="5" fill="none" opacity="0.4" />
      </>
    )
  },
  Waffle: {
    bg: "from-amber-400 to-yellow-500",
    border: "border-yellow-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Waffle grids */}
        <rect x="20" y="20" width="12" height="12" stroke="#b45309" strokeWidth="2" fill="none" />
        <rect x="68" y="20" width="12" height="12" stroke="#b45309" strokeWidth="2" fill="none" />
        <rect x="20" y="68" width="12" height="12" stroke="#b45309" strokeWidth="2" fill="none" />
        <rect x="68" y="68" width="12" height="12" stroke="#b45309" strokeWidth="2" fill="none" />
      </>
    )
  },
  "French Toast": {
    bg: "from-amber-700 to-amber-900",
    border: "border-amber-500",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Butter Square */}
        <rect x="42" y="18" width="16" height="16" rx="2" fill="#fef08a" stroke="#facc15" strokeWidth="2.5" />
      </>
    )
  },
  "Golden Egg": {
    bg: "from-slate-50 to-slate-200",
    border: "border-slate-350",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Giant golden yolk */}
        <circle cx="50" cy="50" r="24" fill="#f59e0b" stroke="#ca8a04" strokeWidth="3" />
        <circle cx="50" cy="50" r="12" fill="#fbbf24" />
      </>
    )
  },
  "Rainbow Cereal": {
    bg: "from-sky-300 via-pink-300 to-purple-400",
    border: "border-white",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Cereal loops */}
        <circle cx="20" cy="22" r="4.5" fill="#f43f5e" />
        <circle cx="80" cy="22" r="4.5" fill="#eab308" />
        <circle cx="30" cy="78" r="4.5" fill="#10b981" />
        <circle cx="70" cy="78" r="4.5" fill="#3b82f6" />
      </>
    )
  },
  Ambrosia: {
    bg: "from-yellow-400 via-amber-400 to-orange-500",
    border: "border-yellow-250",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Honeycomb pattern */}
        <polygon points="50,25 58,30 58,40 50,45 42,40 42,30" fill="none" stroke="white" strokeWidth="2.5" />
        <polygon points="70,45 78,50 78,60 70,65 62,60 62,50" fill="none" stroke="white" strokeWidth="2.5" />
      </>
    )
  },

  // Dino Pack
  Triceratops: {
    bg: "from-amber-600 to-amber-800",
    border: "border-amber-500",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* 3 horns */}
        <path d="M 28 35 L 20 20 L 32 32" stroke="white" strokeWidth="3" fill="white" />
        <path d="M 72 35 L 80 20 L 68 32" stroke="white" strokeWidth="3" fill="white" />
        <path d="M 50 55 L 50 42 L 53 55" stroke="white" strokeWidth="3" fill="white" />
      </>
    )
  },
  Pterodactyl: {
    bg: "from-orange-500 to-amber-700",
    border: "border-orange-400",
    eyes: "default",
    mouth: "beak",
    decorations: (
      <>
        {/* Pterodactyl crest */}
        <path d="M 50 15 Q 50 2 38 -5 Q 50 8 50 15" fill="#b45309" />
      </>
    )
  },
  Stegosaurus: {
    bg: "from-emerald-500 to-green-700",
    border: "border-emerald-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Dino plates on top */}
        <path d="M 25 10 L 32 -2 L 39 10" fill="#047857" />
        <path d="M 45 10 L 52 -5 L 59 10" fill="#047857" />
        <path d="M 65 10 L 72 -2 L 79 10" fill="#047857" />
      </>
    )
  },
  Fossil: {
    bg: "from-neutral-700 to-neutral-900",
    border: "border-neutral-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Bone drawings */}
        <rect x="47" y="20" width="6" height="60" rx="3" fill="#e5e5e5" />
        <circle cx="45" cy="20" r="5" fill="#e5e5e5" />
        <circle cx="55" cy="20" r="5" fill="#e5e5e5" />
        <circle cx="45" cy="80" r="5" fill="#e5e5e5" />
        <circle cx="55" cy="80" r="5" fill="#e5e5e5" />
      </>
    )
  },
  Meteor: {
    bg: "from-orange-700 to-stone-900",
    border: "border-orange-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Fire tail */}
        <path d="M 12 12 Q 50 25 80 8" stroke="#ef4444" strokeWidth="6" fill="none" opacity="0.6" />
        {/* Cratered rock */}
        <circle cx="50" cy="50" r="22" fill="#78716c" stroke="#44403c" strokeWidth="2.5" />
        <circle cx="42" cy="42" r="4.5" fill="#44403c" />
        <circle cx="58" cy="54" r="5.5" fill="#44403c" />
      </>
    )
  },
  "Primordial Beast": {
    bg: "from-red-700 via-orange-850 to-stone-950",
    border: "border-red-600",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Glowing volcano split */}
        <polygon points="50,42 65,90 35,90" fill="#ef4444" opacity="0.8" />
        <polygon points="50,55 58,90 42,90" fill="#fbbf24" />
      </>
    )
  },

  // Bot Pack
  Drone: {
    bg: "from-slate-300 to-slate-500",
    border: "border-slate-200",
    eyes: "cyborg",
    mouth: "none",
    decorations: (
      <>
        {/* Rotors */}
        <line x1="5" y1="20" x2="25" y2="20" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="75" y1="20" x2="95" y2="20" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      </>
    )
  },
  Cyborg: {
    bg: "from-slate-400 to-zinc-800",
    border: "border-slate-300",
    eyes: "none",
    mouth: "none",
    customEyes: (
      <g>
        <circle cx="35" cy="45" r="9" fill="white" />
        <circle cx="35" cy="45" r="4.5" fill="black" />
        {/* Cyborg red laser eye */}
        <circle cx="65" cy="45" r="9" fill="#ef4444" />
        <circle cx="65" cy="45" r="3" fill="white" />
      </g>
    ),
    decorations: (
      <>
        {/* Metal face plate division */}
        <line x1="50" y1="10" x2="50" y2="90" stroke="#475569" strokeWidth="2.5" />
      </>
    )
  },
  "AI Core": {
    bg: "from-purple-900 to-slate-900",
    border: "border-purple-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Circuit nodes */}
        <circle cx="30" cy="30" r="5.5" fill="#a855f7" />
        <circle cx="70" cy="30" r="5.5" fill="#a855f7" />
        <circle cx="50" cy="70" r="8.5" fill="#c084fc" />
        <line x1="30" y1="30" x2="50" y2="70" stroke="white" strokeWidth="2" />
        <line x1="70" y1="30" x2="50" y2="70" stroke="white" strokeWidth="2" />
      </>
    )
  },
  "Quantum Computer": {
    bg: "from-cyan-900 to-slate-950",
    border: "border-cyan-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Grid lines */}
        <line x1="15" y1="35" x2="85" y2="35" stroke="#0891b2" strokeWidth="2" />
        <line x1="15" y1="65" x2="85" y2="65" stroke="#0891b2" strokeWidth="2" />
        <line x1="50" y1="15" x2="50" y2="85" stroke="#0891b2" strokeWidth="2" />
        <rect x="42" y="42" width="16" height="16" rx="2" fill="white" className="animate-pulse" />
      </>
    )
  },
  "Digital Soul": {
    bg: "from-blue-600 via-teal-500 to-emerald-600",
    border: "border-blue-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* scanlines overlay */}
        <rect x="12" y="12" width="76" height="76" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="3,8" opacity="0.4" />
      </>
    )
  },
  Singularity: {
    bg: "from-indigo-950 via-slate-950 to-indigo-950",
    border: "border-indigo-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Concentric digital rings */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="#6366f1" strokeWidth="3" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="#818cf8" strokeWidth="2" />
        <circle cx="50" cy="50" r="8" fill="white" className="animate-ping" />
      </>
    )
  },

  // Wonderland Pack
  "Cheshire Cat": {
    bg: "from-pink-500 to-purple-600",
    border: "border-pink-300",
    eyes: "cat",
    mouth: "grin",
    decorations: (
      <>
        {/* Cat ears */}
        <polygon points="12,12 28,12 18,-2" fill="#db2777" />
        <polygon points="88,12 72,12 82,-2" fill="#db2777" />
      </>
    )
  },
  "White Rabbit": {
    bg: "from-slate-50 to-slate-100",
    border: "border-slate-350",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Bunny Ears */}
        <path d="M 28 10 Q 15 -15 25 -20 Q 35 -15 32 10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <path d="M 72 10 Q 85 -15 75 -20 Q 65 -15 68 10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        {/* Spectacle */}
        <circle cx="35" cy="45" r="12" fill="none" stroke="#eab308" strokeWidth="2.5" />
      </>
    )
  },
  "Queen of Hearts": {
    bg: "from-red-600 to-black",
    border: "border-red-500",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Gold crown */}
        <path d="M 30 15 L 38 4 L 50 12 L 62 4 L 70 15 Z" fill="#eab308" />
        {/* Heart cheeks */}
        <path d="M 22 55 Q 26 51 30 55 L 26 62 Z" fill="#ef4444" />
        <path d="M 78 55 Q 74 55 70 55 L 74 62 Z" fill="#ef4444" />
      </>
    )
  },
  "Magic Mushroom": {
    bg: "from-red-500 to-rose-600",
    border: "border-red-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Mushroom white spots */}
        <circle cx="28" cy="22" r="5.5" fill="white" />
        <circle cx="72" cy="22" r="5.5" fill="white" />
        <circle cx="50" cy="15" r="8" fill="white" />
      </>
    )
  },
  "Looking Glass": {
    bg: "from-sky-300 via-indigo-400 to-purple-500",
    border: "border-sky-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Mirror Frame */}
        <rect x="18" y="18" width="64" height="64" rx="32" fill="none" stroke="#f59e0b" strokeWidth="4.5" />
        <path d="M 35 35 Q 50 15 65 35 L 50 75 Z" fill="white" opacity="0.3" />
      </>
    )
  },
  Jabberwocky: {
    bg: "from-purple-900 to-stone-950",
    border: "border-purple-700",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Wing extensions */}
        <path d="M 12 40 L -6 20 L 10 55 Z" fill="#4a044e" />
        <path d="M 88 40 L 106 20 L 90 55 Z" fill="#4a044e" />
      </>
    )
  },

  // Outback Pack
  Koala: {
    bg: "from-neutral-400 to-neutral-500",
    border: "border-neutral-300",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Large furry ears */}
        <circle cx="15" cy="25" r="12.5" fill="#a3a3a3" />
        <circle cx="15" cy="25" r="6.5" fill="#e5e5e5" />
        <circle cx="85" cy="25" r="12.5" fill="#a3a3a3" />
        <circle cx="85" cy="25" r="6.5" fill="#e5e5e5" />
        {/* Big nose */}
        <rect x="44" y="46" width="12" height="18" rx="6" fill="#171717" />
      </>
    )
  },
  Crocodile: {
    bg: "from-emerald-700 to-green-900",
    border: "border-emerald-600",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        {/* Crocodile spikes on top */}
        <path d="M 32 10 L 38 2 L 44 10 L 50 2 L 56 10 L 62 2 L 68 10" fill="#047857" />
      </>
    )
  },
  Dingo: {
    bg: "from-amber-600 to-amber-700",
    border: "border-amber-500",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Pointy ears */}
        <polygon points="15,15 30,15 20,-4" fill="#d97706" />
        <polygon points="85,15 70,15 80,-4" fill="#d97706" />
      </>
    )
  },
  Opal: {
    bg: "from-pink-300 via-teal-300 to-yellow-300",
    border: "border-white",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Gemstone cuts */}
        <polygon points="50,15 80,42 50,85 20,42" fill="none" stroke="white" strokeWidth="3" />
        <line x1="20" y1="42" x2="80" y2="42" stroke="white" strokeWidth="2.5" />
      </>
    )
  },
  "Dreamtime Spirit": {
    bg: "from-red-800 to-yellow-600",
    border: "border-red-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Boomerang symbols */}
        <path d="M 28 35 Q 50 65 72 35 L 64 28 Q 50 50 36 28 Z" fill="#f59e0b" />
      </>
    )
  },
  "Rainbow Serpent": {
    bg: "from-red-500 via-green-500 via-blue-500 to-purple-600",
    border: "border-white",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Serpent scale line */}
        <path d="M 12 70 Q 50 90 88 70" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },

  // Ice Pack
  "Polar Bear": {
    bg: "from-slate-100 to-slate-200",
    border: "border-slate-350",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        {/* Small ears */}
        <circle cx="22" cy="18" r="7.5" fill="white" />
        <circle cx="78" cy="18" r="7.5" fill="white" />
      </>
    )
  },
  Seal: {
    bg: "from-stone-300 to-stone-400",
    border: "border-stone-250",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        {/* Whiskers */}
        <line x1="25" y1="62" x2="10" y2="60" stroke="#737373" strokeWidth="2" />
        <line x1="25" y1="67" x2="8" y2="69" stroke="#737373" strokeWidth="2" />
        <line x1="75" y1="62" x2="90" y2="60" stroke="#737373" strokeWidth="2" />
        <line x1="75" y1="67" x2="92" y2="69" stroke="#737373" strokeWidth="2" />
      </>
    )
  },
  Yeti: {
    bg: "from-blue-100 via-sky-200 to-slate-300",
    border: "border-sky-300",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        {/* Fur tuft on top */}
        <path d="M 38 12 L 50 -2 L 62 12 Z" fill="white" />
      </>
    )
  },
  "Ice Crystal": {
    bg: "from-cyan-300 to-blue-500",
    border: "border-cyan-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Multi crystal lines */}
        <polygon points="50,15 75,50 50,85 25,50" fill="none" stroke="white" strokeWidth="3" />
        <line x1="50" y1="15" x2="50" y2="85" stroke="white" strokeWidth="2" />
      </>
    )
  },
  "Aurora Borealis": {
    bg: "from-indigo-950 via-teal-900 to-violet-950",
    border: "border-teal-500/30",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Swirling aurora waves */}
        <path d="M 12 35 Q 50 -10 88 35" fill="none" stroke="#22d3ee" strokeWidth="6" opacity="0.6" />
        <path d="M 12 55 Q 50 10 88 55" fill="none" stroke="#a855f7" strokeWidth="4" opacity="0.6" />
      </>
    )
  },
  "Frost Titan": {
    bg: "from-sky-700 to-indigo-950",
    border: "border-sky-500",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Frost horns */}
        <path d="M 22 15 L 10 0 L 26 12" stroke="#e0f2fe" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M 78 15 L 90 0 L 74 12" stroke="#e0f2fe" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </>
    )
  },

  // Special & Limited
  "Void Dragon": {
    bg: "from-black via-purple-950 to-black",
    border: "border-purple-600",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        {/* Dragon wings & glowing eyes */}
        <circle cx="35" cy="45" r="3.5" fill="#a855f7" />
        <circle cx="65" cy="45" r="3.5" fill="#a855f7" />
      </>
    )
  },
  "Infinity Gauntlet": {
    bg: "from-amber-600 via-yellow-500 to-amber-700",
    border: "border-yellow-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Gauntlet fist shape */}
        <rect x="35" y="30" width="30" height="48" rx="6" fill="#ca8a04" stroke="#854d0e" strokeWidth="2.5" />
        {/* 6 Gems */}
        <circle cx="42" cy="40" r="3.5" fill="#ef4444" />
        <circle cx="50" cy="40" r="3.5" fill="#3b82f6" />
        <circle cx="58" cy="40" r="3.5" fill="#10b981" />
        <circle cx="50" cy="50" r="4.5" fill="#eab308" />
        <circle cx="42" cy="62" r="3.5" fill="#ec4899" />
        <circle cx="58" cy="62" r="3.5" fill="#8b5cf6" />
      </>
    )
  },
  "Cosmic Phoenix": {
    bg: "from-red-500 via-orange-500 to-yellow-500",
    border: "border-orange-300",
    eyes: "cute",
    mouth: "beak",
    decorations: (
      <>
        {/* Fire wings */}
        <path d="M 12 45 Q -10 25 15 65 Z M 88 45 Q 110 25 85 65 Z" fill="#ef4444" opacity="0.8" />
      </>
    )
  },
  "God Eye": {
    bg: "from-yellow-450 via-slate-900 to-yellow-550",
    border: "border-yellow-400",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Eye lines */}
        <path d="M 15 50 Q 50 15 85 50 Q 50 85 15 50 Z" fill="none" stroke="#eab308" strokeWidth="4" />
        <circle cx="50" cy="50" r="16" fill="white" />
        <circle cx="50" cy="50" r="9" fill="#3b82f6" />
        <circle cx="50" cy="50" r="4" fill="black" />
      </>
    )
  },
  "The Trophy": {
    bg: "from-yellow-400 via-amber-500 to-yellow-600",
    border: "border-yellow-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        {/* Trophy cup */}
        <path d="M 30 20 L 70 20 L 65 52 Q 50 68 35 52 Z" fill="#ca8a04" stroke="#ca8a04" strokeWidth="2" />
        <path d="M 45 60 L 55 60 L 58 80 L 42 80 Z" fill="#ca8a04" />
        <rect x="35" y="80" width="30" height="8" rx="2" fill="#78350f" />
      </>
    )
  }
,
  // 1. AI Pack Additions
  Midjourney: {
    bg: "from-indigo-900 via-indigo-950 to-black",
    border: "border-indigo-800",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="50" r="16" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4" />
        <path d="M 40 50 L 60 50 M 50 40 L 50 60" stroke="white" strokeWidth="2" />
      </>
    )
  },
  "Stable Diffusion": {
    bg: "from-violet-600 to-fuchsia-800",
    border: "border-violet-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 35 30 L 65 30 L 50 70 Z" fill="#a855f7" opacity="0.6" />
        <circle cx="50" cy="30" r="6" fill="#f472b6" />
      </>
    )
  },
  Llama: {
    bg: "from-orange-100 to-amber-200",
    border: "border-amber-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 25 15 L 35 30 L 20 30 Z" fill="#fcd34d" />
        <path d="M 75 15 L 65 30 L 80 30 Z" fill="#fcd34d" />
        <rect x="40" y="52" width="20" height="15" rx="6" fill="#fef3c7" />
      </>
    )
  },
  Mistral: {
    bg: "from-cyan-800 to-slate-900",
    border: "border-cyan-700",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 20 40 Q 50 20 80 40 M 25 50 Q 50 30 75 50" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
      </>
    )
  },
  Anthropic: {
    bg: "from-red-800 to-amber-700",
    border: "border-red-700",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <text x="50" y="75" fontSize="36" fontWeight="black" fill="#fde68a" textAnchor="middle">A</text>
      </>
    )
  },
  Sora: {
    bg: "from-rose-500 via-purple-600 to-indigo-850",
    border: "border-rose-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 40 L 60 40 L 70 30 L 70 70 L 60 60 L 30 60 Z" fill="white" opacity="0.9" />
        <circle cx="45" cy="50" r="5" fill="#ec4899" />
      </>
    )
  },

  // 2. Bug Pack Additions
  Ladybug: {
    bg: "from-red-600 to-red-800",
    border: "border-red-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <line x1="50" y1="12" x2="50" y2="88" stroke="black" strokeWidth="4" />
        <circle cx="30" cy="30" r="5" fill="black" />
        <circle cx="70" cy="30" r="5" fill="black" />
        <circle cx="28" cy="65" r="6" fill="black" />
        <circle cx="72" cy="65" r="6" fill="black" />
      </>
    )
  },
  Caterpillar: {
    bg: "from-green-400 to-emerald-600",
    border: "border-green-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="20" cy="80" r="10" fill="#a3e635" />
        <circle cx="50" cy="80" r="10" fill="#84cc16" />
        <circle cx="80" cy="80" r="10" fill="#65a30d" />
      </>
    )
  },
  Ant: {
    bg: "from-stone-700 to-stone-900",
    border: "border-stone-600",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 40 15 Q 30 5 20 12 M 60 15 Q 70 5 80 12" stroke="#44403c" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    )
  },
  Snail: {
    bg: "from-yellow-200 to-amber-400",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 15 85 L 85 85" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
        <circle cx="50" cy="50" r="22" fill="#ca8a04" stroke="#78350f" strokeWidth="4" />
        <path d="M 50 50 Q 55 55 50 60 Q 40 50 50 40" fill="none" stroke="#78350f" strokeWidth="2.5" />
      </>
    )
  },
  Scorpion: {
    bg: "from-neutral-800 to-black",
    border: "border-neutral-700",
    eyes: "spider",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 88 C 60 100 80 90 80 70 C 80 50 60 50 60 40" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        <path d="M 55 35 L 65 40 L 60 45 Z" fill="#ef4444" />
      </>
    )
  },
  Glowworm: {
    bg: "from-emerald-900 to-green-950",
    border: "border-emerald-850",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="30" y="70" width="40" height="20" rx="8" fill="#a3e635" opacity="0.9" />
        <circle cx="50" cy="80" r="15" fill="#facc15" opacity="0.7" />
      </>
    )
  },

  // 3. Pirate Pack Additions
  "Pirate Hat": {
    bg: "from-slate-900 to-black",
    border: "border-slate-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 15 50 Q 50 20 85 50 Q 50 60 15 50 Z" fill="#1e293b" stroke="white" strokeWidth="2" />
        <circle cx="50" cy="42" r="6" fill="#ca8a04" />
        <path d="M 45 42 L 55 42 M 50 37 L 50 47" stroke="white" strokeWidth="2" />
      </>
    )
  },
  Spyglass: {
    bg: "from-yellow-600 to-amber-800",
    border: "border-yellow-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="42" y="20" width="16" height="50" fill="#d97706" stroke="#ca8a04" strokeWidth="2" />
        <rect x="38" y="70" width="24" height="12" fill="#92400e" />
        <circle cx="50" cy="18" r="8" fill="#38bdf8" opacity="0.8" />
      </>
    )
  },
  Cannon: {
    bg: "from-slate-700 to-slate-900",
    border: "border-slate-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="35" y="30" width="30" height="45" rx="5" fill="#334155" transform="rotate(-20 50 50)" />
        <circle cx="50" cy="75" r="10" fill="black" />
      </>
    )
  },
  Anchor: {
    bg: "from-slate-400 to-slate-600",
    border: "border-slate-500",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 20 L 50 75 M 30 55 C 30 75 70 75 70 55 M 25 55 L 35 55 M 65 55 L 75 55" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <circle cx="50" cy="22" r="8" fill="none" stroke="white" strokeWidth="5" />
      </>
    )
  },
  "Pegleg Captain": {
    bg: "from-red-900 to-stone-950",
    border: "border-red-800",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 20 25 L 80 25 L 50 10 Z" fill="black" />
        <rect x="25" y="38" width="18" height="15" fill="black" />
        <line x1="12" y1="35" x2="88" y2="48" stroke="black" strokeWidth="3.5" />
      </>
    )
  },
  "Blackbeard's Map": {
    bg: "from-yellow-100 to-amber-200",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 20 20 L 80 20 L 75 80 L 25 80 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
        <text x="50" y="55" fontSize="24" fill="#ef4444" fontWeight="bold" textAnchor="middle">X</text>
        <path d="M 30 30 Q 50 45 70 30" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="3" />
      </>
    )
  },

  // 4. Space Pack Additions
  Rocket: {
    bg: "from-slate-800 to-indigo-950",
    border: "border-slate-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 50 15 L 65 45 L 35 45 Z" fill="white" />
        <rect x="38" y="45" width="24" height="30" fill="white" />
        <path d="M 35 60 L 25 75 L 35 75 Z" fill="#ef4444" />
        <path d="M 65 60 L 75 75 L 65 75 Z" fill="#ef4444" />
        <circle cx="50" cy="55" r="6" fill="#38bdf8" />
      </>
    )
  },
  Astronaut: {
    bg: "from-blue-900 to-slate-950",
    border: "border-blue-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="32" fill="white" />
        <rect x="26" y="32" width="48" height="30" rx="15" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
        <path d="M 32 40 Q 50 48 68 40" stroke="white" strokeWidth="1.5" fill="none" />
      </>
    )
  },
  Meteorite: {
    bg: "from-stone-600 to-stone-800",
    border: "border-stone-500",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <circle cx="30" cy="30" r="8" fill="#44403c" />
        <circle cx="68" cy="60" r="10" fill="#44403c" />
        <circle cx="45" cy="70" r="6" fill="#44403c" />
      </>
    )
  },
  Satellite: {
    bg: "from-slate-700 to-indigo-900",
    border: "border-slate-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="44" y="25" width="12" height="50" fill="#94a3b8" />
        <rect x="15" y="40" width="25" height="15" fill="#3b82f6" stroke="white" strokeWidth="1" />
        <rect x="60" y="40" width="25" height="15" fill="#3b82f6" stroke="white" strokeWidth="1" />
      </>
    )
  },
  Supernova: {
    bg: "from-orange-500 via-red-600 to-purple-900",
    border: "border-orange-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 50 5 L 55 35 L 85 35 L 60 55 L 70 85 L 50 65 L 30 85 L 40 55 L 15 35 L 45 35 Z" fill="#facc15" opacity="0.85" />
      </>
    )
  },
  "Dark Matter": {
    bg: "from-purple-950 via-slate-950 to-black",
    border: "border-purple-900",
    eyes: "alien",
    mouth: "none",
    decorations: (
      <>
        <ellipse cx="50" cy="50" rx="35" ry="12" fill="#818cf8" opacity="0.3" transform="rotate(-25 50 50)" />
        <circle cx="50" cy="50" r="8" fill="#c084fc" opacity="0.6" />
      </>
    )
  },

  // 5. Medieval Pack Additions
  Shield: {
    bg: "from-slate-400 to-slate-600",
    border: "border-slate-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 20 20 L 80 20 L 75 55 Q 50 85 25 55 Z" fill="#3b82f6" stroke="#cbd5e1" strokeWidth="4" />
        <path d="M 50 20 L 50 75 M 20 45 L 80 45" stroke="#cbd5e1" strokeWidth="4" />
      </>
    )
  },
  Sword: {
    bg: "from-slate-300 to-slate-500",
    border: "border-slate-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 47 15 L 53 15 L 53 65 L 47 65 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="35" y="65" width="30" height="5" rx="1.5" fill="#fbbf24" />
        <rect x="47" y="70" width="6" height="18" fill="#78350f" />
      </>
    )
  },
  Knight: {
    bg: "from-slate-600 to-slate-800",
    border: "border-slate-500",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <rect x="25" y="38" width="50" height="16" rx="4" fill="#1e293b" />
        <line x1="30" y1="46" x2="70" y2="46" stroke="#ef4444" strokeWidth="3" />
      </>
    )
  },
  Jester: {
    bg: "from-pink-500 to-purple-600",
    border: "border-pink-400",
    eyes: "cute",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 20 28 Q 15 5 35 15 M 80 28 Q 85 5 65 15" stroke="#eab308" strokeWidth="4" fill="none" />
        <circle cx="35" cy="15" r="5" fill="#facc15" />
        <circle cx="65" cy="15" r="5" fill="#facc15" />
      </>
    )
  },
  Archmage: {
    bg: "from-violet-700 via-purple-800 to-indigo-900",
    border: "border-violet-600",
    eyes: "wizard",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 40 L 50 10 L 88 40 Z" fill="#4c1d95" opacity="0.85" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="#facc15" strokeWidth="2.5" opacity="0.6" />
      </>
    )
  },
  "Holy Grail": {
    bg: "from-amber-400 to-yellow-600",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 30 25 L 70 25 L 60 55 Q 50 65 40 55 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="3" />
        <rect x="46" y="55" width="8" height="20" fill="#eab308" />
        <rect x="35" y="75" width="30" height="6" rx="2" fill="#ca8a04" />
        <circle cx="50" cy="40" r="4" fill="#ef4444" />
      </>
    )
  },

  // 6. Safari Pack Additions
  Zebra: {
    bg: "from-slate-100 to-slate-300",
    border: "border-slate-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="12" y="22" width="25" height="6" fill="black" />
        <rect x="63" y="22" width="25" height="6" fill="black" />
        <rect x="12" y="42" width="35" height="6" fill="black" />
        <rect x="53" y="42" width="35" height="6" fill="black" />
        <rect x="12" y="62" width="28" height="6" fill="black" />
        <rect x="60" y="62" width="28" height="6" fill="black" />
      </>
    )
  },
  Meerkat: {
    bg: "from-amber-600 to-amber-800",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="34" cy="46" rx="11" ry="8" fill="#451a03" opacity="0.75" />
        <ellipse cx="66" cy="46" rx="11" ry="8" fill="#451a03" opacity="0.75" />
      </>
    )
  },
  Cheetah: {
    bg: "from-yellow-400 to-amber-500",
    border: "border-yellow-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="25" cy="30" r="3.5" fill="black" />
        <circle cx="75" cy="30" r="3.5" fill="black" />
        <circle cx="50" cy="35" r="3" fill="black" />
        <circle cx="32" cy="68" r="4" fill="black" />
        <circle cx="68" cy="68" r="4" fill="black" />
        <path d="M 33 46 Q 37 54 37 60 M 67 46 Q 63 54 63 60" stroke="black" strokeWidth="2.5" fill="none" />
      </>
    )
  },
  Hippo: {
    bg: "from-slate-500 to-slate-700",
    border: "border-slate-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="40" cy="72" rx="4" ry="6" fill="#1e293b" />
        <ellipse cx="60" cy="72" rx="4" ry="6" fill="#1e293b" />
        <rect x="32" y="80" width="36" height="8" rx="3" fill="#94a3b8" />
      </>
    )
  },
  Gorilla: {
    bg: "from-neutral-800 to-neutral-950",
    border: "border-neutral-700",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <rect x="22" y="32" width="56" height="10" rx="3" fill="#171717" />
        <path d="M 30 42 C 30 38 70 38 70 42 Z" fill="#262626" />
      </>
    )
  },
  "Albino Crocodile": {
    bg: "from-zinc-100 to-zinc-300",
    border: "border-zinc-200",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 30 65 L 70 65 L 60 85 L 40 85 Z" fill="#cbd5e1" />
        <polygon points="35,65 40,72 45,65" fill="white" />
        <polygon points="55,65 60,72 65,65" fill="white" />
      </>
    )
  },

  // 7. Aquatic Pack Additions
  Starfish: {
    bg: "from-rose-400 to-orange-500",
    border: "border-rose-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 50 10 L 62 38 L 92 38 L 68 56 L 77 86 L 50 68 L 23 86 L 32 56 L 8 38 L 38 38 Z" fill="#fda4af" opacity="0.5" />
      </>
    )
  },
  Crab: {
    bg: "from-red-500 to-orange-600",
    border: "border-red-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 20 25 C 10 15 5 35 20 35 Z" fill="#ef4444" />
        <path d="M 80 25 C 90 15 95 35 80 35 Z" fill="#ef4444" />
      </>
    )
  },
  Shark: {
    bg: "from-slate-400 to-blue-600",
    border: "border-slate-350",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 12 12 Q 35 25 50 12 L 50 25 Z" fill="#64748b" />
        <polygon points="32,60 36,68 40,60" fill="white" />
        <polygon points="44,60 48,68 52,60" fill="white" />
        <polygon points="56,60 60,68 64,60" fill="white" />
      </>
    )
  },
  Jellyfish: {
    bg: "from-pink-400 via-purple-400 to-indigo-600",
    border: "border-pink-300",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 88 Q 33 70 35 88 Q 38 70 40 88" stroke="#f472b6" strokeWidth="2.5" fill="none" />
        <path d="M 50 88 Q 53 70 55 88 Q 58 70 60 88" stroke="#c084fc" strokeWidth="2.5" fill="none" />
        <path d="M 70 88 Q 73 70 75 88 Q 78 70 80 88" stroke="#f472b6" strokeWidth="2.5" fill="none" />
      </>
    )
  },
  Stingray: {
    bg: "from-cyan-800 to-slate-900",
    border: "border-cyan-700",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 50 L 50 20 L 88 50 L 50 80 Z" fill="#0891b2" opacity="0.35" />
        <line x1="50" y1="80" x2="50" y2="98" stroke="#0891b2" strokeWidth="3.5" />
      </>
    )
  },
  "Atlantis Crown": {
    bg: "from-teal-400 via-cyan-500 to-blue-600",
    border: "border-teal-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 22 75 L 28 35 L 42 55 L 50 25 L 58 55 L 72 35 L 78 75 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="3" />
        <circle cx="50" cy="25" r="5" fill="#38bdf8" />
        <circle cx="28" cy="35" r="4" fill="#38bdf8" />
        <circle cx="72" cy="35" r="4" fill="#38bdf8" />
      </>
    )
  },

  // 8. Breakfast Pack Additions
  Pancake: {
    bg: "from-amber-300 to-yellow-500",
    border: "border-amber-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="40" y="28" width="20" height="14" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
        <path d="M 25 45 Q 50 55 75 45" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.75" />
      </>
    )
  },
  Toast: {
    bg: "from-amber-200 to-amber-700",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 18 18 L 82 18 C 88 35 88 65 82 82 L 18 82 C 12 65 12 35 18 18 Z" fill="none" stroke="#78350f" strokeWidth="4" />
      </>
    )
  },
  "Coffee Mug": {
    bg: "from-red-500 to-red-700",
    border: "border-red-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 88 35 C 98 35 98 65 88 65" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
        <path d="M 40 10 Q 45 5 40 2 M 50 10 Q 55 5 50 2 M 60 10 Q 65 5 60 2" stroke="white" strokeWidth="2" fill="none" />
      </>
    )
  },
  "Orange Juice": {
    bg: "from-orange-400 to-orange-600",
    border: "border-orange-350",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <line x1="12" y1="35" x2="88" y2="35" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="50" cy="24" r="8" fill="#fdba74" stroke="white" strokeWidth="2" />
      </>
    )
  },
  Omelette: {
    bg: "from-yellow-300 to-yellow-500",
    border: "border-yellow-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="50" cy="55" rx="32" ry="24" fill="#fde047" opacity="0.6" />
        <circle cx="35" cy="50" r="3" fill="#22c55e" />
        <circle cx="65" cy="60" r="3" fill="#22c55e" />
        <circle cx="50" cy="45" r="3.5" fill="#ef4444" />
      </>
    )
  },
  "Golden Syrup": {
    bg: "from-amber-400 via-yellow-500 to-amber-600",
    border: "border-amber-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 12 12 L 88 12 L 88 40 Q 75 55 65 40 Q 50 60 40 40 Q 25 55 12 40 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      </>
    )
  },

  // 9. Dino Pack Additions
  Raptor: {
    bg: "from-emerald-700 to-teal-900",
    border: "border-emerald-600",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 15 20 Q 30 15 35 30 M 85 20 Q 70 15 65 30" stroke="#047857" strokeWidth="3" fill="none" />
      </>
    )
  },
  Brachiosaurus: {
    bg: "from-emerald-500 to-green-700",
    border: "border-emerald-450",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 88 Q 30 40 50 40 Q 55 40 55 50 Q 50 60 42 88 Z" fill="#15803d" />
      </>
    )
  },
  "T-Rex": {
    bg: "from-red-600 to-rose-800",
    border: "border-red-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <polygon points="30,60 34,66 38,60" fill="white" />
        <polygon points="42,60 46,66 50,60" fill="white" />
        <rect x="25" y="70" width="8" height="5" rx="1" fill="#be123c" />
        <rect x="67" y="70" width="8" height="5" rx="1" fill="#be123c" />
      </>
    )
  },
  Ankylosaurus: {
    bg: "from-amber-700 to-stone-800",
    border: "border-amber-600",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 50 L 22 40 L 22 60 Z" fill="#ca8a04" />
        <path d="M 88 50 L 78 40 L 78 60 Z" fill="#ca8a04" />
        <path d="M 50 12 L 40 22 L 60 22 Z" fill="#ca8a04" />
      </>
    )
  },
  Spinosaurus: {
    bg: "from-orange-600 to-red-800",
    border: "border-orange-500",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 18 12 Q 50 -10 82 12 Z" fill="#ca8a04" opacity="0.75" />
      </>
    )
  },
  "Amber Mosquito": {
    bg: "from-yellow-400 via-amber-400 to-yellow-600",
    border: "border-yellow-300",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="18" fill="black" opacity="0.8" />
        <line x1="32" y1="42" x2="68" y2="58" stroke="white" strokeWidth="2" opacity="0.3" />
        <line x1="32" y1="58" x2="68" y2="42" stroke="white" strokeWidth="2" opacity="0.3" />
      </>
    )
  },

  // 10. Bot Pack Additions
  Microchip: {
    bg: "from-emerald-800 to-green-950",
    border: "border-emerald-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="30" y="30" width="40" height="40" fill="black" stroke="#eab308" strokeWidth="2" />
        <line x1="12" y1="40" x2="30" y2="40" stroke="#eab308" strokeWidth="3.5" />
        <line x1="12" y1="50" x2="30" y2="50" stroke="#eab308" strokeWidth="3.5" />
        <line x1="12" y1="60" x2="30" y2="60" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="40" x2="88" y2="40" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="50" x2="88" y2="50" stroke="#eab308" strokeWidth="3.5" />
        <line x1="70" y1="60" x2="88" y2="60" stroke="#eab308" strokeWidth="3.5" />
      </>
    )
  },
  "Floppy Disk": {
    bg: "from-blue-900 to-black",
    border: "border-blue-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="22" y="22" width="56" height="56" rx="4" fill="#1e293b" />
        <rect x="32" y="22" width="36" height="20" fill="white" />
        <rect x="35" y="56" width="30" height="22" fill="#cbd5e1" />
      </>
    )
  },
  Nanobot: {
    bg: "from-cyan-600 to-slate-900",
    border: "border-cyan-500",
    eyes: "cyborg",
    mouth: "none",
    decorations: (
      <>
        <circle cx="50" cy="50" r="14" fill="#0891b2" />
        <path d="M 35 60 L 25 75 M 65 60 L 75 75" stroke="white" strokeWidth="2.5" />
      </>
    )
  },
  "Mech Suit": {
    bg: "from-slate-500 to-zinc-700",
    border: "border-slate-400",
    eyes: "cyborg",
    mouth: "grin",
    decorations: (
      <>
        <polygon points="50,68 62,54 38,54" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
      </>
    )
  },
  Android: {
    bg: "from-green-500 to-emerald-600",
    border: "border-green-400",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <line x1="35" y1="20" x2="25" y2="8" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="65" y1="20" x2="75" y2="8" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
      </>
    )
  },
  "Glitch Code": {
    bg: "from-black to-slate-900",
    border: "border-slate-800",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <text x="50" y="42" fontSize="16" fill="#22c55e" fontFamily="monospace" textAnchor="middle">101</text>
        <text x="50" y="65" fontSize="16" fill="#22c55e" fontFamily="monospace" textAnchor="middle">010</text>
      </>
    )
  },

  // 11. Wonderland Pack Additions
  "Mad Hatter": {
    bg: "from-green-700 to-teal-900",
    border: "border-green-600",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 22 35 L 78 35 L 70 8 L 30 8 Z" fill="#047857" stroke="black" strokeWidth="2" />
        <rect x="36" y="24" width="28" height="10" fill="#facc15" />
        <text x="50" y="22" fontSize="9" fontWeight="bold" fill="black" textAnchor="middle">10/6</text>
      </>
    )
  },
  "Tea Cup": {
    bg: "from-pink-300 to-slate-100",
    border: "border-pink-200",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 25 35 Q 50 20 75 35 L 70 75 Q 50 85 30 75 Z" fill="white" />
        <path d="M 72 45 C 80 45 80 65 72 65" fill="none" stroke="white" strokeWidth="4" />
      </>
    )
  },
  "March Hare": {
    bg: "from-amber-500 to-amber-700",
    border: "border-amber-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="32" cy="18" rx="6" ry="16" fill="#fcd34d" transform="rotate(-15 32 18)" />
        <ellipse cx="68" cy="18" rx="6" ry="16" fill="#fcd34d" transform="rotate(15 68 18)" />
      </>
    )
  },
  "Card Soldier": {
    bg: "from-slate-100 to-slate-200",
    border: "border-slate-300",
    eyes: "default",
    mouth: "none",
    decorations: (
      <>
        <rect x="22" y="28" width="56" height="56" rx="2" fill="white" stroke="black" strokeWidth="2" />
        <path d="M 50 48 C 45 40 35 46 50 61 C 65 46 55 40 50 48 Z" fill="#ef4444" />
      </>
    )
  },
  "Caterpillar Hookah": {
    bg: "from-blue-600 to-indigo-800",
    border: "border-blue-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="22" r="10" fill="none" stroke="#e2e8f0" strokeWidth="3" opacity="0.6" />
      </>
    )
  },
  "Vorpal Blade": {
    bg: "from-slate-800 via-indigo-950 to-purple-950",
    border: "border-slate-700",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <path d="M 46 15 L 54 15 L 52 65 L 48 65 Z" fill="#a78bfa" stroke="white" strokeWidth="1.5" />
        <line x1="35" y1="65" x2="65" y2="65" stroke="white" strokeWidth="3" />
      </>
    )
  },

  // 12. Outback Pack Additions
  Kangaroo: {
    bg: "from-amber-600 to-orange-700",
    border: "border-amber-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 30 18 L 25 2 L 38 12 Z" fill="#ca8a04" />
        <path d="M 70 18 L 75 2 L 62 12 Z" fill="#ca8a04" />
        <path d="M 30 70 Q 50 82 70 70 Z" fill="#ca8a04" stroke="white" strokeWidth="1" />
      </>
    )
  },
  Wombat: {
    bg: "from-stone-500 to-stone-700",
    border: "border-stone-400",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <circle cx="50" cy="56" r="6" fill="#292524" />
      </>
    )
  },
  Platypus: {
    bg: "from-teal-600 to-teal-850",
    border: "border-teal-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <rect x="35" y="52" width="30" height="12" rx="6" fill="#1e293b" />
      </>
    )
  },
  Echidna: {
    bg: "from-amber-800 to-amber-950",
    border: "border-amber-700",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <path d="M 12 40 L 2 30 L 15 48 L 2 50 L 15 56 M 88 40 L 98 30 L 85 48 L 98 50 L 85 56" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  "Tasmanian Devil": {
    bg: "from-neutral-800 to-black",
    border: "border-neutral-700",
    eyes: "default",
    mouth: "grin",
    decorations: (
      <>
        <path d="M 28 68 Q 50 82 72 68" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    )
  },
  Didgeridoo: {
    bg: "from-amber-700 via-amber-800 to-yellow-900",
    border: "border-amber-600",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <rect x="42" y="15" width="16" height="70" rx="4" fill="#78350f" stroke="#eab308" strokeWidth="2.5" />
        <circle cx="50" cy="30" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx="50" cy="55" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      </>
    )
  },

  // 13. Ice Pack Additions
  Penguin: {
    bg: "from-sky-900 to-slate-950",
    border: "border-sky-850",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <ellipse cx="50" cy="62" rx="26" ry="24" fill="white" />
        <polygon points="44,50 56,50 50,60" fill="#f59e0b" />
      </>
    )
  },
  Snowflake: {
    bg: "from-sky-300 to-blue-500",
    border: "border-sky-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <line x1="50" y1="18" x2="50" y2="82" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="28" x2="72" y2="72" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="72" x2="72" y2="28" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },
  Walrus: {
    bg: "from-amber-850 to-stone-700",
    border: "border-amber-800",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <line x1="40" y1="58" x2="40" y2="76" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="60" y1="58" x2="60" y2="76" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      </>
    )
  },
  Narwhal: {
    bg: "from-slate-600 to-blue-800",
    border: "border-slate-500",
    eyes: "cute",
    mouth: "smile",
    decorations: (
      <>
        <polygon points="48,25 52,25 50,-5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      </>
    )
  },
  "Snow Golem": {
    bg: "from-slate-100 to-slate-300",
    border: "border-slate-200",
    eyes: "default",
    mouth: "smile",
    decorations: (
      <>
        <polygon points="46,46 54,46 50,54" fill="#f97316" />
        <rect x="30" y="24" width="40" height="6" fill="#78350f" />
      </>
    )
  },
  "Everlasting Ice": {
    bg: "from-cyan-300 via-blue-400 to-teal-500",
    border: "border-cyan-200",
    eyes: "none",
    mouth: "none",
    decorations: (
      <>
        <polygon points="50,20 80,40 80,70 50,90 20,70 20,40" fill="#38bdf8" stroke="white" strokeWidth="2.5" opacity="0.85" />
        <line x1="50" y1="20" x2="50" y2="90" stroke="white" strokeWidth="1.5" opacity="0.6" />
      </>
    )
  }
}

// Blook SVG builder
const TAILWIND_COLOR_MAP: Record<string, string> = {
  "red-100": "#fee2e2", "red-200": "#fecaca", "red-300": "#fca5a5", "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c", "red-800": "#991b1b", "red-900": "#7f1d1d",
  "orange-100": "#ffedd5", "orange-200": "#fed7aa", "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316", "orange-600": "#ea580c", "orange-700": "#c2410c", "orange-800": "#9a3412", "orange-900": "#7c2d12",
  "amber-100": "#fef3c7", "amber-200": "#fde68a", "amber-300": "#fcd34d", "amber-400": "#fbbf24", "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309", "amber-800": "#92400e", "amber-900": "#78350f",
  "yellow-100": "#fef9c3", "yellow-200": "#fef08a", "yellow-300": "#fde047", "yellow-400": "#facc15", "yellow-500": "#eab308", "yellow-600": "#ca8a04", "yellow-700": "#a16207", "yellow-800": "#854d0e", "yellow-900": "#713f12",
  "lime-100": "#f7fee7", "lime-200": "#d9f99d", "lime-300": "#bef264", "lime-400": "#a3e635", "lime-500": "#84cc16", "lime-600": "#65a30d", "lime-700": "#4d7c0f", "lime-800": "#3f6212", "lime-900": "#365314",
  "green-100": "#dcfce7", "green-200": "#bbf7d0", "green-300": "#86efac", "green-400": "#4ade80", "green-500": "#22c55e", "green-600": "#16a34a", "green-700": "#15803d", "green-800": "#166534", "green-900": "#14532d",
  "emerald-100": "#d1fae5", "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7", "emerald-400": "#34d399", "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857", "emerald-800": "#065f46", "emerald-900": "#064e3b",
  "teal-100": "#ccfbf1", "teal-200": "#99f6e4", "teal-300": "#5eead4", "teal-400": "#2dd4bf", "teal-500": "#14b8a6", "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59", "teal-900": "#134e4a",
  "cyan-100": "#cffafe", "cyan-200": "#a5f3fc", "cyan-300": "#67e8f9", "cyan-400": "#22d3ee", "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490", "cyan-800": "#155e75", "cyan-900": "#164e63",
  "sky-100": "#e0f2fe", "sky-200": "#bae6fd", "sky-300": "#7dd3fc", "sky-400": "#38bdf8", "sky-500": "#0ea5e9", "sky-600": "#0284c7", "sky-700": "#0369a1", "sky-800": "#075985", "sky-900": "#0c4a6e",
  "blue-100": "#dbeafe", "blue-200": "#bfdbfe", "blue-300": "#93c5fd", "blue-400": "#60a5fa", "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af", "blue-900": "#1e3a8a",
  "indigo-100": "#e0e7ff", "indigo-200": "#c7d2fe", "indigo-300": "#a5b4fc", "indigo-400": "#818cf8", "indigo-500": "#6366f1", "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-800": "#3730a3", "indigo-900": "#312e81",
  "violet-100": "#ede9fe", "violet-200": "#ddd6fe", "violet-300": "#c4b5fd", "violet-400": "#a78bfa", "violet-500": "#8b5cf6", "violet-600": "#7c3aed", "violet-700": "#6d28d9", "violet-800": "#5b21b6", "violet-900": "#4c1d95",
  "purple-100": "#f3e8ff", "purple-200": "#e9d5ff", "purple-300": "#d8b4fe", "purple-400": "#c084fc", "purple-500": "#a855f7", "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-800": "#6b21a8", "purple-900": "#581c87",
  "fuchsia-100": "#fae8ff", "fuchsia-200": "#f5d0fe", "fuchsia-300": "#f0abfc", "fuchsia-400": "#e879f9", "fuchsia-500": "#d946ef", "fuchsia-600": "#c026d3", "fuchsia-700": "#a21caf", "fuchsia-800": "#86198f", "fuchsia-900": "#701a75",
  "pink-100": "#fce7f3", "pink-200": "#fbcfe8", "pink-300": "#f472b6", "pink-400": "#f06292", "pink-500": "#ec4899", "pink-600": "#db2777", "pink-700": "#be185d", "pink-800": "#9d174d", "pink-900": "#831843",
  "rose-100": "#ffe4e6", "rose-200": "#fecdd3", "rose-300": "#fda4af", "rose-400": "#fb7185", "rose-500": "#f43f5e", "rose-600": "#e11d48", "rose-700": "#be123c", "rose-800": "#9f1239", "rose-900": "#881337",
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1", "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155", "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "zinc-50": "#fafafa", "zinc-100": "#f4f4f5", "zinc-200": "#e4e4e7", "zinc-300": "#d4d4d8", "zinc-400": "#a1a1aa", "zinc-500": "#71717a", "zinc-600": "#52525b", "zinc-700": "#3f3f46", "zinc-800": "#27272a", "zinc-900": "#18181b", "zinc-950": "#09090b",
  "neutral-50": "#fafafa", "neutral-100": "#f5f5f5", "neutral-200": "#e5e5e5", "neutral-300": "#d4d4d4", "neutral-400": "#a3a3a3", "neutral-500": "#737373", "neutral-600": "#525252", "neutral-700": "#404040", "neutral-800": "#262626", "neutral-900": "#171717", "neutral-950": "#0a0a0a",
  "stone-50": "#fafaf9", "stone-100": "#f5f5f4", "stone-200": "#e7e5e4", "stone-300": "#d6d3d1", "stone-400": "#a8a29e", "stone-500": "#78716c", "stone-600": "#57534e", "stone-700": "#44403c", "stone-800": "#292524", "stone-900": "#1c1917", "stone-950": "#0c0a09",
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db", "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151", "gray-800": "#1f2937", "gray-900": "#111827", "gray-950": "#030712",
  "black": "#000000",
  "white": "#ffffff"
};

function getHexForTailwindColor(twColor: string): string {
  if (twColor.startsWith("#") || twColor.startsWith("rgb") || twColor.startsWith("hsl")) {
    return twColor;
  }
  const colorName = twColor.split("/")[0];
  return TAILWIND_COLOR_MAP[colorName] || colorName;
}

function parseGradientStops(bgClass: string) {
  const parts = bgClass.split(" ");
  let fromColor = "#3b82f6";
  let toColor = "#1d4ed8";
  let viaColor: string | null = null;

  for (const part of parts) {
    if (part.startsWith("from-")) {
      fromColor = getHexForTailwindColor(part.replace("from-", ""));
    } else if (part.startsWith("to-")) {
      toColor = getHexForTailwindColor(part.replace("to-", ""));
    } else if (part.startsWith("via-")) {
      viaColor = getHexForTailwindColor(part.replace("via-", ""));
    }
  }
  return { fromColor, toColor, viaColor };
}

// Blook SVG builder
export function BlookSvg({ name, className = "w-12 h-12" }: { name: string; className?: string }) {
  const blook = BLOOKS[name]

  // Fallback if not configured
  if (!blook) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
        <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#fallbackGrad)" stroke="#475569" strokeWidth="3" />
        <defs>
          <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <text x="50" y="58" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">❓</text>
      </svg>
    )
  }

  // Draw default eyes based on type
  const renderEyes = () => {
    if (blook.customEyes) return blook.customEyes

    switch (blook.eyes) {
      case "default":
        return (
          <g>
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="46" r="4.5" fill="black" />
            <circle cx="66" cy="46" r="8" fill="white" />
            <circle cx="66" cy="46" r="4.5" fill="black" />
          </g>
        )
      case "cute":
        return (
          <g>
            <circle cx="34" cy="46" r="9" fill="white" />
            <circle cx="34" cy="46" r="4" fill="#000" />
            <circle cx="36" cy="43" r="2" fill="#fff" />
            <circle cx="66" cy="46" r="9" fill="white" />
            <circle cx="66" cy="46" r="4" fill="#000" />
            <circle cx="68" cy="43" r="2" fill="#fff" />
          </g>
        )
      case "spider":
        return (
          <g fill="#ef4444">
            <circle cx="32" cy="35" r="3.5" />
            <circle cx="44" cy="35" r="3.5" />
            <circle cx="56" cy="35" r="3.5" />
            <circle cx="68" cy="35" r="3.5" />
            <circle cx="35" cy="45" r="5" />
            <circle cx="65" cy="45" r="5" />
          </g>
        )
      case "alien":
        return (
          <g>
            <path d="M 22 34 Q 38 32 36 50 Q 28 50 22 34 Z" fill="black" />
            <path d="M 78 34 Q 62 32 64 50 Q 72 50 78 34 Z" fill="black" />
            <circle cx="30" cy="40" r="2.5" fill="white" />
            <circle cx="70" cy="40" r="2.5" fill="white" />
          </g>
        )
      case "cyborg":
        return (
          <g>
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="46" r="4.5" fill="black" />
            <rect x="58" y="38" width="16" height="16" rx="2" fill="#ef4444" />
            <circle cx="66" cy="46" r="4.5" fill="black" />
          </g>
        )
      case "wizard":
        return (
          <g>
            <circle cx="35" cy="48" r="7" fill="white" />
            <circle cx="35" cy="48" r="3.5" fill="#1e3a8a" />
            <circle cx="65" cy="48" r="7" fill="white" />
            <circle cx="65" cy="48" r="3.5" fill="#1e3a8a" />
            <line x1="42" y1="48" x2="58" y2="48" stroke="#facc15" strokeWidth="2.5" />
          </g>
        )
      case "cat":
        return (
          <g>
            <path d="M 25 42 Q 35 34 40 46 Q 30 48 25 42 Z" fill="#fbbf24" />
            <ellipse cx="32" cy="44" rx="2" ry="5" fill="black" />
            <path d="M 75 42 Q 65 34 60 46 Q 70 48 75 42 Z" fill="#fbbf24" />
            <ellipse cx="68" cy="44" rx="2" ry="5" fill="black" />
          </g>
        )
      default:
        return null
    }
  }

  // Draw mouth
  const renderMouth = () => {
    if (blook.customMouth) return blook.customMouth

    switch (blook.mouth) {
      case "smile":
        return <path d="M 42 63 Q 50 70 58 63" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      case "grin":
        return (
          <g>
            <path d="M 35 60 Q 50 80 65 60 Z" fill="white" stroke="black" strokeWidth="3" />
            <line x1="42" y1="60" x2="42" y2="67" stroke="black" strokeWidth="1.5" />
            <line x1="50" y1="60" x2="50" y2="70" stroke="black" strokeWidth="1.5" />
            <line x1="58" y1="60" x2="58" y2="67" stroke="black" strokeWidth="1.5" />
          </g>
        )
      case "beak":
        return <polygon points="44,52 56,52 50,68" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
      default:
        return null
    }
  }

  const { fromColor, toColor, viaColor } = parseGradientStops(blook.bg)
  const gradId = `grad-${name.replace(/[^a-zA-Z0-9]/g, "")}`
  const clipId = `clip-${name.replace(/[^a-zA-Z0-9]/g, "")}`

  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible drop-shadow-md`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fromColor} />
          {viaColor && <stop offset="50%" stopColor={viaColor} />}
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="12" y="12" width="76" height="76" rx="16" />
        </clipPath>
      </defs>

      {/* Main Base Blook box */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="16"
        fill={`url(#${gradId})`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3.5"
      />

      {/* 3D Top Glossy Highlight */}
      <path
        d="M 12 12 L 88 12 L 88 35 Q 50 45 12 35 Z"
        fill="white"
        opacity="0.12"
        clipPath={`url(#${clipId})`}
        pointerEvents="none"
      />

      {/* 3D Bottom Shading */}
      <path
        d="M 12 72 Q 50 82 88 72 L 88 88 L 12 88 Z"
        fill="black"
        opacity="0.15"
        clipPath={`url(#${clipId})`}
        pointerEvents="none"
      />

      {/* Decorations under face */}
      {blook.decorations}

      {/* Blush cheeks (for cute Blook look, only if has eyes and not "none") */}
      {blook.eyes && blook.eyes !== "none" && (
        <g opacity="0.3" pointerEvents="none">
          <ellipse cx="26" cy="53" rx="4.5" ry="2.5" fill="#f43f5e" />
          <ellipse cx="74" cy="53" rx="4.5" ry="2.5" fill="#f43f5e" />
        </g>
      )}

      {/* Face elements */}
      {renderEyes()}
      {renderMouth()}
    </svg>
  )
}


// Unified Avatar selector component
export function BoomAvatar({ name, className = "w-12 h-12" }: { name: string; className?: string }) {
  if (!name) return <div className={`${className} bg-slate-800 rounded-2xl flex items-center justify-center text-white/20`}>❓</div>

  // If starts with / or has dot, render as an image (e.g. AI Pack /images/booms/...)
  if (name.startsWith("/") || name.includes(".")) {
    return <img src={name} alt="Boom" className={`${className} object-contain`} />
  }

  // Check if it is a standard AI Pack boom which maps to an image URL
  const aiAvatarMap: Record<string, string> = {
    DeepSeek: "/images/booms/deepseek.png",
    "Microsoft Copilot": "/images/booms/copilot.png",
    Claude: "/images/booms/chatgpt.png", // Keep V2 mapping matching configuration
    ChatGPT: "/images/booms/claude.png",  // Keep V2 mapping matching configuration
    Vercel: "/images/booms/vercel.png",
    "Google Gemini": "/images/booms/gemini.png",
  }

  if (aiAvatarMap[name]) {
    return <img src={aiAvatarMap[name]} alt={name} className={`${className} object-contain`} />
  }

  // Otherwise, render cute vector Blook SVG
  return <BlookSvg name={name} className={className} />
}
