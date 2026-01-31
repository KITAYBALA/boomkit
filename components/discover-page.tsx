"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    SearchIcon,
    PlayIcon,
    UsersIcon,
    SparklesIcon,
    BookOpenIcon,
    ChevronRightIcon,
    Gamepad2,
    Trophy,
} from "lucide-react"

// Enhanced Grade configuration with premium gradients and shadows
const GRADES = [
    { grade: 1, label: "1st Grade", gradient: "from-emerald-400 to-green-500", shadow: "shadow-emerald-500/25", emoji: "🌱" },
    { grade: 2, label: "2nd Grade", gradient: "from-green-400 to-teal-500", shadow: "shadow-green-500/25", emoji: "🌿" },
    { grade: 3, label: "3rd Grade", gradient: "from-teal-400 to-cyan-500", shadow: "shadow-teal-500/25", emoji: "🌲" },
    { grade: 4, label: "4th Grade", gradient: "from-yellow-400 to-amber-500", shadow: "shadow-amber-500/25", emoji: "⚡" },
    { grade: 5, label: "5th Grade", gradient: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/25", emoji: "🦁" },
    { grade: 6, label: "6th Grade", gradient: "from-orange-400 to-red-500", shadow: "shadow-red-500/25", emoji: "🔥" },
    { grade: 7, label: "7th Grade", gradient: "from-blue-400 to-indigo-500", shadow: "shadow-blue-500/25", emoji: "🌊" },
    { grade: 8, label: "8th Grade", gradient: "from-indigo-400 to-violet-500", shadow: "shadow-indigo-500/25", emoji: "🌌" },
    { grade: 9, label: "9th Grade", gradient: "from-violet-400 to-purple-500", shadow: "shadow-violet-500/25", emoji: "🔮" },
    { grade: 10, label: "10th Grade", gradient: "from-purple-400 to-fuchsia-500", shadow: "shadow-purple-500/25", emoji: "🧬" },
    { grade: 11, label: "11th Grade", gradient: "from-fuchsia-400 to-pink-500", shadow: "shadow-fuchsia-500/25", emoji: "🔬" },
    { grade: 12, label: "12th Grade", gradient: "from-pink-400 to-rose-500", shadow: "shadow-pink-500/25", emoji: "🎓" },
]

// Subject configuration by grade
const SUBJECTS_BY_GRADE: { [key: number]: { name: string; emoji: string }[] } = {
    1: [
        { name: "Math", emoji: "🔢" },
        { name: "Reading", emoji: "📖" },
        { name: "Writing", emoji: "✏️" },
        { name: "English Language Arts", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "Physical Education", emoji: "⚽" },
    ],
    2: [
        { name: "Math", emoji: "🔢" },
        { name: "Reading", emoji: "📖" },
        { name: "Writing", emoji: "✏️" },
        { name: "English", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "PE", emoji: "⚽" },
    ],
    3: [
        { name: "Math", emoji: "🔢" },
        { name: "English (Reading & Writing)", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
        { name: "Computer Basics", emoji: "💻" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "PE", emoji: "⚽" },
    ],
    4: [
        { name: "Math", emoji: "🔢" },
        { name: "English Language Arts", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "PE", emoji: "⚽" },
    ],
    5: [
        { name: "Math", emoji: "🔢" },
        { name: "English", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "PE", emoji: "⚽" },
    ],
    6: [
        { name: "Math", emoji: "🔢" },
        { name: "English", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "History", emoji: "📜" },
        { name: "Geography", emoji: "🗺️" },
        { name: "Computer Science / ICT", emoji: "💻" },
        { name: "Art", emoji: "🎨" },
        { name: "Music", emoji: "🎵" },
        { name: "PE", emoji: "⚽" },
    ],
    7: [
        { name: "Math (Pre-Algebra)", emoji: "🔢" },
        { name: "English", emoji: "📝" },
        { name: "Biology", emoji: "🧬" },
        { name: "History", emoji: "📜" },
        { name: "Geography", emoji: "🗺️" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
        { name: "PE", emoji: "⚽" },
    ],
    8: [
        { name: "Math (Algebra)", emoji: "🔢" },
        { name: "English", emoji: "📝" },
        { name: "Biology", emoji: "🧬" },
        { name: "Chemistry (Basics)", emoji: "⚗️" },
        { name: "History", emoji: "📜" },
        { name: "Geography", emoji: "🗺️" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
        { name: "PE", emoji: "⚽" },
    ],
    9: [
        { name: "Math (Algebra / Geometry)", emoji: "📐" },
        { name: "English Literature", emoji: "📚" },
        { name: "Biology", emoji: "🧬" },
        { name: "Chemistry", emoji: "⚗️" },
        { name: "Physics (Intro)", emoji: "⚛️" },
        { name: "History", emoji: "📜" },
        { name: "Geography", emoji: "🗺️" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
        { name: "PE", emoji: "⚽" },
    ],
    10: [
        { name: "Math (Geometry / Algebra II)", emoji: "📐" },
        { name: "English Literature", emoji: "📚" },
        { name: "Chemistry", emoji: "⚗️" },
        { name: "Physics", emoji: "⚛️" },
        { name: "Biology", emoji: "🧬" },
        { name: "History", emoji: "📜" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
        { name: "PE", emoji: "⚽" },
    ],
    11: [
        { name: "Math (Trigonometry / Pre-Calculus)", emoji: "📐" },
        { name: "English", emoji: "📚" },
        { name: "Physics", emoji: "⚛️" },
        { name: "Chemistry", emoji: "⚗️" },
        { name: "Biology", emoji: "🧬" },
        { name: "History", emoji: "📜" },
        { name: "Philosophy / Civics", emoji: "🏛️" },
        { name: "Computer Science / Programming", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
    ],
    12: [
        { name: "Math (Calculus / Advanced Math)", emoji: "📐" },
        { name: "English", emoji: "📚" },
        { name: "Physics", emoji: "⚛️" },
        { name: "Chemistry", emoji: "⚗️" },
        { name: "Biology", emoji: "🧬" },
        { name: "History", emoji: "📜" },
        { name: "Philosophy / Civics", emoji: "🏛️" },
        { name: "Computer Science", emoji: "💻" },
        { name: "Foreign Language", emoji: "🌐" },
        { name: "Electives", emoji: "📋" },
    ],
}

interface DiscoverPageProps {
    currentUser: any
    onStartGame: (grade: number, subject: string, mode: "solo" | "host") => void
    onJoinGame: () => void
    onCreateWithAI: () => void
    discoveredSets?: any[]
}

export default function DiscoverPage({
    currentUser,
    onStartGame,
    onJoinGame,
    onCreateWithAI,
    discoveredSets = [],
}: DiscoverPageProps) {
    const [selectedGrade, setSelectedGrade] = useState<number>(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [gamePin, setGamePin] = useState("")
    const [hoveredSubject, setHoveredSubject] = useState<number | null>(null)

    const gradeInfo = GRADES.find((g) => g.grade === selectedGrade)
    const subjects = SUBJECTS_BY_GRADE[selectedGrade] || []

    const filteredSubjects = subjects.filter((subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">

            {/* Header Section */}
            <div className="relative">
                {/* Decorative glow behind header */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl animate-bounce">🧭</span>
                            <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-200 drop-shadow-lg">
                                Discover
                            </h1>
                        </div>
                        <p className="text-xl text-purple-200/70 font-medium max-w-lg leading-relaxed">
                            Embark on an educational journey. Learn, play, and compete with next-gen games!
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => setShowJoinModal(true)}
                            className="h-12 px-6 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold rounded-2xl backdrop-blur-md border border-indigo-400/30 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <UsersIcon className="w-5 h-5 mr-2" />
                            Join Game
                        </Button>
                        <Button
                            onClick={onCreateWithAI}
                            className="h-12 px-6 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/30 border border-white/10 transition-all hover:scale-105 active:scale-95 group"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Create with AI
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grade Selector */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-white/10">
                        <BookOpenIcon className="w-6 h-6 text-purple-300" />
                    </div>
                    <h3 className="text-xl text-white font-bold tracking-tight">Select Grade Level</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {GRADES.map((grade) => {
                        const isSelected = selectedGrade === grade.grade
                        return (
                            <button
                                key={grade.grade}
                                onClick={() => setSelectedGrade(grade.grade)}
                                className={`
                                    relative px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ease-out
                                    flex items-center gap-2 border
                                    ${isSelected
                                        ? `bg-gradient-to-br ${grade.gradient} border-white/20 text-white scale-105 ${grade.shadow} shadow-lg ring-2 ring-white/20`
                                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white hover:-translate-y-0.5"
                                    }
                                `}
                            >
                                <span className="text-lg">{grade.emoji}</span>
                                {grade.label}
                                {isSelected && (
                                    <span className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse-slow pointer-events-none" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl mx-auto md:mx-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                        placeholder={`Search ${gradeInfo?.label} subjects...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-14 h-14 bg-slate-900/80 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 rounded-2xl text-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-xl"
                    />
                </div>
            </div>

            {/* Custom AI Sets Section */}
            {discoveredSets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-pink-400" />
                        <h3 className="text-white font-bold text-2xl tracking-tight">My AI Sets</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoveredSets.map((set, index) => (
                            <Card
                                key={`ai-set-${index}`}
                                className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 backdrop-blur-xl border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 group cursor-pointer overflow-hidden shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 hover:-translate-y-1"
                            >
                                <CardHeader className="pb-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl shadow-inner">
                                                🤖
                                            </div>
                                            <div>
                                                <CardTitle className="text-white text-lg font-bold leading-tight">{set.title}</CardTitle>
                                                <p className="text-pink-200/60 text-xs mt-1 font-medium">
                                                    Grade {set.grade} • {set.questions?.length || 0} Questions
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-pink-600 text-white border-0 shadow-lg shadow-pink-600/20 px-3 py-1">
                                            AI Generated
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button
                                        onClick={() => onStartGame(set.grade, set.subject, "solo")}
                                        className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl h-12 shadow-lg shadow-pink-900/20 transition-all border border-pink-400/20"
                                    >
                                        <PlayIcon className="w-5 h-5 mr-2 fill-current" />
                                        Play Now
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSubjects.map((subject, index) => (
                    <Card
                        key={index}
                        onMouseEnter={() => setHoveredSubject(index)}
                        onMouseLeave={() => setHoveredSubject(null)}
                        className="bg-white/5 backdrop-blur-md border-white/10 hover:border-white/30 transition-all duration-500 group cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 relative"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradeInfo?.gradient || "from-gray-700 to-gray-800"} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        {subject.emoji}
                                    </div>
                                    <div>
                                        <CardTitle className="text-white text-xl font-bold">{subject.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/50 text-[10px] px-2 py-0.5 rounded-full">
                                                {gradeInfo?.label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-2 relative z-10">
                            <div className="grid grid-cols-2 gap-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                                <Button
                                    onClick={() => onStartGame(selectedGrade, subject.name, "solo")}
                                    className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl h-11 border-b-4 border-emerald-800 hover:border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    <Gamepad2 className="w-4 h-4 mr-2" />
                                    Solo
                                </Button>
                                <Button
                                    onClick={() => onStartGame(selectedGrade, subject.name, "host")}
                                    className="bg-violet-600/90 hover:bg-violet-500 text-white font-bold rounded-xl h-11 border-b-4 border-violet-800 hover:border-violet-700 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Host
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredSubjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/20 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <SearchIcon className="w-10 h-10 text-white/30" />
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-2">No subjects found</h3>
                    <p className="text-white/40">We couldn't find any subjects matching "{searchQuery}"</p>
                    <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-purple-400 hover:text-purple-300"
                    >
                        Clear search
                    </Button>
                </div>
            )}

            {/* Join Game Modal - Enhanced */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md bg-slate-900 border-white/10 shadow-2xl shadow-purple-500/20 scale-100 animate-in zoom-in-95 duration-300">
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl rotate-3">
                                <UsersIcon className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-3xl font-black text-white">
                                Join a Game
                            </CardTitle>
                            <p className="text-white/50">Enter the 6-digit PIN to join the lobby</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <Input
                                    placeholder="000 000"
                                    value={gamePin}
                                    onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="relative bg-black/50 border-white/10 text-white text-center text-4xl font-mono tracking-[0.2em] h-20 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => setShowJoinModal(false)}
                                    className="h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (gamePin.length === 6) {
                                            onJoinGame()
                                            setShowJoinModal(false)
                                        }
                                    }}
                                    disabled={gamePin.length !== 6}
                                    className="h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                                >
                                    Join Lobby
                                    <ChevronRightIcon className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
