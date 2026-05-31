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
            {/* Big black slanted alien eyes */}
            <path d="M 22 34 Q 38 32 36 50 Q 28 50 22 34 Z" fill="black" />
            <path d="M 78 34 Q 62 32 64 50 Q 72 50 78 34 Z" fill="black" />
            <circle cx="30" cy="40" r="2.5" fill="white" />
            <circle cx="70" cy="40" r="2.5" fill="white" />
          </g>
        )
      case "wizard":
        return (
          <g>
            <circle cx="35" cy="48" r="7" fill="white" />
            <circle cx="35" cy="48" r="3.5" fill="#1e3a8a" />
            <circle cx="65" cy="48" r="7" fill="white" />
            <circle cx="65" cy="48" r="3.5" fill="#1e3a8a" />
            {/* Spectacles line */}
            <line x1="42" y1="48" x2="58" y2="48" stroke="#facc15" strokeWidth="2.5" />
          </g>
        )
      case "cat":
        return (
          <g>
            {/* Slanted cat eyes */}
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

  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible drop-shadow-md`}>
      <defs>
        <linearGradient id={`grad-${name.replace(/\s+/g, "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className={`stop-${blook.bg.split(" ")[0].replace("from-", "")}`} stopColor="currentColor" />
          <stop offset="100%" className={`stop-${blook.bg.split(" ").pop()?.replace("to-", "")}`} stopColor="currentColor" />
        </linearGradient>
      </defs>

      {/* Main Base Blook box */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="16"
        className={`fill-gradient bg-gradient-to-br ${blook.bg}`}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="3.5"
      />

      {/* Decorations under face */}
      {blook.decorations}

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
