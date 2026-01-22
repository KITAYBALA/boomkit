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
} from "lucide-react"

// Grade configuration with colors
const GRADES = [
    { grade: 1, label: "1st Grade", color: "bg-green-500", emoji: "🟢" },
    { grade: 2, label: "2nd Grade", color: "bg-green-500", emoji: "🟢" },
    { grade: 3, label: "3rd Grade", color: "bg-green-500", emoji: "🟢" },
    { grade: 4, label: "4th Grade", color: "bg-yellow-500", emoji: "🟡" },
    { grade: 5, label: "5th Grade", color: "bg-yellow-500", emoji: "🟡" },
    { grade: 6, label: "6th Grade", color: "bg-orange-500", emoji: "🟠" },
    { grade: 7, label: "7th Grade", color: "bg-blue-500", emoji: "🔵" },
    { grade: 8, label: "8th Grade", color: "bg-blue-500", emoji: "🔵" },
    { grade: 9, label: "9th Grade", color: "bg-purple-500", emoji: "🟣" },
    { grade: 10, label: "10th Grade", color: "bg-purple-500", emoji: "🟣" },
    { grade: 11, label: "11th Grade", color: "bg-red-500", emoji: "🔴" },
    { grade: 12, label: "12th Grade", color: "bg-red-500", emoji: "🔴" },
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

    const gradeInfo = GRADES.find((g) => g.grade === selectedGrade)
    const subjects = SUBJECTS_BY_GRADE[selectedGrade] || []

    const filteredSubjects = subjects.filter((subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-3">
                        <span className="text-4xl">🧭</span> Discover
                    </h1>
                    <p className="text-purple-300/60 font-medium mt-2">
                        Learn, play, and compete with educational games!
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowJoinModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                    >
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Join Game
                    </Button>
                    <Button
                        onClick={onCreateWithAI}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Create with AI
                    </Button>
                </div>
            </div>

            {/* Grade Selector */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <BookOpenIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-bold">Select Grade Level</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {GRADES.map((grade) => (
                        <button
                            key={grade.grade}
                            onClick={() => setSelectedGrade(grade.grade)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedGrade === grade.grade
                                ? `${grade.color} text-white shadow-lg scale-105`
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                                }`}
                        >
                            {grade.emoji} {grade.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                    placeholder="Search subjects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12"
                />
            </div>

            {/* Custom AI Sets Section */}
            {discoveredSets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-pink-400" />
                        <h3 className="text-white font-bold text-xl">My AI Sets</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {discoveredSets.map((set, index) => (
                            <Card
                                key={`ai-set-${index}`}
                                className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 group cursor-pointer overflow-hidden shadow-lg shadow-pink-500/10"
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">🤖</span>
                                            <div>
                                                <CardTitle className="text-white text-lg">{set.title}</CardTitle>
                                                <p className="text-pink-300/60 text-xs mt-1">
                                                    Grade {set.grade} • {set.questions?.length || 0} Questions
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-pink-600 text-white border-none">
                                            AI
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => onStartGame(set.grade, set.subject, "solo")}
                                            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl h-10"
                                        >
                                            <PlayIcon className="w-4 h-4 mr-2" />
                                            Play Now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((subject, index) => (
                    <Card
                        key={index}
                        className="bg-white/5 backdrop-blur-md border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer overflow-hidden"
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{subject.emoji}</span>
                                    <div>
                                        <CardTitle className="text-white text-lg">{subject.name}</CardTitle>
                                        <p className="text-white/50 text-xs mt-1">
                                            {gradeInfo?.label} • AI-generated questions
                                        </p>
                                    </div>
                                </div>
                                <Badge className={`${gradeInfo?.color} text-white border-none`}>
                                    {gradeInfo?.emoji}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onStartGame(selectedGrade, subject.name, "solo")}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-10"
                                >
                                    <PlayIcon className="w-4 h-4 mr-2" />
                                    Solo Play
                                </Button>
                                <Button
                                    onClick={() => onStartGame(selectedGrade, subject.name, "host")}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-10"
                                >
                                    <UsersIcon className="w-4 h-4 mr-2" />
                                    Host Game
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredSubjects.length === 0 && (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <SearchIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 font-bold">No subjects found</p>
                    <p className="text-white/20 text-sm">Try a different search term</p>
                </div>
            )}

            {/* Join Game Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-slate-900 border-white/20">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-blue-400" />
                                Join a Game
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-white/70 text-sm font-bold mb-2 block">
                                    Enter Game PIN
                                </label>
                                <Input
                                    placeholder="000000"
                                    value={gamePin}
                                    onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="bg-white/10 border-white/20 text-white text-center text-3xl font-mono tracking-widest h-16 rounded-xl"
                                    maxLength={6}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl"
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
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                                    Join
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
